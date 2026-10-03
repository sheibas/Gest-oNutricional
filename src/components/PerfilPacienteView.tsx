import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  User as UserIcon,
  Activity,
  Coffee,
  CalendarCheck,
  Utensils,
  Plus,
  Weight,
  Ruler,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Clock,
  Droplets,
  Dumbbell,
  Check,
  X,
  Sparkles,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
} from 'lucide-react';
import {
  getPacienteDetails,
  updatePaciente,
  createConsulta,
  getPlanosAlimentares,
  type Paciente,
  type Consulta,
  type PlanoAlimentar,
} from '../lib/db';
import {
  formatPhone,
  calculateAge,
  calculateIMC,
  formatTimeInput,
  formatDateBR,
} from '../lib/utils';
import { WeightEvolutionChart } from './WeightEvolutionChart';

interface PerfilPacienteViewProps {
  pacienteId: string;
  onBack: () => void;
  onDataChanged?: () => void;
}

type MainSection = 'dados' | 'consultas' | 'planos';
type SubTab = 'pessoal' | 'clinico' | 'habitos';

const OBJETIVOS_PRESET = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  { id: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
  { id: 'Levemente ativo', desc: 'Exercício leve 1 a 3 dias/sem' },
  { id: 'Moderadamente ativo', desc: 'Exercício moderado 3 a 5 dias/sem' },
  { id: 'Muito ativo', desc: 'Exercício pesado 6 a 7 dias/sem' },
  { id: 'Extremamente ativo', desc: 'Treino muito pesado / atleta padel' },
  { id: 'Preguiçoso', desc: 'Rotina de repouso predominante' },
];

const PATOLOGIAS_PRESET = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_PRESET = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_PRESET = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

