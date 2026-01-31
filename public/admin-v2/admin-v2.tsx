import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Users, Ticket, Key, FileText, Trash2, RotateCcw, 
  Ban, Search, Plus, RefreshCw, Copy, CheckCircle, 
  AlertTriangle, ChevronRight, ChevronDown, Activity, X, Sliders, Wifi,
  Eye, EyeOff, Info, LogOut, PanelLeftClose, 
  PanelLeftOpen, Calendar, Clock, Send, Filter, Globe
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import gsap from 'gsap';

// --- INLINED COMPONENTS (Previously external) ---

const RuaLogo = ({ className = "" }: { className?: string }) => {
  const lineRef = useRef<SVGPathElement>(null);
  
  useEffect(() => {
    if (lineRef.current) {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
      tl.fromTo(lineRef.current, 
        { strokeDasharray: 400, strokeDashoffset: 400, opacity: 0.5 },
        { strokeDashoffset: 0, opacity: 1, duration: 1.2, ease: "power2.out" }
      ).to(lineRef.current, 
        { opacity: 0.6, duration: 0.8 }
      );
    }
  }, []);

  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M55 130 L90 35 Q100 10 110 35 L145 130" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
      <path d="M10 95 H 45 L 60 65 L 80 115 L 100 55 L 115 95 H 190" stroke="#050505" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <path ref={lineRef} d="M10 95 H 45 L 60 65 L 80 115 L 100 55 L 115 95 H 190" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const BrickLoader = () => {
  return (
    <div className="fixed bottom-0 right-0 pointer-events-none z-0 p-8 lg:p-12 opacity-30 mix-blend-screen">
      <svg width="120" height="120" viewBox="0 0 100 100" overflow="visible">
        {/* Set 1 */}
        <g>
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '0s' }} x="5" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '0.15s' }} x="53" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '0.3s' }} x="29" y="32" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </g>
        {/* Set 2 (Offset by 2s for continuous flow) */}
        <g>
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '2s' }} x="5" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '2.15s' }} x="53" y="60" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="rua-brick-anim text-primary" style={{ animationDelay: '2.3s' }} x="29" y="32" width="42" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};

// --- TYPES (MATCHING API DOCS) ---

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
}

interface UserEmailStats {
  userId: string;
  username: string;
  email: string;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  lastEmailSentAt: string | null;
  emailLimit: {
    dailyLimit: number;
    emailsSentToday: number;
    remainingToday: number;
  };
}

interface MailLog {
  id: number;
  userId: string;
  recipient: string;
  subject: string;
  status: string; // 'success' | 'failed' | ...
  sentAt: string;
  error: string | null;
}

interface GlobalStats {
  totalEmailsSent: number;
  totalEmailsFailed: number;
  successRate: number;
  last24Hours: {
    sent: number;
    failed: number;
  };
  lastEmailSentAt: string;
}

type TabType = 'invites' | 'users' | 'api' | 'logs';
type Lang = 'en' | 'zh';

