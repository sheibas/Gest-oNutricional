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
import { PacienteDetailModal } from './PacienteDetailModal';
import { NewPacienteModal } from './NewPacienteModal';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'pacientes'>('dashboard');
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
  const [showNewPacienteModal, setShowNewPacienteModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize and load nutritionist & stats from Neon
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get or register the logged-in nutritionist
      const nutri = await getOrCreateNutricionista(user.email, user.name);
      if (nutri) {
        setNutricionista(nutri);

        // 2. Load dashboard stats and patients list in parallel
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

  const handleLogout = async () => {
    await authClient.signOut();
    onLogout();
  };

  const handleSelectPaciente = (id: string) => {
    setSelectedPacienteId(id);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col md:flex-row antialiased relative selection:bg-rose-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-rose-950/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-red-950/10 rounded-full blur-[120px] pointer-events-none" />

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
          <div className="fixed inset-0 bg-black/80" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-50 w-72 bg-zinc-950 h-full">
            <Sidebar
              currentView={currentView}
              onSelectView={(view) => {
                setCurrentView(view);
                setMobileMenuOpen(false);
              }}
              user={user}
              onLogout={handleLogout}
              totalPacientesCount={stats.totalPacientes}
              onOpenNewPacienteModal={() => {
                setShowNewPacienteModal(true);
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
          onSelectView={setCurrentView}
          user={user}
          onLogout={handleLogout}
          totalPacientesCount={stats.totalPacientes}
          onOpenNewPacienteModal={() => setShowNewPacienteModal(true)}
        />
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full relative z-10">
        {currentView === 'dashboard' ? (
          <DashboardView
            user={user}
            stats={stats}
            loading={loading}
            onRefresh={loadData}
            onNavigateToPacientes={() => setCurrentView('pacientes')}
            onSelectPacienteId={handleSelectPaciente}
            onOpenNewPacienteModal={() => setShowNewPacienteModal(true)}
          />
        ) : (
          <PacientesView
            pacientes={pacientes}
            loading={loading}
            onRefresh={loadData}
            onSelectPacienteId={handleSelectPaciente}
            onOpenNewPacienteModal={() => setShowNewPacienteModal(true)}
          />
        )}
      </main>

      {/* Patient Details & Clinical Record Modal */}
      {selectedPacienteId && (
        <PacienteDetailModal
          pacienteId={selectedPacienteId}
          onClose={() => setSelectedPacienteId(null)}
          onDataChanged={loadData}
        />
      )}

      {/* New Patient Registration Modal */}
      {showNewPacienteModal && (
        <NewPacienteModal
          nutricionistaId={nutricionista?.id || ''}
          onClose={() => setShowNewPacienteModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
