import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { sendChatMessage } from '@/services/documentService';
import { mockChatHistory, mockDocuments } from '@/services/mockData';
import { cn } from '@/utils/helpers';
import DocumentSelector from '@/components/DocumentSelector';
import ChatTypingIndicator from '@/components/ChatTypingIndicator';
import type { ChatMessage, Document } from '@/types';
import api from '@/services/api';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
    { icon: '⚠️', text: 'What are the main risks?' },
    { icon: '📋', text: 'Summarize this document' },
    { icon: '🔍', text: 'List all clauses' },
    { icon: '🚫', text: 'Explain the non-compete clause' },
];

export default function ChatPage() {
    const [selectedDoc, setSelectedDoc] = useState<Document>(mockDocuments[0]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatPhase, setChatPhase] = useState<'searching' | 'analyzing' | 'generating'>('searching');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Fetch existing chat session for the selected document
    useEffect(() => {
        const loadSession = async () => {
            if (!selectedDoc) return;
            
            // Clear current chat view
            setMessages([]);
            setSessionId(null);
            
            try {
                // 1. Fetch all sessions for this user
                const { data: sessions } = await api.get('/api/chat/sessions');
                
                // 2. Find the most recent session for this document
                const docSession = sessions.find((s: any) => 
                    s.documentIds && s.documentIds.includes(selectedDoc.id)
                );
                
                if (docSession) {
                    // 3. Fetch full session details including messages
                    const { data: sessionDetails } = await api.get(`/api/chat/sessions/${docSession._id}`);
                    
                    setSessionId(sessionDetails.session._id);
                    setMessages(sessionDetails.messages.map((msg: any) => ({
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
    }, [selectedDoc.id]);

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
                    documentIds: [selectedDoc.id]
                }),
            });

            if (!response.body) throw new Error('No readable stream');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let done = false;
            let currentAssistantContent = "";
            let currentToolCall = "";
            let buffer = "";
            
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
                                    currentToolCall = `[Action: ${data.name} - searching for "${data.query}"]\n\n`;
                                    setMessages((prev) => prev.map(msg => 
                                        msg.id === assistantMsgId ? { ...msg, content: currentAssistantContent + currentToolCall } : msg
                                    ));
                                } else if (data.type === 'content') {
                                    setChatPhase('generating');
                                    currentAssistantContent += data.content;
                                    setMessages((prev) => prev.map(msg => 
                                        msg.id === assistantMsgId ? { ...msg, content: currentAssistantContent } : msg
                                    ));
                                } else if (data.type === 'error') {
                                    console.error('Chat stream error:', data.message);
                                }
                            } catch (e) {
                                // ignore parse errors on invalid JSON
                            }
                        }
                    }
                }
            }
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
                        selectedId={selectedDoc.id}
                        onSelect={setSelectedDoc}
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
