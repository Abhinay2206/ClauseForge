import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTickets, updateTicket } from '@/services/supportService';
import { LifeBuoy, AlertCircle, Clock } from 'lucide-react';
import GlobalLoader from '@/components/GlobalLoader';

export default function AdminSupportPage() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const data = await getAllTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to load tickets', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <GlobalLoader message="Loading Support Desk..." fullScreen={false} />;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <LifeBuoy className="text-purple-600" size={24} />
                        Support Desk
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Manage user tickets and inquiries</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Ticket</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tickets.map((ticket) => (
                                <tr 
                                    key={ticket._id} 
                                    onClick={() => navigate(`/admin/support/${ticket._id}`)}
                                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900 text-sm">{ticket.title}</div>
                                        <div className="text-xs text-slate-500 mt-0.5 capitalize">{ticket.category.replace('_', ' ')}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                            ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                            ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {ticket.priority === 'urgent' || ticket.priority === 'high' ? <AlertCircle size={12} /> : null}
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-900">{ticket.user?.name || ticket.name || 'Public User'}</div>
                                        <div className="text-xs text-slate-500">{ticket.user?.email || ticket.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 flex items-center gap-1.5">
                                            <Clock size={14} className="text-slate-400" />
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tickets.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            <LifeBuoy size={48} className="mx-auto text-slate-300 mb-3" />
                            <p>No tickets in the queue.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
