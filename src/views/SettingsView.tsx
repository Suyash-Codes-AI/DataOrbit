import React, { useState, useEffect } from 'react';
import { Settings, Shield, Database, Sparkles, Lock, RefreshCw, CheckCircle2, AlertTriangle, Key, Sun, Moon, Palette } from 'lucide-react';
import { UserRole, DataSourceDefinition, DatabaseStats } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SettingsViewProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  geminiConfigured: boolean;
  onDbReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userRole,
  setUserRole,
  geminiConfigured,
  onDbReset
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const [sources, setSources] = useState<DataSourceDefinition[]>([]);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/permissions/sources')
      .then(res => res.json())
      .then(data => setSources(data.sources || []))
      .catch(console.error);
  }, []);

  const handleResetDb = async () => {
    if (!confirm('This will wipe and reseed the PostgreSQL in-memory database with 6,200+ realistic transaction records. Proceed?')) {
      return;
    }

    setResetting(true);
    setResetMsg(null);
    try {
      const res = await fetch('/api/database/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResetMsg(`Database successfully re-seeded with ${data.stats?.totalSales} sales records.`);
        onDbReset();
      }
    } catch (err: any) {
      setResetMsg(`Failed to reset: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const isSourceAllowed = (source: DataSourceDefinition) => {
    if (source.id === 'hr_salary_db') return userRole === 'executive';
    const hierarchy: Record<UserRole, number> = {
      restricted_viewer: 1,
      business_user: 2,
      data_analyst: 3,
      executive: 4
    };
    return (hierarchy[userRole] || 1) >= (hierarchy[source.minRoleRequired] || 2);
  };

  return (
    <div className={`p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-150 transition-colors ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* Header */}
      <div className={`pb-4 border-b ${isDark ? 'border-[#20293d]' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Settings & Security Governance</h2>
            <p className="text-xs text-slate-400">Configure appearance themes, role-based access control, database parameters, and DataOrbit models</p>
          </div>
        </div>
      </div>

      {/* Theme & Appearance Configuration */}
      <div className={`border rounded-2xl p-6 space-y-4 shadow-sm transition-colors ${isDark ? 'bg-[#121620] border-[#20293d]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-purple-500" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Appearance & Theme Mode
            </h3>
          </div>
          <span className="text-[10px] font-mono text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            Light & Dark Mode
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Choose your preferred visual presentation style for DataOrbit graphs, dashboards, and SQL inspectors:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex items-center space-x-3 text-left transition-all ${
              theme === 'dark'
                ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-semibold shadow-xs'
                : isDark
                ? 'bg-[#0c1017] border-[#1d2536] text-slate-400 hover:text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="p-2 rounded-lg bg-[#141926] text-amber-300 border border-[#232d43]">
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Dark Orbit Mode</div>
              <div className="text-[11px] text-slate-400">Deep obsidian canvas with neon accents</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex items-center space-x-3 text-left transition-all ${
              theme === 'light'
                ? 'bg-blue-50 border-blue-500 text-blue-600 font-semibold shadow-xs'
                : isDark
                ? 'bg-[#0c1017] border-[#1d2536] text-slate-400 hover:text-slate-200'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Crisp White Mode</div>
              <div className="text-[11px] text-slate-400">High-contrast daytime clarity</div>
            </div>
          </button>
        </div>
      </div>

      {/* Role Management */}
      <div className="bg-[#121620] border border-[#20293d] rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Active User Role & Access Profile
            </h3>
          </div>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            RBAC Enforced
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Switch roles to test access control enforcement across sensitive databases and corporate document intelligence:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'data_analyst', label: 'Data Analyst', desc: 'Full access to sales, catalog, and RAG docs. Restricted from confidential HR pay.' },
            { id: 'executive', label: 'Executive', desc: 'Unrestricted access across all operational data, strategy memos, and compensation databases.' },
            { id: 'business_user', label: 'Business User', desc: 'Standard business operational queries and high-level regional reporting.' },
            { id: 'restricted_viewer', label: 'Restricted Viewer', desc: 'Limited catalog viewer role with restricted transactional access.' }
          ].map((r) => {
            const isSelected = userRole === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setUserRole(r.id as UserRole)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/50 text-blue-300 shadow-md'
                    : 'bg-[#0c1017] border-[#1d2536] text-slate-400 hover:text-slate-200 hover:bg-[#111722]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-slate-200">{r.label}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Permissions Matrix */}
      <div className="bg-[#121620] border border-[#20293d] rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Data Source Permissions Matrix
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {sources.length} Data Sources Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0e14] border-b border-[#1e2638] text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Data Source ID</th>
                <th className="py-2.5 px-3">Source Name & Description</th>
                <th className="py-2.5 px-3">Min Role Required</th>
                <th className="py-2.5 px-3 text-right">Access for Current Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182030]">
              {sources.map((s) => {
                const allowed = isSourceAllowed(s);
                return (
                  <tr key={s.id} className="hover:bg-white/[0.01]">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-blue-400">{s.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-200">{s.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{s.description}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono capitalize text-slate-300">
                      {s.minRoleRequired.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {allowed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ✓ Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          ✕ Denied
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Management & Reseeding */}
      <div className="bg-[#121620] border border-[#20293d] rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            PostgreSQL Database Lifecycle
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The application maintains a high-performance in-memory PostgreSQL instance populated with 6,200+ realistic transaction records spanning 2025 and 2026.
          You can wipe and re-seed the full dataset at any time:
        </p>

        {resetMsg && (
          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{resetMsg}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleResetDb}
            disabled={resetting}
            className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Reseeding 6,200 Records...' : 'Reset & Reseed Database'}</span>
          </button>
        </div>
      </div>

      {/* Model & Security Guardrails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model info */}
        <div className="p-5 rounded-2xl bg-[#121620] border border-[#20293d] space-y-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">LLM Reasoning Engine</h4>
          </div>
          <div className="text-xs text-slate-300 space-y-1 pt-1">
            <div>Model: <strong className="text-blue-400 font-mono">gemini-3.8-flash</strong></div>
            <div>Provider: <span className="text-slate-200 font-mono">Google GenAI SDK (@google/genai)</span></div>
            <div>Key Configuration: <span className="text-emerald-400 font-mono">Server-Side Environment</span></div>
          </div>
        </div>

        {/* Security parameters */}
        <div className="p-5 rounded-2xl bg-[#121620] border border-[#20293d] space-y-2">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">SQL Security Limits</h4>
          </div>
          <div className="text-xs text-slate-300 space-y-1 pt-1">
            <div>Query Timeout: <span className="text-slate-200 font-mono">15,000 ms</span></div>
            <div>Row Count Ceiling: <span className="text-slate-200 font-mono">10,000 rows</span></div>
            <div>Write Operations: <span className="text-red-400 font-mono">Blocked (SELECT only)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
