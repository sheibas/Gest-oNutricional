import React, { useState, useEffect, useCallback } from 'react';
import { type User, authClient } from '../lib/auth';
import {
  getOrCreateNutricionista,
  getDashboardStats,
  getPacientes,
  type DashboardStats,
  type Paciente,
  type Nutricionista,
} from '../lib/db';
import { Sidebar } from './Sidebar';
import { DashboardView } from './DashboardView';
import { PacientesView } from './PacientesView';
import { NovoPacienteView } from './NovoPacienteView';
import { PerfilPacienteView } from './PerfilPacienteView';
import { Menu, X, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'pacientes' | 'novo-paciente' | 'perfil-paciente'
  >('dashboard');
  const [nutricionista, setNutricionista] = useState<Nutricionista | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  });
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Navigation state
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize and load nutritionist & stats from Neon
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Obter ou registrar nutricionista logado
      const nutri = await getOrCreateNutricionista(user.email, user.name);
      if (nutri) {
        setNutricionista(nutri);

        // 2. Carregar estatísticas do dashboard e lista completa de pacientes em paralelo
        const [dashboardStats, pacientesList] = await Promise.all([
          getDashboardStats(nutri.id),
          getPacientes(nutri.id),
        ]);

        setStats(dashboardStats);
        setPacientes(pacientesList);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do Neon:', error);
    } finally {
      setLoading(false);
    }
  }, [user.email, user.name]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleLogout = async () => {
    await authClient.signOut();
    onLogout();
  };

  const handleSelectPaciente = (id: string) => {
    setSelectedPacienteId(id);
    setCurrentView('perfil-paciente');
  };

  const handleNavigateToNovoPaciente = () => {
    setSelectedPacienteId(null);
    setCurrentView('novo-paciente');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col md:flex-row antialiased relative selection:bg-rose-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-rose-950/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-red-950/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-bounce-short">
          <div className="p-4 rounded-2xl bg-zinc-900/95 border border-emerald-500/50 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-400">Sucesso!</h4>
                <p className="text-xs text-zinc-300">{toastMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Header Bar */}
      <header className="md:hidden border-b border-zinc-800 bg-zinc-950 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Logo size="sm" />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Abrir menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-rose-500" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 w-72 bg-zinc-950 h-full">
            <Sidebar
              currentView={currentView}
              onSelectView={(view) => {
                setSelectedPacienteId(null);
                setCurrentView(view);
                setMobileMenuOpen(false);
              }}
              user={user}
              onLogout={handleLogout}
              totalPacientesCount={stats.totalPacientes}
              onOpenNovoPaciente={() => {
                setSelectedPacienteId(null);
                setCurrentView('novo-paciente');
                setMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentView={currentView}
          onSelectView={(view) => {
            setSelectedPacienteId(null);
            setCurrentView(view);
          }}
          user={user}
          onLogout={handleLogout}
          totalPacientesCount={stats.totalPacientes}
          onOpenNovoPaciente={handleNavigateToNovoPaciente}
        />
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full relative z-10">
        {currentView === 'dashboard' && (
          <DashboardView
            user={user}
            stats={stats}
            loading={loading}
            onRefresh={loadData}
            onNavigateToPacientes={() => {
              setSelectedPacienteId(null);
              setCurrentView('pacientes');
            }}
            onSelectPacienteId={handleSelectPaciente}
            onOpenNewPacienteModal={handleNavigateToNovoPaciente}
          />
        )}

        {currentView === 'pacientes' && (
          <PacientesView
            pacientes={pacientes}
            loading={loading}
            onRefresh={loadData}
            onSelectPacienteId={handleSelectPaciente}
            onOpenNovoPacientePage={handleNavigateToNovoPaciente}
          />
        )}

        {currentView === 'novo-paciente' && (
          <NovoPacienteView
            nutricionistaId={nutricionista?.id || ''}
            onCancel={() => {
              setSelectedPacienteId(null);
              setCurrentView('pacientes');
            }}
            onSuccess={(newPaciente) => {
              setToastMessage(`Paciente "${newPaciente.nome}" cadastrado com sucesso!`);
              loadData();
              setSelectedPacienteId(newPaciente.id);
              setCurrentView('perfil-paciente');
            }}
          />
        )}

        {currentView === 'perfil-paciente' && selectedPacienteId && (
          <PerfilPacienteView
            pacienteId={selectedPacienteId}
            onBack={() => {
              setSelectedPacienteId(null);
              setCurrentView('pacientes');
            }}
            onDataChanged={loadData}
          />
        )}
      </main>
    </div>
  );
};
