import React from 'react';
import {
  Users,
  Calendar,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  CalendarCheck,
  ChevronRight,
  Activity,
  Phone,
  Mail,
} from 'lucide-react';
import { type DashboardStats, type PacienteSemRetorno } from '../lib/db';
import { type User } from '../lib/auth';

interface DashboardViewProps {
  user: User;
  stats: DashboardStats;
  loading: boolean;
  onRefresh: () => void;
  onNavigateToPacientes: () => void;
  onSelectPacienteId: (id: string) => void;
  onOpenNewPacienteModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  stats,
  loading,
  onRefresh,
  onNavigateToPacientes,
  onSelectPacienteId,
  onOpenNewPacienteModal,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      // Split YYYY-MM-DD to avoid timezone shifting
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header / Greeting Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Dashboard de Performance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}, {user.name}!
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5 capitalize">{todayFormatted}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors text-xs font-medium cursor-pointer active:scale-95"
            title="Atualizar dados do Neon"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-500' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={onOpenNewPacienteModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 border border-rose-500/30 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Grid of the 3 Main Cards (Prompt 3 Requirements) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD 1: Total de pacientes ativos */}
        <div
          onClick={onNavigateToPacientes}
          className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-rose-500/40 transition-all duration-300 cursor-pointer text-left flex flex-col justify-between"
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl group-hover:bg-rose-600/20 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-200">
                <Users className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-rose-400 transition-colors">
                Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Total de Pacientes Ativos
            </h3>
            <div className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-zinc-800 animate-pulse rounded-lg" />
              ) : (
                stats.totalPacientes
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Pacientes cadastrados</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Em acompanhamento
            </span>
          </div>
        </div>

        {/* CARD 2: Consultas da semana */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300 text-left flex flex-col justify-between">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl group-hover:bg-amber-600/20 transition-colors pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-200">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
                Semana Atual
              </span>
            </div>

            <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Consultas da Semana
            </h3>
            <div className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-zinc-800 animate-pulse rounded-lg" />
              ) : (
                stats.consultasSemana
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Registradas no período</span>
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <CalendarCheck className="w-3.5 h-3.5" /> Seg - Dom
            </span>
          </div>
        </div>

        {/* STAT OVERVIEW / HIGHLIGHT CARD */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-rose-500/40 transition-all duration-300 text-left flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Activity className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold">
                Gestão Padel
              </span>
            </div>

            <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Status NutriPadel
            </h3>
            <div className="text-xl font-bold text-white mt-1">
              Painel 100% Integrado
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
            <span>Banco Neon Postgres</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sincronizado
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: Pacientes sem retorno (Full interactive section) */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 text-left border border-zinc-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Card 3 — Pacientes sem Retorno
                </h2>
                {stats.pacientesSemRetorno.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
                    {stats.pacientesSemRetorno.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pacientes cuja última consulta foi há mais de 30 dias e não possuem próximo retorno agendado.
              </p>
            </div>
          </div>
        </div>

        {/* Content list or Empty State */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-zinc-900/60 rounded-2xl animate-pulse border border-zinc-800/60" />
              ))}
            </div>
          ) : stats.pacientesSemRetorno.length === 0 ? (
            // Message when empty (Explicitly required in Prompt 3)
            <div className="py-12 px-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-zinc-200">
                  Nenhum paciente sem retorno no momento
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Excelente trabalho! Todos os seus atletas e pacientes atendidos estão com retornos agendados ou foram consultados recentemente.
                </p>
              </div>
            </div>
          ) : (
            // List of patients without return (Clickable to redirect to patient profile)
            <div className="space-y-3">
              {stats.pacientesSemRetorno.map((paciente: PacienteSemRetorno) => (
                <div
                  key={paciente.paciente_id}
                  onClick={() => onSelectPacienteId(paciente.paciente_id)}
                  className="p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/90 border border-zinc-800/70 hover:border-rose-500/40 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-950 to-zinc-900 border border-rose-500/30 flex items-center justify-center font-bold text-sm text-rose-400 group-hover:border-rose-500 transition-colors shrink-0">
                      {paciente.paciente_nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors flex items-center gap-2">
                        {paciente.paciente_nome}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                          +{paciente.dias_sem_consulta} dias sem consulta
                        </span>
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" /> Última consulta:{' '}
                          <strong className="text-zinc-300">
                            {formatDate(paciente.ultima_consulta_data)}
                          </strong>
                        </span>
                        {paciente.paciente_whatsapp && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Phone className="w-3 h-3" /> {paciente.paciente_whatsapp}
                          </span>
                        )}
                        {paciente.paciente_email && (
                          <span className="hidden md:flex items-center gap-1 text-zinc-400">
                            <Mail className="w-3 h-3" /> {paciente.paciente_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-rose-600 text-zinc-300 hover:text-white text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm group-hover:bg-rose-600 group-hover:text-white"
                    >
                      <span>Ver Perfil</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
