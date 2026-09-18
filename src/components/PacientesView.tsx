import React, { useState } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  Mail,
  Weight,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { type Paciente } from '../lib/db';

interface PacientesViewProps {
  pacientes: Paciente[];
  loading: boolean;
  onRefresh: () => void;
  onSelectPacienteId: (id: string) => void;
  onOpenNewPacienteModal: () => void;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  pacientes,
  loading,
  onRefresh,
  onSelectPacienteId,
  onOpenNewPacienteModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPacientes = pacientes.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.nome.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.whatsapp && p.whatsapp.includes(term)) ||
      (p.objetivo_texto && p.objetivo_texto.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Gestão de Atletas e Pacientes
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Meus Pacientes ({pacientes.length})
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Visualize, filtre e acerte o acompanhamento nutricional de cada paciente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-medium cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-500' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={onOpenNewPacienteModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 border border-rose-500/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar paciente por nome, email ou whatsapp..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-white text-xs placeholder:text-zinc-400 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all"
        />
      </div>

      {/* List / Table */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-zinc-800">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-800/50" />
            ))}
          </div>
        ) : filteredPacientes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-300">
                {searchTerm ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado ainda.'}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? 'Verifique a grafia do nome ou limpe a busca.'
                  : 'Comece adicionando seu primeiro atleta ou paciente no botão "Novo Paciente".'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPacientes.map((paciente) => (
              <div
                key={paciente.id}
                onClick={() => onSelectPacienteId(paciente.id)}
                className="p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/90 border border-zinc-800/70 hover:border-rose-500/40 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-950 to-zinc-900 border border-rose-500/30 flex items-center justify-center font-bold text-sm text-rose-400 group-hover:border-rose-500 transition-colors shrink-0">
                    {paciente.nome.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors flex items-center gap-2">
                      {paciente.nome}
                      {paciente.sexo && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize">
                          {paciente.sexo}
                        </span>
                      )}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                      {paciente.whatsapp && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Phone className="w-3 h-3" /> {paciente.whatsapp}
                        </span>
                      )}
                      {paciente.email && (
                        <span className="hidden sm:flex items-center gap-1 text-zinc-400">
                          <Mail className="w-3 h-3" /> {paciente.email}
                        </span>
                      )}
                      {paciente.peso_inicial && (
                        <span className="flex items-center gap-1 text-zinc-300">
                          <Weight className="w-3 h-3 text-rose-400" /> {paciente.peso_inicial} kg
                        </span>
                      )}
                      {paciente.objetivo_texto && (
                        <span className="hidden md:inline text-zinc-400 truncate max-w-xs">
                          • {paciente.objetivo_texto}
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
                    <span>Ver Prontuário</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
