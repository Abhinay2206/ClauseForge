import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTickets, createTicket } from '@/services/supportService';
import { Plus, MessageSquare, AlertCircle, ChevronRight } from 'lucide-react';
import GlobalLoader from '@/components/GlobalLoader';

export default function SupportPage() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: '', description: '', category: 'general_inquiry' });

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const data = await getMyTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to load tickets', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTicket(newTicket);
            setShowNew(false);
            setNewTicket({ title: '', description: '', category: 'general_inquiry' });
            fetchTickets();
        } catch (error) {
            console.error('Failed to create ticket', error);
        }
    };

    if (loading) return <GlobalLoader message="Loading your tickets..." fullScreen={false} />;

    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Support Center</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your support requests</p>
                </div>
                <button
                    onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={16} /> New Ticket
                </button>
            </div>

            {showNew && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-fade-in">
                    <h2 className="text-lg font-semibold mb-4">Create Support Request</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                            <input 
                                required
                                value={newTicket.title}
                                onChange={e => setNewTicket({...newTicket, title: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                                placeholder="Brief summary of your issue"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select 
                                value={newTicket.category}
                                onChange={e => setNewTicket({...newTicket, category: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                            >
                                <option value="general_inquiry">General Inquiry</option>
                                <option value="technical_support">Technical Support</option>
                                <option value="billing">Billing</option>
                                <option value="bug_reports">Bug Report</option>
                                <option value="feature_requests">Feature Request</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea 
                                required
                                value={newTicket.description}
                                onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm h-32 resize-none"
                                placeholder="Describe your issue in detail..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setShowNew(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                            >
                                Submit Request
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {tickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <MessageSquare size={48} className="mx-auto text-slate-300 mb-3" />
                        <p>No support tickets yet.</p>
                        <p className="text-sm mt-1">If you need help, click 'New Ticket' above.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {tickets.map(ticket => (
                            <li 
                                key={ticket._id} 
                                onClick={() => navigate(`/support/${ticket._id}`)}
                                className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-[15px] font-semibold text-slate-900">{ticket.title}</h3>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                            ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                            ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-slate-500 flex items-center gap-2">
                                        <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
                                        <span>•</span>
                                        <span>Opened {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </p>
                                </div>
                                <div className="text-slate-400">
                                    <ChevronRight size={20} />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
