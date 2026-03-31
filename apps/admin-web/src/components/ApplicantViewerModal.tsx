import React, { useState } from 'react';
import { X, Search, Download, ExternalLink, MessageCircle, User as UserIcon, Filter } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  employer: string;
}

// Mock Data for presentation
const MOCK_APPLICANTS = [
  { id: 1, name: 'Alice Walker', email: 'alice@example.com', status: 'Applied', date: '2026-03-29', experience: 'Mid Level', link: 'https://github.com/alice' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'Interviewed', date: '2026-03-25', experience: 'Senior', link: 'https://linkedin.com/in/bob' },
  { id: 3, name: 'Charlie Davis', email: 'charlie@example.com', status: 'Under Review', date: '2026-03-30', experience: 'Entry Level', link: 'https://charliedavis.dev' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', status: 'Offered', date: '2026-03-20', experience: 'Senior', link: 'https://diana-portfolio.com' },
  { id: 5, name: 'Evan Wright', email: 'evan@example.com', status: 'Rejected', date: '2026-03-15', experience: 'Student', link: 'https://github.com/evan' },
];

const STATUS_COLORS: Record<string, string> = {
  'Applied': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Under Review': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Interviewed': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Offered': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Hired': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const ApplicantViewerModal = ({ isOpen, onClose, jobTitle, employer }: Props) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  if (!isOpen) return null;

  const filteredApplicants = MOCK_APPLICANTS.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a0f1c] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 bg-[#111524] flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <UserIcon className="w-7 h-7 text-violet-400" />
              Applicant Viewer
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Reviewing candidates for <span className="text-blue-400 font-bold">{jobTitle}</span> at <span className="text-white">{employer}</span>
            </p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
             <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-bold text-white transition-colors">
                <Download className="w-4 h-4 text-emerald-400" /> Export CSV
             </button>
             <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-6 flex gap-4 border-b border-white/5 shrink-0 bg-[#0d1326]">
           <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
             <input 
               type="text" 
               placeholder="Search applicants by name or email..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full bg-[#161a29] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-violet-500 outline-none transition-colors"
             />
           </div>
           <div className="relative">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
             <select 
               value={statusFilter}
               onChange={e => setStatusFilter(e.target.value)}
               className="appearance-none bg-[#161a29] border border-white/5 rounded-xl py-3 pl-11 pr-10 text-sm text-white focus:border-violet-500 outline-none transition-colors font-semibold cursor-pointer"
             >
               <option value="All">All Statuses</option>
               <option value="Applied">Applied</option>
               <option value="Under Review">Under Review</option>
               <option value="Interviewed">Interviewed</option>
               <option value="Offered">Offered</option>
               <option value="Hired">Hired</option>
               <option value="Rejected">Rejected</option>
             </select>
           </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-[#0a0f1c] custom-scrollbar p-6">
           <div className="border border-white/5 rounded-2xl overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#111524] text-xs uppercase tracking-widest text-gray-500 font-bold">
                    <th className="p-4 border-b border-white/5">Applicant</th>
                    <th className="p-4 border-b border-white/5">Applied On</th>
                    <th className="p-4 border-b border-white/5">Experience</th>
                    <th className="p-4 border-b border-white/5">Status</th>
                    <th className="p-4 border-b border-white/5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredApplicants.length > 0 ? filteredApplicants.map(app => (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors group">
                       <td className="p-4">
                         <p className="font-bold text-white group-hover:text-blue-300 transition-colors">{app.name}</p>
                         <p className="text-xs text-gray-500">{app.email}</p>
                       </td>
                       <td className="p-4 text-sm text-gray-400">{app.date}</td>
                       <td className="p-4 text-sm font-medium text-gray-300">{app.experience}</td>
                       <td className="p-4">
                         <span className={`px-3 py-1 text-xs font-bold uppercase rounded-md border ${STATUS_COLORS[app.status]}`}>
                           {app.status}
                         </span>
                       </td>
                       <td className="p-4">
                         <div className="flex items-center justify-center gap-2">
                            <button className="p-2 bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-gray-400 rounded-lg transition-colors tooltip" title="Message">
                               <MessageCircle className="w-4 h-4" />
                            </button>
                            <a href={app.link} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-gray-400 rounded-lg transition-colors tooltip" title="View Portfolio">
                               <ExternalLink className="w-4 h-4" />
                            </a>
                            <select className="bg-[#161a29] border border-white/10 text-xs text-gray-300 rounded-lg p-2 outline-none cursor-pointer">
                              <option>Update Status...</option>
                              <option>Applied</option>
                              <option>Under Review</option>
                              <option>Interviewed</option>
                              <option>Offered</option>
                              <option>Hired</option>
                              <option>Rejected</option>
                            </select>
                         </div>
                       </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={5} className="p-12 text-center text-gray-500">
                         <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                         <p>No applicants found matching your criteria.</p>
                       </td>
                    </tr>
                  )}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};