// --- MOCK DATA FALLBACK ---
// This ensures the UI works even if the backend is offline or returns 404s
const getMockData = (endpoint: string, options: RequestInit) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[MOCK] Serving request for: ${endpoint}`);
      
      if (endpoint.includes('/auth/login')) {
        resolve({ success: true, token: 'mock-demo-token-active' });
        return;
      }

      // INVITES
      if (endpoint.includes('/admin/invite-codes')) {
        if (options.method === 'POST') resolve({ success: true, inviteCode: { id: 'new', code: 'RUA-NEW-CODE' } });
        else if (options.method === 'DELETE') resolve({ success: true });
        else resolve({ 
          success: true, 
          inviteCodes: [
            { id: '1', code: 'RUA-VIP-2026', maxUses: 100, usedCount: 42, expiresAt: new Date(Date.now() + 86400000 * 60).toISOString(), createdAt: new Date().toISOString() },
            { id: '2', code: 'RUA-TEST-DEV', maxUses: 10, usedCount: 10, expiresAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date().toISOString() },
            { id: '3', code: 'RUA-GUEST-001', maxUses: 5, usedCount: 1, expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(), createdAt: new Date().toISOString() }
          ] 
        });
        return;
      }

      // USER DETAILS / STATS (Specific routes first)
      if (endpoint.includes('/email-stats') && !endpoint.includes('/admin/email-stats')) {
        resolve({ 
          success: true, 
          data: { 
            userId: 'u1', username: 'MockUser', email: 'user@example.com', 
            totalEmailsSent: 154, totalEmailsFailed: 3, lastEmailSentAt: new Date().toISOString(), 
            emailLimit: { dailyLimit: 50, emailsSentToday: 12, remainingToday: 38 } 
          } 
        });
        return;
      }

      // USERS LIST (Must match exactly or with query params, NOT sub-paths like /users/123)
      // Check if endpoint is exactly /admin/users OR starts with /admin/users?
      // AND ensure it doesn't have extra slashes for sub-resources if logic was different
      if (endpoint === '/admin/users' || endpoint.startsWith('/admin/users?')) {
        resolve({ 
          success: true, 
          users: [
            { id: 'u1', username: 'admin_core', email: 'admin@rualive.com', role: 'admin', createdAt: '2025-11-01T12:00:00Z' },
            { id: 'u2', username: 'neon_rider', email: 'neo@matrix.com', role: 'user', createdAt: '2026-01-10T15:30:00Z' },
            { id: 'u3', username: 'glitch_phantom', email: 'ghost@shell.net', role: 'user', createdAt: '2026-01-28T09:15:00Z' }
          ] 
        });
        return;
      }

      // API KEY
      if (endpoint.includes('/admin/api-key')) {
        resolve({ success: true, apiKey: 're_123456789_mock_key_visible' });
        return;
      }

      // GLOBAL STATS
      if (endpoint.includes('/admin/email-stats')) {
        resolve({ 
          success: true, 
          data: { 
            totalEmailsSent: 1337, totalEmailsFailed: 42, successRate: 96.8, 
            last24Hours: { sent: 128, failed: 2 }, lastEmailSentAt: new Date().toISOString() 
          } 
        });
        return;
      }

      // LOGS
      if (endpoint.includes('/logs')) {
        resolve({ 
          success: true, 
          logs: Array.from({length: 12}).map((_, i) => ({ 
            id: i, userId: `u${i%3 + 1}`, recipient: `target_${i}@corp.com`, 
            subject: i % 3 === 0 ? 'Urgent Alert' : 'Weekly Digest', 
            status: i === 2 ? 'failed' : 'success', 
            sentAt: new Date(Date.now() - i * 3600000).toISOString(), 
            error: i === 2 ? 'SMTP Connection Timeout' : null 
          })) 
        });
        return;
      }
      
      // Default Generic Success (For Delete/Update actions that don't return data)
      resolve({ success: true, message: "Mock Action Successful" });
    }, 400); // Simulate network latency
  });
};

// --- API CLIENT ---

const USE_MOCK = false; // 生产环境禁用Mock数据

const API_BASE = '/api';

const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('rualive_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    // Safety check: is it actually JSON?
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
       // 401未授权或403权限不足：清除token并跳转到登录页
       if (response.status === 401 || response.status === 403) {
          console.warn('Unauthorized or insufficient permissions, clearing token and redirecting to login.');
          localStorage.removeItem('rualive_token');
          window.location.href = '/login';
          return; // 阻止继续执行
       }
       // If fetch worked but returned error status, try to parse error, else throw generic
       if (contentType && contentType.indexOf("application/json") !== -1) {
          const errData = await response.json();
          throw new Error(errData.error || `API Error ${response.status}`);
       }
       throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
    }

    if (contentType && contentType.indexOf("application/json") !== -1) {
       const text = await response.text();
       try {
         const data = JSON.parse(text);
         if (!data.success && !data.users && !data.inviteCodes) { // loose check for success or data payload
             // Some endpoints might return just data without success: true wrapper?
             // Assuming API follows convention success: true/false
             if (data.success === false) throw new Error(data.error || 'Unknown API Error');
         }
         return data;
       } catch (e) {
         throw new Error('Invalid JSON response from server');
       }
    } else {
       // Response is OK but not JSON (likely HTML or empty)
       throw new Error('Received non-JSON response from server');
    }

  } catch (error: any) {
    console.error(`[API FAIL] ${endpoint}:`, error.message);
    // 仅在开发环境使用Mock数据
    if (USE_MOCK) {
      return getMockData(endpoint, options);
    }
    // 生产环境抛出错误
    throw error;
  }
};

// --- UI COMPONENTS ---

const GlassCard = ({ children, className = '', delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.6, delay: delay, ease: "power3.out" }
      );
    }
  }, [delay]);
  return (
    <div ref={ref} className={`bg-glass backdrop-blur-xl border border-glass-border rounded-[2rem] p-6 shadow-xl ${className}`}>
      {children}
    </div>
  );
};

const ActionButton = ({ 
  onClick, variant = 'primary', icon: Icon, label, loading = false, disabled = false, className = '' 
}: { 
  onClick: () => void, variant?: 'primary' | 'danger' | 'ghost' | 'secondary', icon?: any, label: string, loading?: boolean, disabled?: boolean, className?: string 
}) => {
  const baseClasses = "flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black italic tracking-tight uppercase transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-black hover:bg-primary-hover shadow-[0_0_20px_rgba(255,107,53,0.3)]",
    secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/10",
    danger: "bg-red-600/20 text-red-500 border border-red-500/50 hover:bg-red-600/40",
    ghost: "bg-transparent text-white/60 hover:text-white hover:bg-white/5"
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (Icon && <Icon className="w-4 h-4" />)}
      <span>{label}</span>
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-[pulse_0.5s_ease-out] border-t-primary/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-3xl font-black italic uppercase text-primary tracking-tighter leading-none">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
              <X className="w-6 h-6"/>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const Toast = ({ msg, type }: { msg: string | null, type: 'success' | 'error' }) => {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl border backdrop-blur-xl flex items-center gap-3 shadow-2xl animate-[slideIn_0.3s_ease-out]
      ${type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      <span className="font-bold uppercase tracking-wide">{msg}</span>
    </div>
  );
};

const CreateInviteForm = ({ t, onSave, onCancel, isLoading }: any) => {
  const [uses, setUses] = useState(10);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const handleSubmit = () => {
    const now = new Date();
    const target = new Date(expiryDate);
    const diffTime = Math.abs(target.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    onSave(uses, diffDays);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-black uppercase text-white/40 mb-2">{t('labels.maxUses')}</label>
        <input type="number" value={uses} onChange={e => setUses(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-primary/50 focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-white/40 mb-2">{t('labels.expires')}</label>
        <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-primary/50 focus:outline-none" />
      </div>
      <div className="flex gap-4 pt-4">
        <ActionButton onClick={onCancel} variant="ghost" label={t('actions.cancel')} className="flex-1" />
        <ActionButton onClick={handleSubmit} variant="primary" label={t('actions.create')} loading={isLoading} className="flex-1" />
      </div>
    </div>
  );
};

const EditUserForm = ({ user, t, closeModal, handleAsyncAction }: any) => {
  const [stats, setStats] = useState<UserEmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newLimit, setNewLimit] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiClient(`/admin/users/${user.id}/email-stats`);
        if (data.success) {
          setStats(data.data);
          setNewLimit(data.data.emailLimit.dailyLimit);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  if (loading) return <div className="p-8 text-center text-primary font-mono animate-pulse">LOADING MATRIX DATA...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
         <div className="text-white/40 text-sm mb-1">{t('labels.editingUser')}</div>
         <div className="text-xl font-bold text-primary">{user.username}</div>
         <div className="text-xs font-mono text-white/30">{user.email}</div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 p-3 rounded-xl text-center">
            <div className="text-[10px] uppercase text-white/40 mb-1">Total Sent</div>
            <div className="text-xl font-mono font-bold text-white">{stats.totalEmailsSent}</div>
          </div>
          <div className="bg-white/5 p-3 rounded-xl text-center">
            <div className="text-[10px] uppercase text-white/40 mb-1">Failed</div>
            <div className="text-xl font-mono font-bold text-red-400">{stats.totalEmailsFailed}</div>
          </div>
        </div>
      )}

      <div>
         <div className="flex justify-between text-xs font-black uppercase text-white/40 mb-4">
           <span>{t('labels.limit')}</span>
           <span className="text-white font-mono">{newLimit} / day</span>
         </div>
         <input type="range" min="0" max="100" step="1" value={newLimit} onChange={e => setNewLimit(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" />
         <div className="flex justify-between text-[10px] text-white/20 mt-2 font-mono">
            <span>0 (BAN)</span>
            <span>100 (VIP)</span>
         </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-white/10">
        <ActionButton onClick={closeModal} variant="ghost" label={t('actions.cancel')} className="flex-1" />
        <ActionButton 
          onClick={() => handleAsyncAction(async () => {
            await apiClient(`/admin/users/${user.id}/email-limit`, { 
              method: 'POST', 
              body: JSON.stringify({ dailyLimit: newLimit, enabled: newLimit > 0 }) 
            });
          }, t('messages.limitsUpdated'))} 
          variant="primary" 
          label={t('actions.save')} 
          className="flex-1" 
        />
      </div>
    </div>
  );
};

const InviteView = ({ invites, t, setModalConfig, reloadData, handleAsyncAction, closeModal, isLoading }: any) => (
  <div className="space-y-6">
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-2xl lg:text-4xl font-black italic text-white uppercase tracking-tighter">{t('headers.invites')}</h2>
        <p className="text-white/40 mt-1 font-mono text-xs lg:text-sm">{t('subheaders.invites')}</p>
      </div>
      <ActionButton 
        icon={Plus} 
        label={t('actions.create')} 
        onClick={() => setModalConfig({
          isOpen: true,
          title: t('actions.create'),
          content: <CreateInviteForm 
            t={t} 
            isLoading={isLoading}
            onCancel={closeModal}
            onSave={(uses: number, days: number) => handleAsyncAction(async () => {
              await apiClient('/admin/invite-codes', {
                method: 'POST',
                body: JSON.stringify({ maxUses: uses, expiresInDays: days })
              });
              reloadData();
            }, t('messages.ticketPrinted'))}
          />
        })} 
      />
    </div>
    {invites?.length === 0 ? (
       <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center text-white/30 font-mono">{t('messages.noKeys')}</div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {invites?.map((invite: InviteCode, i: number) => (
          <GlassCard key={invite.id} delay={i * 0.05} className="group hover:border-primary/50 transition-colors relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
               <Ticket className="w-12 h-12 text-primary rotate-12" />
             </div>
             <div className="text-xs text-white/40 uppercase mb-1 flex justify-between">
               <span>{t('labels.code')}</span>
               <span className={new Date(invite.expiresAt) < new Date() ? 'text-red-500' : 'text-green-500'}>{new Date(invite.expiresAt).toLocaleDateString()}</span>
             </div>
             <div className="text-2xl font-black text-primary tracking-widest font-mono mb-4">{invite.code}</div>
             <div className="flex justify-between items-end text-sm">
               <div>
                 <div className="text-white/40">{t('labels.usage')}</div>
                 <div className="font-bold">{invite.maxUses - invite.usedCount} / {invite.maxUses}</div>
               </div>
               <button 
                onClick={() => setModalConfig({
                  isOpen: true,
                  title: t('messages.confirmTitle'),
                  content: (
                    <div className="space-y-6">
                      <p className="text-white/60">{t('messages.confirmDesc')}</p>
                      <div className="flex gap-4 justify-end">
                        <ActionButton onClick={closeModal} variant="ghost" label={t('actions.cancel')} />
                        <ActionButton 
                          onClick={() => handleAsyncAction(async () => {
                            await apiClient(`/admin/invite-codes?codeId=${invite.id}`, { method: 'DELETE' });
                            reloadData();
                          }, t('messages.deleted'))} 
                          variant="danger" label={t('actions.delete')} 
                        />
                      </div>
                    </div>
                  )
                })}
                className="p-2 bg-white/5 rounded-lg hover:bg-red-500 hover:text-white transition-colors text-white/40"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>
             <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
               <div className="h-full bg-primary" style={{ width: `${((invite.maxUses - invite.usedCount) / invite.maxUses) * 100}%` }} />
             </div>
          </GlassCard>
        ))}
      </div>
    )}
  </div>
);

const UserView = ({ users, t, setModalConfig, reloadData, handleAsyncAction, closeModal }: any) => (
  <div className="space-y-6">
     <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
      <div>
        <h2 className="text-2xl lg:text-4xl font-black italic text-white uppercase tracking-tighter">{t('headers.users')}</h2>
        <p className="text-white/40 mt-1 font-mono text-xs lg:text-sm">{t('subheaders.users')}</p>
      </div>
    </div>
    <GlassCard className="overflow-x-auto p-0">
      <table className="w-full text-left">
        <thead className="bg-white/5 text-white/40 text-xs font-black uppercase tracking-wider">
          <tr>
            <th className="p-6">{t('table.userIdentity')}</th>
            <th className="hidden lg:table-cell p-6">{t('labels.joined')}</th>
            <th className="p-6 text-right">{t('table.control')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users?.map((user: User) => (
            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
              <td className="p-6">
                <div className="font-bold text-lg text-white group-hover:text-primary transition-colors">{user.username}</div>
                <div className="text-xs text-white/30 font-mono">{user.email}</div>
                <div className="mt-1">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                      user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-white/40 border-white/10'
                    }`}>{user.role}</span>
                </div>
              </td>
              <td className="hidden lg:table-cell p-6">
                <span className="font-mono text-white/60 text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
              </td>
              <td className="p-6 text-right">
                <div className="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button title={t('actions.edit')} onClick={() => setModalConfig({
                      isOpen: true, title: t('actions.edit'),
                      content: <EditUserForm user={user} t={t} closeModal={closeModal} handleAsyncAction={(action: any, msg: string) => handleAsyncAction(async () => { await action(); reloadData(); }, msg)} />
                    })} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-primary transition-colors"><Sliders className="w-4 h-4" /></button>
                  
                  <button title={t('actions.reset')} onClick={() => setModalConfig({
                      isOpen: true, title: t('actions.reset'),
                      content: (
                        <div className="space-y-6">
                          <p className="text-white/60">{t('messages.resetConfirm', { username: user.username })}</p>
                          <div className="flex gap-4">
                            <ActionButton onClick={closeModal} variant="ghost" label={t('actions.cancel')} className="flex-1"/>
                            <ActionButton onClick={() => handleAsyncAction(async () => {
                              await apiClient(`/admin/users/${user.id}/reset-password`, { 
                                method: 'POST', body: JSON.stringify({ method: 'generate', forceReset: true })
                              });
                            }, t('messages.passwordReset'))} variant="danger" label="AUTO-GEN" className="flex-1" />
                          </div>
                        </div>
                      )
                    })} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-yellow-400 transition-colors"><RotateCcw className="w-4 h-4" /></button>
                  
                  <button title={t('actions.delete')} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors" onClick={() => setModalConfig({
                      isOpen: true, title: t('messages.confirmTitle'),
                      content: (<div className="space-y-6"><p className="text-white/60">{t('messages.deleteUserConfirm', { username: user.username })}</p><div className="flex gap-4 justify-end"><ActionButton onClick={closeModal} variant="ghost" label={t('actions.cancel')} /><ActionButton onClick={() => handleAsyncAction(async () => {
                        await apiClient(`/admin/users/${user.id}`, { method: 'DELETE' });
                        reloadData();
                      }, t('messages.userDeleted'))} variant="danger" label={t('actions.delete')} /></div></div>)
                    })}><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  </div>
);

