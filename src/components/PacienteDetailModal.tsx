import React, { useEffect, useState } from 'react';
import {
  X,
  User as UserIcon,
  Calendar,
  Phone,
  Activity,
  Plus,
  Clock,
  Sparkles,
  Weight,
  Ruler,
  Loader2,
  CalendarCheck,
} from 'lucide-react';
import { getPacienteDetails, createConsulta, type Paciente, type Consulta } from '../lib/db';

interface PacienteDetailModalProps {
  pacienteId: string | null;
  onClose: () => void;
  onDataChanged: () => void;
}

export const PacienteDetailModal: React.FC<PacienteDetailModalProps> = ({
  pacienteId,
  onClose,
  onDataChanged,
}) => {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);

  // New consultation state
  const [showAddConsulta, setShowAddConsulta] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0]);
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [proximoRetorno, setProximoRetorno] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (!pacienteId) return;

    async function fetchDetails() {
      setLoading(true);
      try {
        const data = await getPacienteDetails(pacienteId!);
        setPaciente(data.paciente);
        setConsultas(data.consultas);
      } catch (err) {
        console.error('Erro ao carregar detalhes do paciente:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [pacienteId]);

  const handleCreateConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId || !dataConsulta) return;

    setSavingConsulta(true);
    try {
      await createConsulta({
        paciente_id: pacienteId,
        data_consulta: dataConsulta,
        peso: peso ? parseFloat(peso) : null,
        cintura: cintura ? parseFloat(cintura) : null,
        quadril: quadril ? parseFloat(quadril) : null,
        percentual_gordura: percentualGordura ? parseFloat(percentualGordura) : null,
        proximo_retorno: proximoRetorno || null,
        observacoes: observacoes || null,
      });

      // Refetch consultations
      const data = await getPacienteDetails(pacienteId);
      setConsultas(data.consultas);
      setShowAddConsulta(false);
      // Reset form
      setPeso('');
      setCintura('');
      setQuadril('');
      setPercentualGordura('');
      setProximoRetorno('');
      setObservacoes('');
      onDataChanged();
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
    } finally {
      setSavingConsulta(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  if (!pacienteId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-left">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 border border-rose-500/40 flex items-center justify-center font-black text-lg text-white shadow-lg glow-red-sm">
              {paciente ? paciente.nome.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {loading ? 'Carregando paciente...' : paciente?.nome}
              </h2>
              <p className="text-xs text-zinc-400">Perfil do Paciente • NutriPadel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <span className="text-xs text-zinc-400">Carregando histórico do Neon...</span>
            </div>
          ) : !paciente ? (
            <div className="py-12 text-center text-zinc-400">Paciente não encontrado.</div>
          ) : (
            <>
              {/* Quick Info Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                    <Weight className="w-3.5 h-3.5 text-rose-400" /> Peso Inicial
                  </div>
                  <div className="text-base font-bold text-white">
                    {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '-'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-amber-400" /> Altura
                  </div>
                  <div className="text-base font-bold text-white">
                    {paciente.altura ? `${paciente.altura} m` : '-'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
                  </div>
                  <div className="text-sm font-semibold text-zinc-200 truncate">
                    {paciente.whatsapp || '-'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" /> Nascimento
                  </div>
                  <div className="text-sm font-semibold text-zinc-200">
                    {formatDate(paciente.data_nascimento)}
                  </div>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/70 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Informações Clínicas & Objetivos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400 block mb-0.5">Objetivo:</span>
                    <span className="text-zinc-200 font-medium">
                      {paciente.objetivo_texto || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">Nível de Atividade:</span>
                    <span className="text-zinc-200 font-medium capitalize">
                      {paciente.nivel_atividade || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">Medicamentos / Suplementos:</span>
                    <span className="text-zinc-200 font-medium">
                      {paciente.medicamentos || paciente.suplementos || 'Nenhum'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">E-mail:</span>
                    <span className="text-zinc-200 font-medium">{paciente.email || '-'}</span>
                  </div>
                </div>
                {paciente.observacoes && (
                  <div className="pt-2 border-t border-zinc-800/60 text-xs">
                    <span className="text-zinc-400 block mb-0.5">Observações:</span>
                    <p className="text-zinc-300 italic">{paciente.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Consultations Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-rose-500" /> Histórico de Consultas ({consultas.length})
                  </h4>

                  <button
                    onClick={() => setShowAddConsulta(!showAddConsulta)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddConsulta ? 'Cancelar' : 'Nova Consulta'}</span>
                  </button>
                </div>

                {/* New Consulta Form */}
                {showAddConsulta && (
                  <form
                    onSubmit={handleCreateConsulta}
                    className="p-5 rounded-2xl bg-zinc-900 border border-rose-500/30 space-y-4 animate-fade-in"
                  >
                    <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Registrar Consulta no Neon
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Data da Consulta *</label>
                        <input
                          type="date"
                          value={dataConsulta}
                          onChange={(e) => setDataConsulta(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Peso Atual (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 75.5"
                          value={peso}
                          onChange={(e) => setPeso(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Próximo Retorno</label>
                        <input
                          type="date"
                          value={proximoRetorno}
                          onChange={(e) => setProximoRetorno(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Cintura (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 82"
                          value={cintura}
                          onChange={(e) => setCintura(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Quadril (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 98"
                          value={quadril}
                          onChange={(e) => setQuadril(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">% Gordura</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 16.5"
                          value={percentualGordura}
                          onChange={(e) => setPercentualGordura(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Observações da Consulta</label>
                      <textarea
                        rows={2}
                        placeholder="Evolução, ajustes no plano alimentar do atleta..."
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddConsulta(false)}
                        className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingConsulta}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        {savingConsulta ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                          </>
                        ) : (
                          'Salvar Consulta'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Consultas List */}
                {consultas.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 text-center text-xs text-zinc-400">
                    Nenhuma consulta registrada para este paciente ainda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {consultas.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-rose-400" /> Consulta em{' '}
                            {formatDate(c.data_consulta)}
                          </span>

                          {c.proximo_retorno && (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              Retorno: {formatDate(c.proximo_retorno)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-zinc-300">
                          {c.peso && <div>Peso: <strong className="text-white">{c.peso} kg</strong></div>}
                          {c.cintura && <div>Cintura: <strong className="text-white">{c.cintura} cm</strong></div>}
                          {c.quadril && <div>Quadril: <strong className="text-white">{c.quadril} cm</strong></div>}
                          {c.percentual_gordura && <div>% Gordura: <strong className="text-white">{c.percentual_gordura}%</strong></div>}
                        </div>

                        {c.observacoes && (
                          <p className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
                            {c.observacoes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
