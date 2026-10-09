import React from 'react';
import { Logo } from './Logo';
import { LayoutDashboard, Users, LogOut, PlusCircle, Download, X, Share, PlusSquare } from 'lucide-react';
import { type User } from '../lib/auth';
import { usePWAInstall } from '../lib/pwa';

interface SidebarProps {
  currentView: 'dashboard' | 'pacientes' | 'novo-paciente' | 'perfil-paciente';
  onSelectView: (view: 'dashboard' | 'pacientes' | 'novo-paciente') => void;
  user: User;
  onLogout: () => void;
  totalPacientesCount?: number;
  onOpenNovoPaciente?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  user,
  onLogout,
  totalPacientesCount = 0,
  onOpenNovoPaciente,
}) => {
  const { canInstall, promptInstall, showIOSModal, setShowIOSModal } = usePWAInstall();

  const getInitials = (name: string) => {
    return (
      name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'NP'
    );
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pacientes' as const,
      label: 'Pacientes',
      icon: Users,
      badge: totalPacientesCount > 0 ? String(totalPacientesCount) : null,
    },
  ];

  return (
    <>
      <aside className="w-64 bg-zinc-950/95 border-r border-zinc-800/80 flex flex-col h-screen sticky top-0 shrink-0 z-40 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
          <Logo size="md" />
        </div>

        {/* Quick Action Button */}
        <div className="px-4 pt-5 pb-2">
          <button
            onClick={() => {
              if (onOpenNovoPaciente) {
                onOpenNovoPaciente();
              } else {
                onSelectView('novo-paciente');
              }
            }}
            className={`w-full py-2.5 px-3.5 rounded-xl font-semibold text-xs tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] border cursor-pointer ${
              currentView === 'novo-paciente'
                ? 'bg-rose-600 text-white border-rose-400 shadow-rose-950/60 ring-2 ring-rose-500/40'
                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/40 border-rose-500/30'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Paciente</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Navegação Principal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (item.id === 'pacientes' &&
                (currentView === 'novo-paciente' || currentView === 'perfil-paciente'));

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-600/20 to-red-600/10 text-white border border-rose-500/30 glow-red-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-rose-400' : 'text-zinc-400 group-hover:text-zinc-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile with Subtle Controls */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-rose-600 to-red-800 flex items-center justify-center font-bold text-xs text-white border border-rose-500/40 glow-red-sm">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs font-semibold text-zinc-200 truncate">{user.name}</div>
                <div className="text-[11px] text-zinc-400 truncate">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Discrete PWA Install Button */}
              {canInstall && (
                <button
                  type="button"
                  onClick={promptInstall}
                  title="Instalar Aplicativo (PWA)"
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-rose-400" />
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                title="Sair do sistema"
                className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Modal de Instruções para iPhone / Safari quando clicado no botão discreto */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white">Instalar no iPhone / iPad</h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                <Share className="w-4 h-4 text-rose-400 shrink-0" />
                <span>1. Toque em <strong>Compartilhar</strong> no Safari</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>2. Selecione <strong>"Adicionar à Tela de Início"</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

