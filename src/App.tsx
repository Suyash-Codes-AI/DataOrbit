import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardHomeView } from './views/DashboardHomeView';
import { AnalystView } from './views/AnalystView';
import { VisualizationStudioView } from './views/VisualizationStudioView';
import { CsvIntelligenceView } from './views/CsvIntelligenceView';
import { DatabaseExplorerView } from './views/DatabaseExplorerView';
import { DocumentCenterView } from './views/DocumentCenterView';
import { QueryHistoryView } from './views/QueryHistoryView';
import { SavedQueriesView } from './views/SavedQueriesView';
import { SettingsView } from './views/SettingsView';
import { UserRole, DatabaseStats, QueryHistoryItem } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SignInLanding } from './components/SignInLanding';
import { AuthError, getUser, handleAuthCallback, login, logout, MissingIdentityError, requestPasswordRecovery, type User } from '@netlify/identity';

function AppContent({ identityLabel, onSignOut }: { identityLabel: string; onSignOut: () => void }) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('data_analyst');
  const [analystQuery, setAnalystQuery] = useState<string>('');
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(true);

  useEffect(() => {
    fetchHealthAndStats();
    fetchHistory();
  }, []);

  const fetchHealthAndStats = async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/database/stats')
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setGeminiConfigured(Boolean(healthData.gemini?.configured));
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load system health or stats:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/query-history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load query history:', err);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    setAnalystQuery(prompt);
    setActiveTab('analyst');
  };

  return (
    <div
      className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#090c12] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        dbConnected={stats?.connected ?? true}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar
          currentTab={activeTab}
          userRole={userRole}
          setUserRole={setUserRole}
          geminiConfigured={geminiConfigured}
          onOpenAnalyst={() => setActiveTab('analyst')}
          identityLabel={identityLabel}
          onSignOut={onSignOut}
        />

        <main
          className={`flex-1 overflow-y-auto transition-colors duration-200 ${
            isDark ? 'bg-[#090c12]' : 'bg-slate-50'
          }`}
        >
          {activeTab === 'dashboard' && (
            <DashboardHomeView
              stats={stats}
              recentQueries={history}
              onSelectPrompt={handleSelectPrompt}
              onNavigateToAnalyst={() => setActiveTab('analyst')}
              onNavigateToDatabase={() => setActiveTab('database')}
              onNavigateToCsv={() => setActiveTab('csv')}
              onNavigateToVisualizer={() => setActiveTab('visualizer')}
            />
          )}

          {activeTab === 'analyst' && (
            <AnalystView
              initialQuery={analystQuery}
              userRole={userRole}
              onExecutionFinished={fetchHistory}
            />
          )}

          {activeTab === 'visualizer' && (
            <VisualizationStudioView />
          )}

          {activeTab === 'csv' && (
            <CsvIntelligenceView />
          )}

          {activeTab === 'database' && (
            <DatabaseExplorerView />
          )}

          {activeTab === 'documents' && (
            <DocumentCenterView />
          )}

          {activeTab === 'history' && (
            <QueryHistoryView
              onRunAgain={handleSelectPrompt}
              onSaveQuery={(item) => {
                setActiveTab('saved');
              }}
            />
          )}

          {activeTab === 'saved' && (
            <SavedQueriesView
              onRunQuery={handleSelectPrompt}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              userRole={userRole}
              setUserRole={setUserRole}
              geminiConfigured={geminiConfigured}
              onDbReset={() => {
                fetchHealthAndStats();
                fetchHistory();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [access, setAccess] = useState<{ mode: 'loading' | 'signed-in' | 'guest'; user?: User }>({ mode: 'loading' });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const callback = await handleAuthCallback();
        const user = callback?.user ?? await getUser();
        if (active) setAccess(user ? { mode: 'signed-in', user } : { mode: 'loading' });
      } catch {
        if (active) setAccess({ mode: 'loading' });
      }
    };
    restore();
    return () => { active = false; };
  }, []);

  const authMessage = (error: unknown) => {
    if (error instanceof MissingIdentityError) return 'Sign-in is not available in this preview. You can continue as a guest.';
    if (error instanceof AuthError && error.status === 401) return 'The email or password is incorrect.';
    if (error instanceof AuthError) return error.message;
    return 'Unable to sign in right now. Please try again.';
  };

  const signIn = async (email: string, password: string) => {
    setAuthError('');
    try {
      const user = await login(email, password);
      setAccess({ mode: 'signed-in', user });
    } catch (error) {
      setAuthError(authMessage(error));
      throw error;
    }
  };

  const recover = async (email: string) => {
    setAuthError('');
    try { await requestPasswordRecovery(email); }
    catch (error) { setAuthError(authMessage(error)); throw error; }
  };

  const signOut = async () => {
    if (access.mode === 'signed-in') await logout().catch(() => undefined);
    setAuthError('');
    setAccess({ mode: 'loading' });
  };

  return (
    <ThemeProvider>
      {access.mode === 'loading' ? (
        <SignInLanding onSignIn={signIn} onGuest={() => { setAuthError(''); setAccess({ mode: 'guest' }); }} onRecoverPassword={recover} error={authError} />
      ) : (
        <AppContent identityLabel={access.mode === 'guest' ? 'Guest explorer' : (access.user?.email ?? 'Signed-in user')} onSignOut={signOut} />
      )}
    </ThemeProvider>
  );
}
