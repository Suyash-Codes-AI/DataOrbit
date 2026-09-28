import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Database,
  History,
  Bookmark,
  FileText,
  FileSpreadsheet,
  Settings,
  Sparkles,
  BarChart3,
  Orbit,
  Radio
} from 'lucide-react';
import { UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';

export type ActiveTab = 'dashboard' | 'analyst' | 'visualizer' | 'csv' | 'database' | 'history' | 'saved' | 'documents' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  dbConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  dbConnected
}) => {
  const { isDark } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyst', label: 'AI Analyst', icon: BrainCircuit, badge: 'Agent' },
    { id: 'visualizer', label: 'Data Visualizer', icon: BarChart3, badge: 'Visuals' },
    { id: 'csv', label: 'CSV Extraction & AI', icon: FileSpreadsheet, badge: 'Extract' },
    { id: 'database', label: 'Database Explorer', icon: Database },
    { id: 'history', label: 'Query History', icon: History },
    { id: 'saved', label: 'Saved Queries', icon: Bookmark },
    { id: 'documents', label: 'Document Center', icon: FileText, badge: 'RAG' },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className={`w-64 flex flex-col shrink-0 select-none border-r transition-colors duration-200 ${
        isDark ? 'bg-[#0d1017] border-[#1e2535]' : 'bg-white border-slate-200'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`p-5 border-b flex items-center space-x-3 ${
          isDark ? 'border-[#1e2535]' : 'border-slate-200'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/25 text-white">
          <Orbit className="w-4 h-4 animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-tight flex items-center space-x-1">
            <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>DATA</span>
            <span className="text-blue-500 font-black">ORBIT</span>
          </h1>
          <p
            className={`text-[10px] tracking-wider uppercase font-mono ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Multi-Source Intelligence
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div
          className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          Connected Suite
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30 font-semibold shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-[#151a24]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                    item.badge === 'Visuals'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : item.badge === 'Agent'
                      ? 'bg-blue-500/20 text-blue-400'
                      : item.badge === 'Extract'
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role & Multi-Source Status Footer */}
      <div
        className={`p-3.5 border-t space-y-2 ${
          isDark ? 'bg-[#090c12] border-[#1e2535]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>PostgreSQL + CSV</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Connected
          </span>
        </div>

        <div
          className={`p-2 rounded-lg border flex items-center justify-between ${
            isDark ? 'bg-[#121622] border-[#20293d]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="text-[11px] text-slate-400">
            <div>
              Role: <span className={`font-semibold capitalize ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{userRole.replace('_', ' ')}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-blue-500 uppercase bg-blue-500/10 px-1.5 py-0.5 rounded">
            RBAC
          </span>
        </div>
      </div>
    </aside>
  );
};

