import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById, replyToTicket, updateTicket, draftTicketReply } from '@/services/supportService';
import { useAuthStore } from '@/store/authStore';
import { io, Socket } from 'socket.io-client';
import { Send, ArrowLeft, Bot, ShieldCheck, User, LifeBuoy, Clock, AlertCircle } from 'lucide-react';
import GlobalLoader from '@/components/GlobalLoader';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SupportTicketPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [ticket, setTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [drafting, setDrafting] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isAdmin = user && ['admin', 'moderator', 'support'].includes(user.role);

    useEffect(() => {
        fetchData();
        
        // Setup WebSockets
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
        });
        
        newSocket.on('connect', () => {
            newSocket.emit('join_ticket', id);
        });

        newSocket.on('receive_message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit('leave_ticket', id);
            newSocket.disconnect();
        };
    }, [id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchData = async () => {
        try {
            if (!id) return;
            const data = await getTicketById(id);
            setTicket(data.ticket);
            setMessages(data.messages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !id) return;

        try {
            const msg = await replyToTicket(id, newMessage, isInternal);
            // In a real app, the server would broadcast 'receive_message', but for now we append locally if not broadcasted
            setMessages(prev => [...prev, msg]);
            setNewMessage('');
            setIsInternal(false);
        } catch (error) {
            console.error('Failed to send reply', error);
        }
    };

    const handleDraftAI = async () => {
        if (!id) return;
        setDrafting(true);
        try {
            const draft = await draftTicketReply(id);
            setNewMessage(draft);
        } catch (error) {
            console.error('Failed to draft reply', error);
        } finally {
            setDrafting(false);
        }
    };

    const handleStatusChange = async (status: string) => {
        if (!id) return;
        try {
            await updateTicket(id, { status });
            setTicket({ ...ticket, status });
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    if (loading) return <GlobalLoader message="Loading ticket..." fullScreen={false} />;
    if (!ticket) return <div className="p-8 text-center">Ticket not found</div>;

    return (
        <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">{ticket.title}</h1>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                        ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                        ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {ticket.status.replace('_', ' ')}
                    </span>
                    {isAdmin && (
                        <select 
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="text-xs border border-slate-300 rounded px-2 py-1 bg-white outline-none"
                        >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="waiting_for_response">Waiting for Response</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                {/* AI Summary Banner for Admins */}
                {isAdmin && ticket.aiSummary && (
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex gap-3 text-sm text-purple-900">
                        <Bot className="shrink-0 text-purple-500 mt-0.5" size={18} />
                        <div>
                            <p className="font-semibold mb-1">AI Triage Summary</p>
                            <p className="text-purple-700">{ticket.aiSummary}</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isSelf = msg.sender?._id === user?.id || (!msg.sender && !user);
                    const isAgent = msg.senderType === 'agent' || msg.senderType === 'system';
                    
                    return (
                        <div key={i} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 ${
                                msg.isInternalNote ? 'bg-amber-50 border border-amber-200 text-amber-900' :
                                isSelf ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                            }`}>
                                <div className={`flex items-center gap-2 mb-2 text-xs font-semibold ${
                                    msg.isInternalNote ? 'text-amber-700' :
                                    isSelf ? 'text-blue-100' : 'text-slate-500'
                                }`}>
                                    {isAgent && !isSelf ? <ShieldCheck size={14} /> : <User size={14} />}
                                    {msg.sender?.name || (msg.senderType === 'public' ? 'Public User' : 'System')}
                                    {msg.isInternalNote && <span className="uppercase tracking-wider ml-2 bg-amber-200 px-1.5 py-0.5 rounded text-[10px]">Internal Note</span>}
                                </div>
                                <div className="text-[14px] whitespace-pre-wrap">{msg.content}</div>
                                <div className={`text-[10px] mt-2 text-right ${isSelf && !msg.isInternalNote ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {ticket.status !== 'closed' && (
                <div className="p-4 bg-white border-t border-slate-200">
                    <form onSubmit={handleSend}>
                        <div className="flex items-end gap-3">
                            <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all bg-white relative">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isInternal ? "Add an internal note..." : "Type your reply..."}
                                    className={`w-full max-h-32 p-3 outline-none resize-none text-sm ${isInternal ? 'bg-amber-50 placeholder:text-amber-400' : ''}`}
                                    rows={2}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                />
                                {isAdmin && (
                                    <div className="absolute bottom-2 left-3 flex gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsInternal(!isInternal)}
                                            className={`text-[11px] font-bold px-2 py-1 rounded transition-colors ${isInternal ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            INTERNAL NOTE
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={handleDraftAI}
                                            disabled={drafting}
                                            className="text-[11px] font-bold px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-1"
                                        >
                                            <Bot size={12} /> {drafting ? 'DRAFTING...' : 'AI DRAFT'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button 
                                type="submit" 
                                disabled={!newMessage.trim()}
                                className="h-12 w-12 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                            >
                                <Send size={20} className="ml-1" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {ticket.status === 'closed' && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-slate-500 text-sm">
                    This ticket has been closed. If you need further assistance, please open a new ticket.
                </div>
            )}
        </div>
    );
}