const ApiView = ({ t, setModalConfig, handleAsyncAction, closeModal, isLoading }: any) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');

  const fetchKey = async () => {
    try {
      setLoading(true);
      const data = await apiClient('/admin/api-key');
      if(data.success) setApiKey(data.apiKey);
    } catch(e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchKey(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl lg:text-4xl font-black italic text-white uppercase tracking-tighter">{t('headers.api')}</h2>
        <p className="text-white/40 mt-1 font-mono text-xs lg:text-sm">{t('subheaders.api')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CURRENT KEY STATUS */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-primary mb-4"><Key className="w-6 h-6" /><h3 className="text-xl font-black italic uppercase">Current Config</h3></div>
            {loading ? <div className="animate-pulse h-8 bg-white/10 rounded w-full"></div> : (
              apiKey ? (
                <div className="bg-black/40 border border-white/10 p-4 rounded-xl font-mono text-lg tracking-widest text-green-400 break-all">
                  {apiKey}
                </div>
              ) : <div className="text-white/30 italic">NO KEY CONFIGURED</div>
            )}
          </div>
          {apiKey && (
            <div className="flex gap-4 mt-6">
               <ActionButton 
                 variant="secondary" label={t('actions.test')} 
                 onClick={() => handleAsyncAction(async () => {
                   await apiClient('/admin/api-key/test', { method: 'POST' });
                 }, 'CONNECTION VALID')} 
               />
               <ActionButton 
                 variant="danger" label={t('actions.delete')} 
                 onClick={() => setModalConfig({
                   isOpen: true, title: 'REVOKE KEY?',
                   content: (
                    <div className="space-y-6">
                      <p className="text-white/60">{t('messages.revokeKeyConfirm')}</p>
                      <div className="flex gap-4 justify-end">
                        <ActionButton onClick={closeModal} variant="ghost" label={t('actions.cancel')} />
                        <ActionButton 
                          onClick={() => handleAsyncAction(async () => {
                            await apiClient('/admin/api-key', { method: 'DELETE' });
                            setApiKey(null);
                          }, t('messages.keyRevoked'))} 
                          variant="danger" label="REVOKE" 
                        />
                      </div>
                    </div>
                   )
                 })} 
               />
            </div>
          )}
        </GlassCard>

        {/* SET NEW KEY */}
        <GlassCard className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <h3 className="text-xl font-black italic uppercase mb-4">{t('actions.addKey')}</h3>
          <p className="text-sm text-white/60 mb-6">{t('messages.apiKeyHelp')}</p>
          <div className="space-y-4">
            <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="re_123..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono text-sm focus:border-primary/50 focus:outline-none placeholder-white/20" />
            <ActionButton 
              variant="primary" label={t('actions.save')} 
              loading={isLoading} 
              disabled={newKey.length < 5} 
              onClick={() => handleAsyncAction(async () => {
                  await apiClient('/admin/api-key', { method: 'POST', body: JSON.stringify({ apiKey: newKey }) });
                  setNewKey('');
                  fetchKey();
                }, t('messages.keySaved'))} 
              className="w-full justify-center" 
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const LogsView = ({ t, setModalConfig, closeModal }: any) => {
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, logsData] = await Promise.all([
          apiClient('/admin/email-stats'),
          apiClient('/logs?limit=50')
        ]);
        if(statsData.success) setStats(statsData.data);
        if(logsData.success) setLogs(logsData.logs);
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center animate-pulse text-primary font-black italic">LOADING LOGS...</div>;

  const pieData = stats ? [
    { name: 'Sent', value: stats.totalEmailsSent }, 
    { name: 'Failed', value: stats.totalEmailsFailed }
  ] : [];
  const COLORS = ['#FF6B35', '#333333'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h2 className="text-2xl lg:text-4xl font-black italic text-white uppercase tracking-tighter">{t('headers.logs')}</h2>
          <p className="text-white/40 mt-1 font-mono text-xs lg:text-sm">{t('subheaders.logs')}</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-1 h-64 flex flex-col justify-center items-center relative">
             <h4 className="absolute top-6 left-6 text-xs font-black uppercase text-white/30">{t('messages.deliveryRate')}</h4>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                   {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                 </Pie>
                 <Tooltip contentStyle={{backgroundColor: '#000', borderColor: '#333'}} />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-3xl font-black italic">{stats.successRate}%</span></div>
          </GlassCard>
          <GlassCard className="lg:col-span-2 h-64 flex items-center justify-around">
             <div className="text-center">
               <div className="text-xs font-black uppercase text-white/30 mb-2">24H SENT</div>
               <div className="text-5xl font-black italic text-primary">{stats.last24Hours.sent}</div>
             </div>
             <div className="w-px h-24 bg-white/10"></div>
             <div className="text-center">
               <div className="text-xs font-black uppercase text-white/30 mb-2">24H FAILED</div>
               <div className="text-5xl font-black italic text-white/20">{stats.last24Hours.failed}</div>
             </div>
          </GlassCard>
        </div>
      )}

      <GlassCard className="p-0 overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/40 text-xs font-black uppercase sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="p-4 text-left">{t('labels.time')}</th>
                <th className="hidden lg:table-cell p-4 text-left">{t('labels.recipient')}</th>
                <th className="p-4 text-left">{t('labels.subject')}</th>
                <th className="p-4 text-right">{t('labels.status')}</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log: MailLog) => (
                <tr key={log.id} className="hover:bg-white/[0.02] group">
                  <td className="p-4 font-mono text-white/50">{new Date(log.sentAt).toLocaleString()}</td>
                  <td className="hidden lg:table-cell p-4 font-bold">{log.recipient}</td>
                  <td className="p-4 text-white/70 max-w-[150px] truncate">{log.subject}</td>
                  <td className="p-4 text-right">
                     <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase ${log.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>{log.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}{log.status}</span>
                  </td>
                  <td className="p-4 text-right">
                     <button onClick={() => setModalConfig({ isOpen: true, title: 'LOG DETAILS', content: (
                         <div className="space-y-6">
                           <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                             <div className={`p-4 rounded-full ${log.status === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{log.status === 'success' ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}</div>
                             <div><h4 className="text-xl font-black italic uppercase">{log.status}</h4><p className="text-white/50 font-mono text-xs">{new Date(log.sentAt).toLocaleString()}</p></div>
                           </div>
                           <div className="space-y-4">
                             <div><label className="text-[10px] font-bold uppercase text-white/30">{t('labels.recipient')}</label><div className="font-mono text-white select-all">{log.recipient}</div></div>
                             <div><label className="text-[10px] font-bold uppercase text-white/30">{t('labels.subject')}</label><div className="font-bold text-white text-lg">{log.subject}</div></div>
                             {log.error && (
                               <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                                 <label className="text-[10px] font-bold uppercase text-red-400">ERROR</label>
                                 <div className="text-red-300 font-mono text-xs mt-1">{log.error}</div>
                               </div>
                             )}
                           </div>
                           <div className="flex justify-end pt-2"><ActionButton onClick={closeModal} variant="secondary" label={t('actions.close')} /></div>
                         </div>
                       ) })} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors opacity-0 group-hover:opacity-100" title={t('actions.view')}><Info className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

const NavItem = ({ id, icon: Icon, label, collapsed, activeTab, setActiveTab }: any) => (
  <button onClick={() => setActiveTab(id)} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === id ? 'bg-white/10 text-primary shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]' : 'text-white/40 hover:text-white hover:bg-white/5'} ${collapsed ? 'w-full justify-center px-2' : 'w-full'}`} title={collapsed ? label : ''}>
    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === id ? 'text-primary' : ''}`} />
    {!collapsed && <span className="font-black italic uppercase tracking-wider whitespace-nowrap overflow-hidden">{label}</span>}
    {!collapsed && activeTab === id && <ChevronRight className="w-4 h-4 ml-auto text-primary animate-pulse" />}
  </button>
);

const MobileNavItem = ({ id, icon: Icon, label, activeTab, setActiveTab }: any) => (
  <button 
    onClick={() => setActiveTab(id)} 
    className={`flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 ${activeTab === id ? 'text-primary' : 'text-white/40'}`}
  >
    <Icon className={`w-5 h-5 mb-1 transition-transform ${activeTab === id ? 'scale-110' : ''}`} />
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </button>
);

// --- MAIN DASHBOARD ---

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('invites');
  const [lang, setLang] = useState<Lang>('zh');
  const [translations, setTranslations] = useState<any>({});
  const [isLangLoading, setIsLangLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string | null, type: 'success' | 'error'}>({ msg: null, type: 'success' });
  const [sidebarWidth, setSidebarWidth] = useState(288); 
  const [isResizing, setIsResizing] = useState(false);
  const minSidebarWidth = 80;
  const maxSidebarWidth = 480;
  const collapseThreshold = 150;
  const isCollapsed = sidebarWidth <= 120;
  const [isMobile, setIsMobile] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, content: React.ReactNode } | null>(null);
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<InviteCode[]>([]);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setIsLangLoading(true);
    fetch(`./locals/${lang}.json`)
      .then(res => res.json())
      .then(data => { setTranslations(data); setIsLangLoading(false); })
      .catch(err => { console.error('Failed to load translations:', err); setIsLangLoading(false); });
  }, [lang]);

  // Data Fetching
  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiClient('/admin/users');
      if (data.success) setUsers(data.users || []);
    } catch (e: any) { showToast(e.message, 'error'); }
  }, []);

  const fetchInvites = useCallback(async () => {
    try {
      const data = await apiClient('/admin/invite-codes');
      if (data.success) setInvites(data.inviteCodes || []);
    } catch (e: any) { showToast(e.message, 'error'); }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'invites') fetchInvites();
  }, [activeTab, fetchUsers, fetchInvites]);

  const t = useCallback((key: string, args?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) value = value?.[k];
    if (!value) return key; 
    if (args) return Object.entries(args).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), value);
    return value;
  }, [translations]);

  // Resizing Logic
  const startResizing = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); }, []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      let newWidth = e.clientX;
      if (newWidth < collapseThreshold) newWidth = minSidebarWidth;
      else if (newWidth > maxSidebarWidth) newWidth = maxSidebarWidth;
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => { window.removeEventListener("mousemove", resize); window.removeEventListener("mouseup", stopResizing); };
  }, [resize, stopResizing]);

  useEffect(() => {
    if (isResizing) { document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; } 
    else { document.body.style.cursor = ''; document.body.style.userSelect = ''; }
  }, [isResizing]);

  // Page Transition
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, { opacity: 0, x: -20, filter: 'blur(10px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.4, ease: "power2.out" });
    }
  }, [activeTab]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: null, type: 'success' }), 3000);
  };

  const closeModal = () => setModalConfig(null);
  
  const handleAsyncAction = async (action: () => Promise<void>, successMsg: string) => {
    setIsLoading(true);
    try {
      await action();
      showToast(successMsg, 'success');
      closeModal();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem('rualive_token'); window.location.reload(); };

  return (
    <div className={`min-h-screen bg-background text-white selection:bg-primary selection:text-black font-sans ${!isMobile ? 'flex' : ''}`}>
      <BrickLoader />

      {/* Desktop Sidebar */}
      {!isMobile && (
      <aside className={`border-r border-white/10 flex flex-col fixed h-full bg-background/80 backdrop-blur-xl z-20 ${isResizing ? '' : 'transition-all duration-300 ease-in-out'}`} style={{ width: sidebarWidth }}>
        <div className={`p-8 ${isCollapsed ? 'px-4 flex justify-center' : ''}`}>
           <div className={`flex items-center gap-3 text-2xl font-black italic tracking-tighter text-primary ${isCollapsed ? 'justify-center' : ''}`}>
             <RuaLogo className="w-10 h-10 flex-shrink-0" />
             {!isCollapsed && <span className="hidden lg:inline whitespace-nowrap">{t('app.title')}</span>}
           </div>
           {!isCollapsed && <div className="hidden lg:block text-[10px] text-white/30 font-mono mt-2 tracking-[0.2em] uppercase whitespace-nowrap overflow-hidden">{t('app.subtitle')}</div>}
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
          <NavItem id="invites" icon={Ticket} label={t('nav.invites')} collapsed={isCollapsed} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="users" icon={Users} label={t('nav.users')} collapsed={isCollapsed} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="api" icon={Key} label={t('nav.api')} collapsed={isCollapsed} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="logs" icon={FileText} label={t('nav.logs')} collapsed={isCollapsed} activeTab={activeTab} setActiveTab={setActiveTab} />
        </nav>
        <div className="p-4 space-y-2">
           <button onClick={() => setSidebarWidth(isCollapsed ? 288 : minSidebarWidth)} className={`w-full flex items-center gap-2 p-3 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all justify-center`} title={isCollapsed ? "Expand" : "Collapse"}>
             {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
           </button>
        </div>
        <div className={`p-6 border-t border-white/10 space-y-4 ${isCollapsed ? 'items-center flex flex-col' : ''}`}>
          <button onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')} className={`flex items-center gap-2 text-xs font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest ${isCollapsed ? 'justify-center' : ''}`}><Globe className="w-3 h-3" />{!isCollapsed && <span className="hidden lg:inline whitespace-nowrap">{t('app.language')}</span>}</button>
          <button onClick={handleLogout} className={`flex items-center gap-2 text-xs font-bold text-red-500/50 hover:text-red-500 transition-colors uppercase tracking-widest ${isCollapsed ? 'justify-center' : ''}`}><LogOut className="w-3 h-3" />{!isCollapsed && <span className="hidden lg:inline whitespace-nowrap">{t('app.logout')}</span>}</button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 hover:w-1.5 transition-all z-30 flex items-center justify-center group" onMouseDown={startResizing}><div className="h-8 w-1 bg-white/10 rounded-full group-hover:bg-primary/80 transition-colors" /></div>
      </aside>
      )}

      {/* Mobile Top Header */}
      {isMobile && (
         <header className="fixed top-0 left-0 right-0 h-16 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 z-40 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary"><RuaLogo className="w-8 h-8" /><span className="font-black italic tracking-tighter text-lg">{t('app.title')}</span></div>
            <div className="flex items-center gap-3">
               <button onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')} className="p-2 text-white/40 hover:text-white transition-colors"><RefreshCw className="w-5 h-5" /></button>
               <button onClick={handleLogout} className="p-2 text-red-500/50 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
            </div>
         </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 relative ${!isMobile ? 'transition-all duration-300 ease-in-out' : ''} ${isMobile ? 'pt-24 pb-28 px-4' : 'p-6 lg:p-12'}`} style={!isMobile ? { marginLeft: sidebarWidth } : {}}>
        <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10" ref={contentRef}>
           {isLangLoading ? <div className="flex items-center justify-center h-[50vh] text-primary font-black italic text-xl animate-pulse">{t('app.loading')}</div> : (
             <>
                {activeTab === 'invites' && <InviteView t={t} invites={invites} reloadData={fetchInvites} setModalConfig={setModalConfig} handleAsyncAction={handleAsyncAction} closeModal={closeModal} isLoading={isLoading} />}
                {activeTab === 'users' && <UserView t={t} users={users} reloadData={fetchUsers} setModalConfig={setModalConfig} handleAsyncAction={handleAsyncAction} closeModal={closeModal} />}
                {activeTab === 'api' && <ApiView t={t} setModalConfig={setModalConfig} handleAsyncAction={handleAsyncAction} closeModal={closeModal} isLoading={isLoading} />}
                {activeTab === 'logs' && <LogsView t={t} setModalConfig={setModalConfig} closeModal={closeModal} />}
             </>
           )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 z-40 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
           <div className="flex justify-around items-center p-2">
             <MobileNavItem id="invites" icon={Ticket} label={t('nav.invites').split(' ')[0]} activeTab={activeTab} setActiveTab={setActiveTab} />
             <MobileNavItem id="users" icon={Users} label={t('nav.users').split(' ')[0]} activeTab={activeTab} setActiveTab={setActiveTab} />
             <MobileNavItem id="api" icon={Key} label={t('nav.api').split(' ')[0]} activeTab={activeTab} setActiveTab={setActiveTab} />
             <MobileNavItem id="logs" icon={FileText} label={t('nav.logs').split(' ')[0]} activeTab={activeTab} setActiveTab={setActiveTab} />
           </div>
        </nav>
      )}

      <Modal isOpen={!!modalConfig} onClose={closeModal} title={modalConfig?.title || ''}>{modalConfig?.content}</Modal>
      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('rualive_token');

    // 如果没有 token，跳转到外部登录页
    if (!token) {
      setAuthed(false);
      // 重定向到 /login（外部路由）
      window.location.href = '/login';
    } else {
      // 如果有 token，设置为已登录
      setAuthed(true);
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen w-full bg-background flex items-center justify-center text-primary font-black italic text-2xl animate-pulse">INIT...</div>;
  return authed ? <>{children}</> : null;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </HashRouter>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");
const root = ReactDOM.createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);