import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Bot, User } from 'lucide-react';

export const ChatViewer = ({ conversationId }: { conversationId: string }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!conversationId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('conversation_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
            
            if (!error && data) {
                setMessages(data);
            }
            setLoading(false);
        };
        fetchMessages();
    }, [conversationId]);

    if (loading) return <div className="text-gray-500 animate-pulse text-sm">Syncing Transcript...</div>;
    
    if (messages.length === 0) return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <Bot size={32} className="text-gray-600 mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Transcript Available</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#0a0f1c] rounded-2xl border border-white/5 overflow-hidden">
            <div className="bg-[#111524] px-6 py-4 border-b border-white/10 shrink-0 flex items-center justify-between">
                <div>
                    <h3 className="font-black italic text-xl text-white">AI-powered Career Matchmaking</h3>
                    <p className="text-blue-500 font-bold text-[10px] tracking-widest uppercase">AI Coach: Dahlia</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 font-bold text-[10px] tracking-widest uppercase mb-1">Session Identity</p>
                    <p className="text-gray-600 font-mono text-[8px] truncate w-32">{conversationId}</p>
                </div>
            </div>

            <div className="text-center py-4 bg-[#0d1326] shrink-0 border-b border-white/5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 italic">Transcript Synchronization Complete</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.map((msg, idx) => {
                    const isAi = msg.role === 'assistant' || msg.role === 'bot' || msg.role === 'system';
                    
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const isSameRoleAsPrev = prevMsg && (
                        (isAi && (prevMsg.role === 'assistant' || prevMsg.role === 'bot' || prevMsg.role === 'system')) ||
                        (!isAi && prevMsg.role === 'user')
                    );

                    return (
                        <div key={msg.id || idx} className={`flex items-end gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'} ${isSameRoleAsPrev ? 'mt-1' : 'mt-6'}`}>
                            <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center transition-opacity ${isSameRoleAsPrev ? 'opacity-0' : 'opacity-100'} ${isAi ? 'bg-blue-600' : 'bg-white/10'}`}>
                                {!isSameRoleAsPrev && (isAi ? <Bot size={16} className="text-white" /> : <User size={16} className="text-gray-400" />)}
                            </div>

                            <div className={`
                                max-w-[80%] p-5 rounded-3xl leading-relaxed text-[15px] shadow-sm
                                ${isAi 
                                    ? 'bg-[#161a29] text-blue-50 border border-blue-500/20 rounded-bl-sm' 
                                    : 'bg-[#1e2336] text-white border border-white/10 rounded-br-sm'}
                            `}>
                                <p className="whitespace-pre-wrap font-medium">{msg.content || msg.message}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
