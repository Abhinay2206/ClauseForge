import { useState } from 'react';
import { createTicket } from '@/services/supportService';
import { Search, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicHelpPage() {
    const [form, setForm] = useState({ name: '', email: '', title: '', description: '', category: 'general_inquiry' });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await createTicket({ ...form, isPublic: true });
            setSuccess(true);
            setForm({ name: '', email: '', title: '', description: '', category: 'general_inquiry' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <span className="font-bold">C</span>
                        </div>
                        <span className="font-bold text-slate-900">ClauseForge Help Center</span>
                    </div>
                    <nav className="flex items-center gap-4 text-sm font-medium">
                        <Link to="/" className="text-slate-600 hover:text-slate-900">Back to App</Link>
                        <Link to="/login" className="text-blue-600 hover:text-blue-700">Sign In</Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <div className="bg-blue-600 py-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">How can we help you?</h1>
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search knowledge base articles..." 
                            className="w-full pl-12 pr-4 py-4 rounded-xl text-lg outline-none focus:ring-4 focus:ring-blue-400/50 transition-all shadow-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
                {/* FAQs / Articles (Placeholder for now) */}
                <div className="md:col-span-2">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Popular Articles</h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
                        <p>Our knowledge base is currently being updated.</p>
                        <p className="text-sm mt-2">Please use the contact form if you need immediate assistance.</p>
                    </div>
                </div>

                {/* Contact Form */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Mail size={20} className="text-blue-600" />
                        Contact Support
                    </h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        {success ? (
                            <div className="text-center py-8">
                                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Request Submitted!</h3>
                                <p className="text-slate-600 text-sm">We've received your message and will get back to you shortly.</p>
                                <button 
                                    onClick={() => setSuccess(false)}
                                    className="mt-6 text-blue-600 text-sm font-medium hover:underline"
                                >
                                    Submit another request
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                    <input 
                                        required
                                        value={form.name}
                                        onChange={e => setForm({...form, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input 
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={e => setForm({...form, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                    <input 
                                        required
                                        value={form.title}
                                        onChange={e => setForm({...form, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Issue</label>
                                    <textarea 
                                        required
                                        value={form.description}
                                        onChange={e => setForm({...form, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Send Message'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
