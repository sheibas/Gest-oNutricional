import React, { useEffect, useState } from 'react';
import {
  X,
  User as UserIcon,
  Calendar,
  Phone,
  MessageSquare,
  Activity,
  Plus,
  Clock,
  Sparkles,
  Weight,
  Ruler,
  Loader2,
  CalendarCheck,
  Coffee,
  Droplets,
  Dumbbell,
  Target,
  Mail,
} from 'lucide-react';
import { getPacienteDetails, createConsulta, type Paciente, type Consulta } from '../lib/db';
import { calculateAge, calculateIMC, formatDateBR } from '../lib/utils';

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

  if (!pacienteId) return null;

  const idade = paciente ? calculateAge(paciente.data_nascimento) : null;
  const imcInfo = paciente
    ? calculateIMC(
        paciente.peso_inicial ? Number(paciente.peso_inicial) : null,
        paciente.altura ? Number(paciente.altura) : null
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-left">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 border border-rose-500/40 flex items-center justify-center font-black text-xl text-white shadow-lg glow-red-sm shrink-0">
              {paciente ? paciente.nome.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {loading ? 'Carregando paciente...' : paciente?.nome}
                </h2>
                {paciente?.sexo && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 capitalize border border-zinc-700">
                    {paciente.sexo}
                  </span>
                )}
                {idade !== null && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-500/30">
                    {idade} anos
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Prontuário & Avaliação Nutricional Completa • NutriPadel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Fechar prontuário"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <span className="text-xs text-zinc-400">Carregando dados em tempo real do Neon...</span>
            </div>
          ) : !paciente ? (
            <div className="py-16 text-center text-zinc-400">Paciente não encontrado.</div>
          ) : (
            <>
              {/* Quick Info Grid: Antropometria & Contato */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Peso Inicial */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                    <Weight className="w-3.5 h-3.5 text-rose-400" /> Peso Inicial
                  </div>
                  <div className="text-base font-extrabold text-white">
                    {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '-'}
                  </div>
                </div>

                {/* Altura */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-amber-400" /> Altura
                  </div>
                  <div className="text-base font-extrabold text-white">
                    {paciente.altura
                      ? Number(paciente.altura) > 3
                        ? `${paciente.altura} cm`
                        : `${paciente.altura} m`
                      : '-'}
                  </div>
                </div>

                {/* IMC Calculado */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" /> IMC Inicial
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-white">
                      {imcInfo?.formatted || '-'}
                    </span>
                    {imcInfo?.value && (
                      <span className={`text-[10px] font-bold truncate ${imcInfo.colorClass}`}>
                        {imcInfo.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nascimento */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" /> Nascimento
                  </div>
                  <div className="text-sm font-bold text-zinc-200">
                    {formatDateBR(paciente.data_nascimento)}
                  </div>
                </div>
              </div>

              {/* Contatos */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-wrap gap-4 text-xs">
                {paciente.telefone && (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-zinc-400">Telefone:</span>
                    <span className="font-semibold text-white">{paciente.telefone}</span>
                  </div>
                )}
                {paciente.whatsapp && (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-zinc-400">WhatsApp:</span>
                    <span className="font-semibold text-emerald-300">{paciente.whatsapp}</span>
                  </div>
                )}
                {paciente.email && (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-zinc-400">E-mail:</span>
                    <span className="font-semibold text-white">{paciente.email}</span>
                  </div>
                )}
              </div>

              {/* Objetivos & Avaliação Clínica */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Objetivos & Perfil Clínico
                </h4>

                {/* Objetivos */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-zinc-400">Objetivos:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {paciente.objetivos && paciente.objetivos.length > 0 ? (
                      paciente.objetivos.map((obj) => (
                        <span
                          key={obj}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30"
                        >
                          {obj}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 italic">Nenhum objetivo selecionado</span>
                    )}
                  </div>
                  {paciente.objetivo_texto && (
                    <p className="text-xs text-zinc-300 mt-1 pl-1">
                      &bull; {paciente.objetivo_texto}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-zinc-400 block mb-0.5">Nível de Atividade:</span>
                    <span className="text-zinc-200 font-semibold capitalize">
                      {paciente.nivel_atividade || 'Não informado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block mb-0.5">Medicamentos Contínuos:</span>
                    <span className="text-zinc-200 font-medium">
                      {paciente.medicamentos || 'Nenhum'}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block mb-0.5">Suplementação em Uso:</span>
                    <span className="text-zinc-200 font-medium">
                      {paciente.suplementos || 'Nenhum'}
                    </span>
                  </div>
                </div>

                {/* Patologias, Restrições & Alergias */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/80">
                  {/* Patologias */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-zinc-400 block">
                      Patologias / Condições:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {paciente.patologias && paciente.patologias.length > 0 ? (
                        paciente.patologias.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-red-950/60 text-red-300 border border-red-500/30"
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-zinc-400">Nenhuma</span>
                      )}
                    </div>
                  </div>

                  {/* Restrições */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-zinc-400 block">
                      Restrições Alimentares:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0 ? (
                        paciente.restricoes_alimentares.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30"
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-zinc-400">Nenhuma</span>
                      )}
                    </div>
                  </div>

                  {/* Alergias */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-zinc-400 block">
                      Alergias Alimentares:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {paciente.alergias && paciente.alergias.length > 0 ? (
                        paciente.alergias.map((a) => (
                          <span
                            key={a}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-500/30"
                          >
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-zinc-400">Nenhuma</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rotina e Hábitos de Vida */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4" /> Rotina Diária & Hábitos
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 block text-[11px] mb-0.5">Refeições/dia:</span>
                    <span className="text-white font-bold text-sm">
                      {paciente.refeicoes_por_dia || '-'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 block text-[11px] mb-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> Acorda:
                    </span>
                    <span className="text-white font-bold text-sm">
                      {paciente.horario_acorda || '-'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 block text-[11px] mb-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" /> Dorme:
                    </span>
                    <span className="text-white font-bold text-sm">
                      {paciente.horario_dorme || '-'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 block text-[11px] mb-0.5 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-400" /> Água/dia:
                    </span>
                    <span className="text-white font-bold text-sm">
                      {paciente.litros_agua ? `${paciente.litros_agua} L` : '-'}
                    </span>
                  </div>
                </div>

                {paciente.atividade_fisica !== null && paciente.atividade_fisica !== undefined && (
                  <div className="pt-2 text-xs text-zinc-300 flex items-start gap-2">
                    <Dumbbell className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">
                        Atividade Física: {paciente.atividade_fisica ? 'Sim' : 'Não'}
                      </span>
                      {paciente.atividade_fisica_descricao && (
                        <p className="text-zinc-400 mt-0.5">
                          {paciente.atividade_fisica_descricao}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {paciente.observacoes && (
                  <div className="pt-2 border-t border-zinc-800 text-xs">
                    <span className="text-zinc-400 block mb-0.5 font-semibold">Observações Gerais:</span>
                    <p className="text-zinc-300 italic">{paciente.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Consultas Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-rose-500" /> Histórico de Consultas ({consultas.length})
                  </h4>

                  <button
                    onClick={() => setShowAddConsulta(!showAddConsulta)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddConsulta ? 'Cancelar' : 'Nova Consulta'}</span>
                  </button>
                </div>

                {/* Form de Nova Consulta */}
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
                            {formatDateBR(c.data_consulta)}
                          </span>

                          {c.proximo_retorno && (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              Retorno: {formatDateBR(c.proximo_retorno)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-zinc-300">
                          {c.peso && (
                            <div>
                              Peso: <strong className="text-white">{c.peso} kg</strong>
                            </div>
                          )}
                          {c.cintura && (
                            <div>
                              Cintura: <strong className="text-white">{c.cintura} cm</strong>
                            </div>
                          )}
                          {c.quadril && (
                            <div>
                              Quadril: <strong className="text-white">{c.quadril} cm</strong>
                            </div>
                          )}
                          {c.percentual_gordura && (
                            <div>
                              % Gordura: <strong className="text-white">{c.percentual_gordura}%</strong>
                            </div>
                          )}
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
