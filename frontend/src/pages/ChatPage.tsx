import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/utils/helpers';
import DocumentSelector from '@/components/DocumentSelector';
import ChatTypingIndicator from '@/components/ChatTypingIndicator';
import { useDocumentStore } from '@/store/documentStore';
import type { ChatMessage } from '@/types';
import api from '@/services/api';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
    { icon: '⚠️', text: 'What are the main risks?' },
    { icon: '📋', text: 'Summarize this document' },
    { icon: '🔍', text: 'List all clauses' },
    { icon: '🚫', text: 'Explain the non-compete clause' },
];

const WORD_STREAM_INTERVAL_MS = 35;

type ChatSessionSummary = {
    _id: string;
    documentIds?: string[];
};

type ChatSessionDetails = {
    session: {
        _id: string;
    };
    messages: Array<{
        _id: string;
        role: ChatMessage['role'];
        content: string;
        createdAt: string;
    }>;
};

export default function ChatPage() {
    const { documents, fetchDocuments } = useDocumentStore();
    const [selectedDocId, setSelectedDocId] = useState<string>('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatPhase, setChatPhase] = useState<'searching' | 'analyzing' | 'generating'>('searching');
    const bottomRef = useRef<HTMLDivElement>(null);
    const assistantContentRef = useRef('');
    const pendingStreamTextRef = useRef('');
    const wordQueueRef = useRef<string[]>([]);
    const wordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const drainResolversRef = useRef<Array<() => void>>([]);

    useEffect(() => {
        fetchDocuments(true);
    }, [fetchDocuments]);

    useEffect(() => {
        if (!selectedDocId && documents.length > 0) {
            setSelectedDocId(documents[0].id);
        }
    }, [documents, selectedDocId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        return () => {
            if (wordTimerRef.current) {
                clearTimeout(wordTimerRef.current);
            }
        };
    }, []);

    const resolveWordDrainWaiters = () => {
        if (
            wordQueueRef.current.length > 0 ||
            pendingStreamTextRef.current.length > 0 ||
            wordTimerRef.current
        ) {
            return;
        }

        drainResolversRef.current.splice(0).forEach((resolve) => resolve());
    };

    const updateAssistantMessage = (assistantMsgId: string, content: string) => {
        setMessages((prev) => prev.map(msg =>
            msg.id === assistantMsgId ? { ...msg, content } : msg
        ));
    };

    const revealNextQueuedWord = (assistantMsgId: string) => {
        const nextWord = wordQueueRef.current.shift();

        if (!nextWord) {
            wordTimerRef.current = null;
            resolveWordDrainWaiters();
            return;
        }

        assistantContentRef.current += nextWord;
        updateAssistantMessage(assistantMsgId, assistantContentRef.current);

        wordTimerRef.current = setTimeout(() => {
            revealNextQueuedWord(assistantMsgId);
        }, WORD_STREAM_INTERVAL_MS);
    };

    const scheduleWordReveal = (assistantMsgId: string) => {
        if (!wordTimerRef.current && wordQueueRef.current.length > 0) {
            revealNextQueuedWord(assistantMsgId);
        }
    };

    const enqueueAssistantText = (assistantMsgId: string, text: string, flush = false) => {
        pendingStreamTextRef.current += text;

        const source = pendingStreamTextRef.current;
        const words: string[] = [];
        const wordPattern = /\s*\S+\s*/g;
        let consumed = 0;
        let match: RegExpExecArray | null;

        while ((match = wordPattern.exec(source)) !== null) {
            const word = match[0];
            const endsAtSourceEnd = wordPattern.lastIndex === source.length;
            const mayBePartialWord = endsAtSourceEnd && !/\s$/.test(word);

            if (mayBePartialWord && !flush) {
                break;
            }

            words.push(word);
            consumed = wordPattern.lastIndex;
        }

        if (flush && consumed < source.length) {
            words.push(source.slice(consumed));
            consumed = source.length;
        }

        pendingStreamTextRef.current = source.slice(consumed);

        if (words.length > 0) {
            wordQueueRef.current.push(...words);
            scheduleWordReveal(assistantMsgId);
        } else {
            resolveWordDrainWaiters();
        }
    };

    const waitForWordDrain = () => {
        if (
            wordQueueRef.current.length === 0 &&
            pendingStreamTextRef.current.length === 0 &&
            !wordTimerRef.current
        ) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
            drainResolversRef.current.push(resolve);
        });
    };

    // Fetch existing chat session for the selected document
    useEffect(() => {
        const loadSession = async () => {
            if (!selectedDocId) return;
            
            // Clear current chat view
            setMessages([]);
            setSessionId(null);
            
            try {
                // 1. Fetch all sessions for this user
                const { data: sessions } = await api.get<ChatSessionSummary[]>('/api/chat/sessions');
                
                // 2. Find the most recent session for this document
                const docSession = sessions.find((s) =>
                    s.documentIds && s.documentIds.includes(selectedDocId)
                );
                
                if (docSession) {
                    // 3. Fetch full session details including messages
                    const { data: sessionDetails } = await api.get<ChatSessionDetails>(`/api/chat/sessions/${docSession._id}`);
                    
                    setSessionId(sessionDetails.session._id);
                    setMessages(sessionDetails.messages.map((msg) => ({
                        id: msg._id,
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.createdAt,
                    })));
                }
            } catch (error) {
                console.error('Failed to load chat session:', error);
            }
        };

        loadSession();
    }, [selectedDocId]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping) return;
        
        const userMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };
        
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        setChatPhase('searching');
        assistantContentRef.current = '';
        pendingStreamTextRef.current = '';
        wordQueueRef.current = [];
        drainResolversRef.current = [];
        if (wordTimerRef.current) {
            clearTimeout(wordTimerRef.current);
            wordTimerRef.current = null;
        }
        
        // Add a temporary empty assistant message that we will stream into
        const assistantMsgId = `msg-${Date.now() + 1}`;
        setMessages((prev) => [...prev, {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
        }]);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    sessionId: sessionId,
                    content: text,
                    documentIds: selectedDocId ? [selectedDocId] : []
                }),
            });

            if (!response.body) throw new Error('No readable stream');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let done = false;
            let buffer = "";
            let hasStartedAssistantContent = false;
            
            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;
                    
                    let newlineIndex;
                    while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
                        const line = buffer.slice(0, newlineIndex).trim();
                        buffer = buffer.slice(newlineIndex + 1);
                        
                        if (line.startsWith('data: ')) {
                            const dataStr = line.substring(6);
                            if (dataStr === '[DONE]') {
                                done = true;
                                break;
                            }
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.type === 'session_info') {
                                    setSessionId(data.sessionId);
                                } else if (data.type === 'tool_call') {
                                    setChatPhase('analyzing');
                                    assistantContentRef.current = `[Action: ${data.name} - searching for "${data.query}"]\n\n`;
                                    pendingStreamTextRef.current = '';
                                    wordQueueRef.current = [];
                                    updateAssistantMessage(assistantMsgId, assistantContentRef.current);
                                } else if (data.type === 'content') {
                                    setChatPhase('generating');
                                    if (!hasStartedAssistantContent) {
                                        hasStartedAssistantContent = true;
                                        assistantContentRef.current = '';
                                        updateAssistantMessage(assistantMsgId, '');
                                    }
                                    enqueueAssistantText(assistantMsgId, data.content);
                                } else if (data.type === 'error') {
                                    console.error('Chat stream error:', data.message);
                                }
                            } catch {
                                // ignore parse errors on invalid JSON
                            }
                        }
                    }
                }
            }
            enqueueAssistantText(assistantMsgId, '', true);
            await waitForWordDrain();
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [...prev, {
                id: `msg-${Date.now() + 2}`,
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request.',
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-7.5rem)]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 animate-fade-slide-up shrink-0">
                <div className="flex-1 min-w-0">
                    <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A] mb-3">AI Assistant</h1>
                    <DocumentSelector
                        selectedId={selectedDocId}
                        onSelect={(doc) => setSelectedDocId(doc.id)}
                        label="Discussing"
                    />
                </div>
            </div>

            {/* Message list */}
            <div className="flex-1 cf-card overflow-y-auto chat-scroll p-4 space-y-4 animate-fade-in min-h-0">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            'flex gap-3 animate-fade-slide-up',
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {msg.role === 'assistant' && (
                            <div className="h-8 w-8 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shrink-0 mt-0.5">
                                <Bot size={15} />
                            </div>
                        )}

                        <div className={cn(
                            'max-w-[75%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed',
                            msg.role === 'user'
                                ? 'bg-[#0F172A] text-white rounded-br-sm'
                                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] rounded-bl-sm markdown-body'
                        )}>
                            {msg.role === 'user' ? (
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            ) : (
                                <ReactMarkdown>
                                    {msg.content}
                                </ReactMarkdown>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="h-8 w-8 rounded-xl bg-[#E2E8F0] flex items-center justify-center text-[#475569] shrink-0 mt-0.5">
                                <User size={15} />
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex gap-3 justify-start animate-fade-in mt-4">
                        <ChatTypingIndicator phase={chatPhase} />
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mt-3 shrink-0 animate-fade-in">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s.text}
                            onClick={() => setInput(s.text)}
                            className="flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#475569] hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all"
                        >
                            <span>{s.icon}</span>
                            {s.text}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="mt-3 cf-card flex items-center gap-3 px-4 py-3 shrink-0">
                <Sparkles size={15} className="text-[#CBD5E1] shrink-0" />
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about this document…"
                    className="flex-1 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none"
                />
                <button
                    id="chat-send-btn"
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="cf-btn cf-btn-primary p-2.5 h-auto disabled:opacity-40"
                >
                    <Send size={15} />
                </button>
            </div>
        </div>
    );
}
