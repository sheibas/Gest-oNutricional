import React, { useState } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Target,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { type Paciente } from '../lib/db';
import { formatDateBR } from '../lib/utils';

interface PacientesViewProps {
  pacientes: Paciente[];
  loading: boolean;
  onRefresh: () => void;
  onSelectPacienteId: (id: string) => void;
  onOpenNovoPacientePage: () => void;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  pacientes,
  loading,
  onRefresh,
  onSelectPacienteId,
  onOpenNovoPacientePage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtro de busca por nome no topo da listagem
  const filteredPacientes = pacientes.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      p.nome.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.telefone && p.telefone.includes(term)) ||
      (p.whatsapp && p.whatsapp.includes(term)) ||
      (p.objetivo_texto && p.objetivo_texto.toLowerCase().includes(term)) ||
      (p.objetivos && p.objetivos.some((obj) => obj.toLowerCase().includes(term)))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header da listagem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Gestão Nutricional
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pacientes Cadastrados
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Visualize os atletas e pacientes acompanhados, objetivos e datas de consulta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-medium cursor-pointer"
            title="Atualizar lista em tempo real"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-500' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={onOpenNovoPacientePage}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 border border-rose-500/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Campo de busca por nome no topo da listagem */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar paciente por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-xs placeholder:text-zinc-400 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all shadow-inner"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Listagem de Pacientes */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-zinc-800">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-zinc-900/60 rounded-2xl animate-pulse border border-zinc-800/50" />
            ))}
          </div>
        ) : pacientes.length === 0 ? (
          // Regra do Prompt 4: Se não houver pacientes cadastrados, exibir a mensagem "Nenhum paciente cadastrado ainda"
          <div className="py-20 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-zinc-500 border border-zinc-800 flex items-center justify-center mx-auto shadow-inner">
              <Users className="w-7 h-7 text-rose-500/70" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-200">
                Nenhum paciente cadastrado ainda
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Clique no botão abaixo para adicionar seu primeiro paciente ou atleta ao sistema.
              </p>
            </div>
            <button
              onClick={onOpenNovoPacientePage}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 border border-rose-500/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Primeiro Paciente</span>
            </button>
          </div>
        ) : filteredPacientes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6 text-zinc-500" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-300">
                Nenhum paciente encontrado para &ldquo;{searchTerm}&rdquo;
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Tente buscar com outro termo ou limpe a busca.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPacientes.map((paciente) => {
              // Extração do objetivo principal ou chips
              const objetivosList = paciente.objetivos || [];
              const objetivoExibicao =
                objetivosList.length > 0
                  ? objetivosList.join(', ')
                  : paciente.objetivo_texto || 'Sem objetivo informado';

              return (
                <div
                  key={paciente.id}
                  onClick={() => onSelectPacienteId(paciente.id)}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-rose-500/50 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-sm hover:shadow-md hover:shadow-rose-950/20"
                >
                  {/* Informações Principais (Nome, Objetivo, Avatar) */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-950 to-zinc-900 border border-rose-500/30 flex items-center justify-center font-bold text-sm text-rose-400 group-hover:border-rose-500 group-hover:scale-105 transition-all shrink-0">
                      {paciente.nome.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-1">
                      {/* Nome do Paciente */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                          {paciente.nome}
                        </h3>
                        {paciente.sexo && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize">
                            {paciente.sexo}
                          </span>
                        )}
                        {paciente.telefone && (
                          <span className="text-[11px] text-zinc-400 hidden lg:inline">
                            • {paciente.telefone}
                          </span>
                        )}
                      </div>

                      {/* Objetivo — Conforme Prompt 4: "Cada paciente exibe: nome, objetivo e data da última consulta" */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <Target className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-zinc-400 font-medium">Objetivo:</span>
                        <span className="font-semibold text-zinc-200 truncate">
                          {objetivoExibicao}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Data da Última Consulta & Ação de Acesso */}
                  <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-800/80">
                    {/* Data da última consulta */}
                    <div className="text-left md:text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center md:justify-end gap-1 mb-0.5">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        Última Consulta
                      </div>
                      <div className="text-xs font-semibold text-zinc-200">
                        {paciente.ultima_consulta ? (
                          <span className="text-emerald-400 font-bold">
                            {formatDateBR(paciente.ultima_consulta)}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic">
                            Nenhuma consulta registrada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botão de Prontuário / Perfil */}
                    <button
                      type="button"
                      className="px-3.5 py-2 rounded-xl bg-zinc-800/80 group-hover:bg-rose-600 text-zinc-300 group-hover:text-white text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm shrink-0"
                    >
                      <span>Ver Perfil</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