export const PerfilPacienteView: React.FC<PerfilPacienteViewProps> = ({
  pacienteId,
  onBack,
  onDataChanged,
}) => {
  // Navigation sections
  const [activeSection, setActiveSection] = useState<MainSection>('dados');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('pessoal');

  // Loading & Data states
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);

  // Feedback states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savingPaciente, setSavingPaciente] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Seção 1: Form de Edição do Paciente ---
  // Aba Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba Clínico
  const [pesoAtual, setPesoAtual] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Moderadamente ativo');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [customPatologia, setCustomPatologia] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [customRestricao, setCustomRestricao] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [customAlergia, setCustomAlergia] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState<boolean | null>(null);
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // --- Seção 2: Modal de Nova Consulta ---
  const [showAddConsultaModal, setShowAddConsultaModal] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [novaDataConsulta, setNovaDataConsulta] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [novoPeso, setNovoPeso] = useState('');
  const [novaCintura, setNovaCintura] = useState('');
  const [novoQuadril, setNovoQuadril] = useState('');
  const [novoPercentualGordura, setNovoPercentualGordura] = useState('');
  const [novasObservacoes, setNovasObservacoes] = useState('');
  const [novoProximoRetorno, setNovoProximoRetorno] = useState('');

  // --- Seção 3: Visualizador de Plano Alimentar ---
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null);

  // Carregar dados completos do paciente do Neon
  const loadData = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const [details, planosList] = await Promise.all([
        getPacienteDetails(pacienteId),
        getPlanosAlimentares(pacienteId),
      ]);

      if (details.paciente) {
        const p = details.paciente;
        setPaciente(p);
        setNome(p.nome || '');
        setDataNascimento(p.data_nascimento || '');
        setSexo((p.sexo as any) || 'Feminino');
        setTelefone(p.telefone || '');
        setWhatsapp(p.whatsapp || '');
        setEmail(p.email || '');

        setPesoAtual(p.peso_inicial ? String(p.peso_inicial) : '');
        // Se altura veio em metros (ex: 1.75), converte para cm (175)
        const alt = p.altura ? Number(p.altura) : null;
        setAlturaCm(alt ? String(alt > 3 ? alt : Math.round(alt * 100)) : '');

        setObjetivos(p.objetivos || []);
        setObjetivoTexto(p.objetivo_texto || '');
        setNivelAtividade(p.nivel_atividade || 'Moderadamente ativo');
        setPatologias(p.patologias || []);
        setRestricoes(p.restricoes_alimentares || []);
        setAlergias(p.alergias || []);
        setMedicamentos(p.medicamentos || '');
        setSuplementos(p.suplementos || '');

        setRefeicoesPorDia(p.refeicoes_por_dia ? String(p.refeicoes_por_dia) : '');
        setHorarioAcorda(p.horario_acorda || '');
        setHorarioDorme(p.horario_dorme || '');
        setLitrosAgua(p.litros_agua ? String(p.litros_agua) : '');
        setPraticaAtividade(p.atividade_fisica ?? null);
        setAtividadeDescricao(p.atividade_fisica_descricao || '');
        setObservacoes(p.observacoes || '');
      }

      setConsultas(details.consultas || []);
      setPlanos(planosList || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados do paciente:', err);
      setErrorMessage('Erro ao carregar prontuário do banco de dados.');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Derived values
  const idadeCalculada = calculateAge(dataNascimento);
  const pesoNum = pesoAtual ? parseFloat(pesoAtual) : null;
  const alturaNum = alturaCm ? parseFloat(alturaCm) : null;
  const imcInfo = calculateIMC(pesoNum, alturaNum);

  // Handlers para multiselect com opção "Nenhum"
  const handleToggleMulti = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (item === 'Nenhum') {
      if (currentList.includes('Nenhum')) {
        setList([]);
      } else {
        setList(['Nenhum']);
      }
      return;
    }

    let updated = currentList.filter((i) => i !== 'Nenhum');
    if (updated.includes(item)) {
      updated = updated.filter((i) => i !== item);
    } else {
      updated.push(item);
    }
    setList(updated);
  };

  const handleAddCustomTag = (
    value: string,
    setValue: (v: string) => void,
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!currentList.includes(trimmed)) {
      const updated = currentList.filter((i) => i !== 'Nenhum');
      setList([...updated, trimmed]);
    }
    setValue('');
  };

  const handleRemoveTag = (
    item: string,
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(currentList.filter((i) => i !== item));
  };

  // --- Salvar Alterações dos Dados do Paciente ---
  const handleSavePaciente = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!nome.trim()) {
      setErrorMessage('O nome do paciente é obrigatório.');
      return;
    }

    setSavingPaciente(true);
    setErrorMessage(null);

    try {
      const payload: Partial<Paciente> = {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        telefone: telefone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        peso_inicial: pesoNum,
        altura: alturaNum,
        objetivos: objetivos.length > 0 ? objetivos : null,
        objetivo_texto: objetivoTexto.trim() || null,
        nivel_atividade: nivelAtividade || null,
        patologias: patologias.length > 0 ? patologias : null,
        restricoes_alimentares: restricoes.length > 0 ? restricoes : null,
        alergias: alergias.length > 0 ? alergias : null,
        medicamentos: medicamentos.trim() || null,
        suplementos: suplementos.trim() || null,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null,
        horario_acorda: horarioAcorda.trim() || null,
        horario_dorme: horarioDorme.trim() || null,
        litros_agua: litrosAgua ? parseFloat(litrosAgua) : null,
        atividade_fisica: praticaAtividade,
        atividade_fisica_descricao: praticaAtividade ? atividadeDescricao.trim() || null : null,
        observacoes: observacoes.trim() || null,
      };

      const updated = await updatePaciente(pacienteId, payload);
      if (updated) {
        setPaciente(updated);
        setToastMessage('Alterações do paciente salvas com sucesso!');
        if (onDataChanged) onDataChanged();
      }
    } catch (err: any) {
      console.error('Erro ao atualizar paciente:', err);
      setErrorMessage('Falha ao salvar alterações no banco de dados. Tente novamente.');
    } finally {
      setSavingPaciente(false);
    }
  };

  // --- Salvar Nova Consulta ---
  const handleSaveConsulta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaDataConsulta) {
      alert('Por favor, informe a data da consulta.');
      return;
    }

    if (!novoPeso) {
      alert('Por favor, informe o peso atual registrado na consulta.');
      return;
    }

    setSavingConsulta(true);
    try {
      await createConsulta({
        paciente_id: pacienteId,
        data_consulta: novaDataConsulta,
        peso: novoPeso ? parseFloat(novoPeso) : null,
        cintura: novaCintura ? parseFloat(novaCintura) : null,
        quadril: novoQuadril ? parseFloat(novoQuadril) : null,
        percentual_gordura: novoPercentualGordura ? parseFloat(novoPercentualGordura) : null,
        observacoes: novasObservacoes.trim() || null,
        proximo_retorno: novoProximoRetorno || null,
      });

      // Fechar modal, atualizar lista e gráfico automaticamente conforme Prompt 5
      setShowAddConsultaModal(false);
      setNovoPeso('');
      setNovaCintura('');
      setNovoQuadril('');
      setNovoPercentualGordura('');
      setNovasObservacoes('');
      setNovoProximoRetorno('');
      setToastMessage('Nova consulta registrada com sucesso!');

      // Recarrega dados em tempo real
      await loadData();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      console.error('Erro ao salvar consulta:', err);
      alert('Erro ao registrar consulta no banco de dados.');
    } finally {
      setSavingConsulta(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <span className="text-sm text-zinc-400 font-medium">
          Carregando prontuário completo do paciente...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left pb-20 max-w-6xl mx-auto">
      {/* Toast de Sucesso Flutuante */}
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

      {/* Header Principal do Perfil */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Voltar para a lista de pacientes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 border border-rose-500/40 flex items-center justify-center font-black text-xl text-white shadow-lg glow-red-sm shrink-0">
              {paciente ? paciente.nome.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
                  {paciente?.nome || 'Perfil do Paciente'}
                </h1>
                {paciente?.sexo && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 capitalize border border-zinc-700">
                    {paciente.sexo}
                  </span>
                )}
                {idadeCalculada !== null && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-500/30">
                    {idadeCalculada} anos
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Prontuário completo integrado ao Neon • NutriPadel
              </p>
            </div>
          </div>
        </div>

        {/* Ações Rápidas no Topo */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setNovaDataConsulta(new Date().toISOString().split('T')[0]);
              setShowAddConsultaModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 border border-rose-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Consulta</span>
          </button>
        </div>
      </div>

      {/* Alerta de Erro se houver */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navegação entre as 3 Seções Principais (Prompt 5) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveSection('dados')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSection === 'dados'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-950/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>1. Dados do Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('consultas')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSection === 'consultas'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-950/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>2. Consultas</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900/80 text-zinc-300 font-bold border border-zinc-700">
            {consultas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('planos')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSection === 'planos'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-950/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>3. Planos Alimentares</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900/80 text-zinc-300 font-bold border border-zinc-700">
            {planos.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: DADOS DO PACIENTE (EDITÁVEIS DIRETAMENTE NA PÁGINA)               */}
      {/* ========================================================================= */}
      {activeSection === 'dados' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub-abas: Pessoal, Clínico e Hábitos */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveSubTab('pessoal')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'pessoal'
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Pessoal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('clinico')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'clinico'
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Clínico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('habitos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'habitos'
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Hábitos</span>
            </button>
          </div>

          <form onSubmit={handleSavePaciente} className="space-y-6">
            {/* --- SUB-ABA PESSOAL --- */}
            {activeSubTab === 'pessoal' && (
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-800 space-y-6">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-rose-500" />
                    Identificação & Dados Pessoais
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Edite as informações pessoais e canais de contato diretamente aqui.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Data de Nascimento
                      </span>
                      {idadeCalculada !== null && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {idadeCalculada} anos
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Sexo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Feminino', 'Masculino', 'Outro'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSexo(s)}
                          className={`py-3 px-2 rounded-2xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                            sexo === s
                              ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow-sm'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" /> Telefone Fixo / Residencial
                    </label>
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" /> E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* --- SUB-ABA CLÍNICO --- */}
            {activeSubTab === 'clinico' && (
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-800 space-y-6">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-500" />
                    Avaliação Clínica & Antropometria
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Peso, altura, IMC, objetivos clínicos e restrições alimentares.
                  </p>
                </div>

                {/* Antropometria & IMC */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <Weight className="w-3.5 h-3.5 text-rose-400" /> Peso Atual (kg)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="500"
                        value={pesoAtual}
                        onChange={(e) => setPesoAtual(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-amber-400" /> Altura (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="30"
                        max="260"
                        value={alturaCm}
                        onChange={(e) => setAlturaCm(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-center">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      IMC Calculado
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-white">
                        {imcInfo.formatted}
                      </span>
                      <span className={`text-xs font-semibold ${imcInfo.colorClass}`}>
                        {imcInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Objetivos Nutricionais (múltipla escolha)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OBJETIVOS_PRESET.map((obj) => {
                      const isSelected = objetivos.includes(obj);
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => handleToggleMulti(objetivos, setObjetivos, obj)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/30'
                              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{obj}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Outro objetivo ou observação adicional..."
                      value={objetivoTexto}
                      onChange={(e) => setObjetivoTexto(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                {/* Nível de Atividade */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Nível de Atividade Física (seleção única)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {NIVEIS_ATIVIDADE.map((nivel) => {
                      const isSelected = nivelAtividade === nivel.id;
                      return (
                        <button
                          key={nivel.id}
                          type="button"
                          onClick={() => setNivelAtividade(nivel.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600/20 border-rose-500 text-white shadow-sm'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span>{nivel.id}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                            {nivel.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Patologias */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Patologias ou Condições de Saúde
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleMulti(patologias, setPatologias, 'Nenhum')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        patologias.includes('Nenhum')
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {patologias.includes('Nenhum') && <Check className="w-3 h-3" />}
                      <span>Nenhum</span>
                    </button>

                    {PATOLOGIAS_PRESET.map((pat) => {
                      const isSelected = patologias.includes(pat);
                      return (
                        <button
                          key={pat}
                          type="button"
                          onClick={() => handleToggleMulti(patologias, setPatologias, pat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{pat}</span>
                        </button>
                      );
                    })}

                    {patologias
                      .filter((p) => p !== 'Nenhum' && !PATOLOGIAS_PRESET.includes(p))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-center gap-1.5"
                        >
                          <span>{custom}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(custom, patologias, setPatologias)}
                            className="hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Adicionar patologia..."
                      value={customPatologia}
                      onChange={(e) => setCustomPatologia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTag(customPatologia, setCustomPatologia, patologias, setPatologias);
                        }
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900/70 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-rose-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleAddCustomTag(customPatologia, setCustomPatologia, patologias, setPatologias)
                      }
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Restrições Alimentares */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Restrições Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleMulti(restricoes, setRestricoes, 'Nenhum')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        restricoes.includes('Nenhum')
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {restricoes.includes('Nenhum') && <Check className="w-3 h-3" />}
                      <span>Nenhum</span>
                    </button>

                    {RESTRICOES_PRESET.map((rest) => {
                      const isSelected = restricoes.includes(rest);
                      return (
                        <button
                          key={rest}
                          type="button"
                          onClick={() => handleToggleMulti(restricoes, setRestricoes, rest)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{rest}</span>
                        </button>
                      );
                    })}

                    {restricoes
                      .filter((r) => r !== 'Nenhum' && !RESTRICOES_PRESET.includes(r))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-center gap-1.5"
                        >
                          <span>{custom}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(custom, restricoes, setRestricoes)}
                            className="hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Adicionar restrição alimentar..."
                      value={customRestricao}
                      onChange={(e) => setCustomRestricao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTag(customRestricao, setCustomRestricao, restricoes, setRestricoes);
                        }
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900/70 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-rose-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleAddCustomTag(customRestricao, setCustomRestricao, restricoes, setRestricoes)
                      }
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Alergias Alimentares */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Alergias Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleMulti(alergias, setAlergias, 'Nenhum')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        alergias.includes('Nenhum')
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {alergias.includes('Nenhum') && <Check className="w-3 h-3" />}
                      <span>Nenhum</span>
                    </button>

                    {ALERGIAS_PRESET.map((ale) => {
                      const isSelected = alergias.includes(ale);
                      return (
                        <button
                          key={ale}
                          type="button"
                          onClick={() => handleToggleMulti(alergias, setAlergias, ale)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{ale}</span>
                        </button>
                      );
                    })}

                    {alergias
                      .filter((a) => a !== 'Nenhum' && !ALERGIAS_PRESET.includes(a))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-center gap-1.5"
                        >
                          <span>{custom}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(custom, alergias, setAlergias)}
                            className="hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Adicionar alergia alimentar..."
                      value={customAlergia}
                      onChange={(e) => setCustomAlergia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTag(customAlergia, setCustomAlergia, alergias, setAlergias);
                        }
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900/70 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-rose-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleAddCustomTag(customAlergia, setCustomAlergia, alergias, setAlergias)
                      }
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Medicamentos & Suplementos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Medicamentos Contínuos
                    </label>
                    <textarea
                      rows={2}
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Suplementos em Uso
                    </label>
                    <textarea
                      rows={2}
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* --- SUB-ABA HÁBITOS --- */}
            {activeSubTab === 'habitos' && (
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-800 space-y-6">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-rose-500" />
                    Rotina Diária & Hábitos de Vida
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Horários, ingestão hídrica, refeições e prática de esportes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Refeições por dia
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={refeicoesPorDia}
                      onChange={(e) => setRefeicoesPorDia(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Horário que acorda
                    </label>
                    <input
                      type="text"
                      value={horarioAcorda}
                      onChange={(e) => setHorarioAcorda(e.target.value)}
                      onBlur={() => setHorarioAcorda(formatTimeInput(horarioAcorda))}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none"
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Digite ex: 6 (06:00) ou 630 (06:30)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> Horário que dorme
                    </label>
                    <input
                      type="text"
                      value={horarioDorme}
                      onChange={(e) => setHorarioDorme(e.target.value)}
                      onBlur={() => setHorarioDorme(formatTimeInput(horarioDorme))}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none"
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Digite ex: 23 (23:00) ou 2230 (22:30)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Água por dia
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="15"
                        value={litrosAgua}
                        onChange={(e) => setLitrosAgua(e.target.value)}
                        className="w-full pl-4 pr-14 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                        litros
                      </span>
                    </div>
                  </div>
                </div>

                {/* Atividade física */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-rose-400" /> Pratica atividade física?
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPraticaAtividade(true)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                        praticaAtividade === true
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/30'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${praticaAtividade === true ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Sim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPraticaAtividade(false);
                        setAtividadeDescricao('');
                      }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                        praticaAtividade === false
                          ? 'bg-zinc-800 text-white border-zinc-600 shadow-md'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${praticaAtividade === false ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Não</span>
                    </button>
                  </div>

                  {praticaAtividade === true && (
                    <div className="pt-2 animate-fade-in">
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Qual atividade e frequência semanal?
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Treino de Padel 3x por semana e Musculação 2x por semana"
                        value={atividadeDescricao}
                        onChange={(e) => setAtividadeDescricao(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-rose-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Observações Gerais
                  </label>
                  <textarea
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Botão de Salvar Alterações Conforme Prompt 5 */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Os dados alterados serão sincronizados em tempo real no banco Neon.
              </span>

              <button
                type="submit"
                disabled={savingPaciente}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs tracking-wide shadow-xl shadow-rose-950/50 border border-rose-500/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingPaciente ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando alterações...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 2: CONSULTAS & EVOLUÇÃO DE PESO                                      */}
      {/* ========================================================================= */}
      {activeSection === 'consultas' && (
        <div className="space-y-6 animate-fade-in">
          {/* Gráfico de Evolução de Peso Sempre Visível (Prompt 5) */}
          <WeightEvolutionChart
            consultas={consultas}
            pesoInicial={paciente?.peso_inicial ? Number(paciente.peso_inicial) : null}
          />

          {/* Cabeçalho da Lista de Consultas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-800">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-rose-500" />
                Histórico de Consultas ({consultas.length})
              </h3>
              <p className="text-xs text-zinc-400">
                Consultas em ordem cronológica decrescente com medidas e registros clínicos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNovaDataConsulta(new Date().toISOString().split('T')[0]);
                setShowAddConsultaModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 border border-rose-500/30 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Consulta</span>
            </button>
          </div>

          {/* Lista de Consultas */}
          {consultas.length === 0 ? (
            <div className="py-14 glass-panel rounded-3xl border border-zinc-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <Calendar className="w-6 h-6 text-zinc-600" />
              </div>
              <h4 className="text-sm font-bold text-zinc-300">
                Nenhuma consulta registrada ainda
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Registre a primeira consulta do atleta para começar a acompanhar medidas antropométricas e evolução.
              </p>
              <button
                type="button"
                onClick={() => {
                  setNovaDataConsulta(new Date().toISOString().split('T')[0]);
                  setShowAddConsultaModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Primeira Consulta</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {consultas.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-rose-500/40 transition-all space-y-3 text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/70 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">
                          Consulta em {formatDateBR(c.data_consulta)}
                        </span>
                      </div>
                    </div>

                    {c.proximo_retorno && (
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-semibold self-start sm:self-auto flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Próximo Retorno: {formatDateBR(c.proximo_retorno)}
                      </span>
                    )}
                  </div>

                  {/* Medidas corporais da consulta */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {c.peso && (
                      <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <span className="text-zinc-400 block text-[11px] mb-0.5">Peso:</span>
                        <span className="text-sm font-extrabold text-white">{c.peso} kg</span>
                      </div>
                    )}
                    {c.cintura && (
                      <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <span className="text-zinc-400 block text-[11px] mb-0.5">Cintura:</span>
                        <span className="text-sm font-extrabold text-white">{c.cintura} cm</span>
                      </div>
                    )}
                    {c.quadril && (
                      <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <span className="text-zinc-400 block text-[11px] mb-0.5">Quadril:</span>
                        <span className="text-sm font-extrabold text-white">{c.quadril} cm</span>
                      </div>
                    )}
                    {c.percentual_gordura && (
                      <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <span className="text-zinc-400 block text-[11px] mb-0.5">% de Gordura:</span>
                        <span className="text-sm font-extrabold text-white">{c.percentual_gordura}%</span>
                      </div>
                    )}
                  </div>

                  {c.observacoes && (
                    <div className="pt-2 text-xs text-zinc-300">
                      <span className="text-zinc-400 block mb-0.5 font-semibold">Observações:</span>
                      <p className="text-zinc-300 italic bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50">
                        {c.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 3: PLANOS ALIMENTARES                                               */}
      {/* ========================================================================= */}
      {activeSection === 'planos' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header da Seção de Planos com o Botão "Gerar Plano Alimentar" */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-1">
              <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> IA Nutricional Integrada
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Planos Alimentares Personalizados
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg">
                Gere cardápios e planos estratégicos com inteligência artificial baseados nas metas, rotina e restrições do paciente.
              </p>
            </div>

            {/* Botão "Gerar Plano Alimentar" bem visível (Prompt 5) */}
            <button
              type="button"
              onClick={() => {
                alert(
                  'A funcionalidade de geração automática via inteligência artificial será conectada no Prompt 6!'
                );
              }}
              className="relative z-10 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-xl shadow-rose-950/60 border border-rose-500/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 group shrink-0"
            >
              <Sparkles className="w-4 h-4 text-rose-200 group-hover:rotate-12 transition-transform" />
              <span>Gerar Plano Alimentar</span>
            </button>
          </div>

          {/* Histórico de Planos Salvos */}
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-400" />
                Histórico de Planos ({planos.length})
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Planos alimentares arquivados em ordem cronológica decrescente.
              </p>
            </div>

            {planos.length === 0 ? (
              // Regra do Prompt 5: Se não houver planos salvos ainda, exibir a mensagem "Nenhum plano alimentar gerado ainda"
              <div className="py-20 glass-panel rounded-3xl border border-zinc-800 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500 shadow-inner">
                  <Utensils className="w-7 h-7 text-zinc-600" />
                </div>
                <h4 className="text-base font-bold text-zinc-200">
                  Nenhum plano alimentar gerado ainda
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Utilize o botão acima para estruturar e gerar o primeiro plano alimentar deste paciente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planos.map((plano) => (
                  <div
                    key={plano.id}
                    onClick={() => setSelectedPlano(plano)}
                    className="p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-rose-500/50 transition-all cursor-pointer group flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                          Plano Alimentar
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30 font-semibold">
                          Salvo
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Gerado em {formatDateBR(plano.created_at?.split('T')[0])}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-800 group-hover:bg-rose-600 text-zinc-300 group-hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Conteúdo</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE NOVA CONSULTA (Prompt 5)                                         */}
      {/* ========================================================================= */}
      {showAddConsultaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-left">
            {/* Header do Modal */}
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nova Consulta</h3>
                  <p className="text-xs text-zinc-400">Registrar medições e acompanhamento clínico</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddConsultaModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário do Modal */}
            <form onSubmit={handleSaveConsulta} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data da consulta (preenchida automaticamente com hoje, editável) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Data da Consulta *
                  </label>
                  <input
                    type="date"
                    required
                    value={novaDataConsulta}
                    onChange={(e) => setNovaDataConsulta(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                  />
                </div>

                {/* Peso atual em kg (número) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Peso Atual em kg *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="500"
                    required
                    placeholder="Ex: 75.8"
                    value={novoPeso}
                    onChange={(e) => setNovoPeso(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                  />
                </div>

                {/* Cintura em cm (opcional) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Cintura em cm (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 82"
                    value={novaCintura}
                    onChange={(e) => setNovaCintura(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                  />
                </div>

                {/* Quadril em cm (opcional) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Quadril em cm (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 98"
                    value={novoQuadril}
                    onChange={(e) => setNovoQuadril(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                  />
                </div>

                {/* % de gordura (opcional) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    % de Gordura (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 16.5"
                    value={novoPercentualGordura}
                    onChange={(e) => setNovoPercentualGordura(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                  />
                </div>

                {/* Próximo retorno (seletor de data) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Próximo Retorno
                  </label>
                  <input
                    type="date"
                    value={novoProximoRetorno}
                    onChange={(e) => setNovoProximoRetorno(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              {/* Observações (texto livre) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Observações
                </label>
                <textarea
                  rows={3}
                  placeholder="Orientações dadas, evolução relatada, exames laboratoriais..."
                  value={novasObservacoes}
                  onChange={(e) => setNovasObservacoes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
                />
              </div>

              {/* Botões do Modal */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddConsultaModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingConsulta}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-950/40 border border-rose-500/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingConsulta ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando consulta...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar consulta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE VISUALIZAÇÃO DO CONTEÚDO DO PLANO ALIMENTAR (Prompt 5)           */}
      {/* ========================================================================= */}
      {selectedPlano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[88vh] flex flex-col text-left">
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-rose-500" />
                  Plano Alimentar
                </h3>
                <p className="text-xs text-zinc-400">
                  Gerado em {formatDateBR(selectedPlano.created_at?.split('T')[0])}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlano(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-200">
              <pre className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 font-mono text-xs overflow-x-auto text-zinc-300">
                {typeof selectedPlano.conteudo === 'string'
                  ? selectedPlano.conteudo
                  : JSON.stringify(selectedPlano.conteudo, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
