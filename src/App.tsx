import { useEffect, useState } from 'react';
import { authClient, type User } from './lib/auth';
import { LoginCard } from './components/LoginCard';
import { RegisterCard } from './components/RegisterCard';
import { Dashboard } from './components/Dashboard';
import { InstallPWABanner } from './components/InstallPWABanner';
import { Loader2 } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    async function checkAuthSession() {
      try {
        const session = await authClient.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
        }
      } catch (err) {
        console.error('Erro ao verificar sessão existente:', err);
      } finally {
        setLoadingSession(false);
      }
    }
    checkAuthSession();
  }, []);

  // Loading spinner inicial enquanto valida a sessão persistente
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <span className="text-sm text-zinc-400 font-medium">Carregando NutriPadel...</span>
      </div>
    );
  }

  // Se já estiver logado, exibe diretamente o Dashboard
  if (currentUser) {
    return (
      <>
        <Dashboard user={currentUser} onLogout={() => setCurrentUser(null)} />
        <InstallPWABanner />
      </>
    );
  }

  // Telas públicas de Autenticação (Login / Cadastro)
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-rose-700/10 via-red-900/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-rose-950/15 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full relative z-10 my-auto py-8">
        {currentView === 'login' ? (
          <LoginCard
            onSuccess={(user) => setCurrentUser(user)}
            onNavigateToRegister={() => setCurrentView('register')}
          />
        ) : (
          <RegisterCard
            onSuccess={(user) => setCurrentUser(user)}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="py-4 text-center text-xs text-zinc-600 relative z-10">
        &copy; {new Date().getFullYear()} NutriPadel — Sistema de Gestão Nutricional Integrado ao Neon
      </footer>

      {/* PWA Install Banner */}
      <InstallPWABanner />
    </div>
  );
}

export default App;

