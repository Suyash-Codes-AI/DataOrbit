import React from 'react';
import { UserRole } from '../types';
import { Shield, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentTab: string;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  geminiConfigured: boolean;
  onOpenAnalyst: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  userRole,
  setUserRole,
  geminiConfigured,
  onOpenAnalyst
}) => {
  const { isDark, toggleTheme } = useTheme();

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'DataOrbit Dashboard';
      case 'analyst': return 'AI Data Analyst Agent';
      case 'visualizer': return 'Data Visualizer & Analytics Studio';
      case 'csv': return 'CSV Extraction & AI Intelligence';
      case 'database': return 'PostgreSQL Schema & Explorer';
      case 'history': return 'Execution & Query History';
      case 'saved': return 'Saved Workspace Queries';
      case 'documents': return 'Document Intelligence (RAG)';
      case 'settings': return 'System Settings & Access Controls';
      default: return 'Overview';
    }
  };

  return (
    <header
      className={`h-14 px-6 flex items-center justify-between shrink-0 border-b transition-colors duration-200 ${
        isDark ? 'bg-[#0d1017] border-[#1e2535]' : 'bg-white border-slate-200'
      }`}
    >
      {/* Title & Path */}
      <div className="flex items-center space-x-3">
        <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          {getTabTitle(currentTab)}
        </h2>
        <span
          className={`text-xs font-mono hidden md:inline ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          • dataorbit_core
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
            isDark
              ? 'bg-[#141926] border-[#232d43] text-amber-300 hover:text-amber-200 hover:bg-[#1a2133]'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Light and Dark Mode"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Gemini Provider Badge */}
        <div
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs ${
            isDark ? 'bg-[#141926] border-[#232d43]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span className={`font-mono text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Gemini 3.8 Flash
          </span>
          {geminiConfigured ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="API Key Connected" />
          ) : (
            <span className="text-[10px] text-amber-500 font-medium">Demo Ready</span>
          )}
        </div>

        {/* User Role Switcher */}
        <div
          className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border ${
            isDark ? 'bg-[#121622] border-[#232d43]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span className={`text-[11px] hidden lg:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Role:
          </span>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className={`bg-transparent text-xs font-medium focus:outline-hidden cursor-pointer ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            <option value="data_analyst" className={isDark ? 'bg-[#121622] text-slate-200' : 'bg-white text-slate-800'}>
              Data Analyst
            </option>
            <option value="executive" className={isDark ? 'bg-[#121622] text-slate-200' : 'bg-white text-slate-800'}>
              Executive (Full Access)
            </option>
            <option value="business_user" className={isDark ? 'bg-[#121622] text-slate-200' : 'bg-white text-slate-800'}>
              Business User
            </option>
            <option value="restricted_viewer" className={isDark ? 'bg-[#121622] text-slate-200' : 'bg-white text-slate-800'}>
              Restricted Viewer
            </option>
          </select>
        </div>

        {/* Quick Launch Analyst Button */}
        {currentTab !== 'analyst' && (
          <button
            onClick={onOpenAnalyst}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all shadow-xs shadow-blue-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Analyst</span>
          </button>
        )}
      </div>
    </header>
  );
};

