import React, { useState } from 'react';
import {
  User,
  Activity,
  Coffee,
  ArrowLeft,
  Sparkles,
  Loader2,
  Check,
  Plus,
  X,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Weight,
  Ruler,
  Clock,
  Droplets,
  Dumbbell,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { createPaciente, type Paciente } from '../lib/db';
import {
  formatPhone,
  calculateAge,
  calculateIMC,
  formatTimeInput,
} from '../lib/utils';

interface NovoPacienteViewProps {
  nutricionistaId: string;
  onCancel: () => void;
  onSuccess: (newPaciente: Paciente) => void;
}

type TabType = 'pessoal' | 'clinico' | 'habitos';

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

export const NovoPacienteView: React.FC<NovoPacienteViewProps> = ({
  nutricionistaId,
  onCancel,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pessoal');

  // --- Aba 1: Pessoal ---
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // --- Aba 2: Clínico ---
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

  // --- Aba 3: Hábitos ---
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState<boolean | null>(null);
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Form states
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derived values
  const idadeCalculada = calculateAge(dataNascimento);
  const pesoNum = pesoAtual ? parseFloat(pesoAtual) : null;
  const alturaNum = alturaCm ? parseFloat(alturaCm) : null;
  const imcInfo = calculateIMC(pesoNum, alturaNum);

  // Handlers for multiselect with "Nenhum" logic
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

  // Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!nome.trim()) {
      setErrorMessage('O nome completo do paciente é obrigatório.');
      setActiveTab('pessoal');
      return;
    }

    if (!nutricionistaId) {
      setErrorMessage('Erro: identificador do nutricionista não encontrado. Faça login novamente.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const payload: Partial<Paciente> = {
        nutricionista_id: nutricionistaId,
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

      const created = await createPaciente(payload);

      if (created) {
        onSuccess(created);
      } else {
        throw new Error('Falha ao receber confirmação de cadastro do banco.');
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente:', err);
      setErrorMessage('Não foi possível salvar o paciente no banco de dados Neon. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left pb-16 max-w-5xl mx-auto">
      {/* Header bar with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Voltar para a lista de pacientes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Cadastro Clínico
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Novo Paciente
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-rose-950/40 border border-rose-500/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando Paciente...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Salvar Paciente</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'pessoal'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-950/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Pessoal</span>
          {nome.trim() && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'clinico'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-950/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Clínico</span>
          {(pesoNum || alturaNum || objetivos.length > 0) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'habitos'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-950/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>3. Hábitos</span>
          {(refeicoesPorDia || litrosAgua || horarioAcorda) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ===================== ABA 1: PESSOAL ===================== */}
        {activeTab === 'pessoal' && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-800 space-y-6 animate-fade-in">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-rose-500" />
                Dados Pessoais do Paciente
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Identificação e canais de contato. Apenas o nome completo é obrigatório.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nome Completo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nome Completo <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    Data de Nascimento
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
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                />
              </div>

              {/* Sexo */}
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

              {/* Telefone */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" /> Telefone Residencial / Fixo
                </label>
                <input
                  type="tel"
                  placeholder="(11) 3333-4444"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-8888"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" /> E-mail
                </label>
                <input
                  type="email"
                  placeholder="paciente@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Avançar para Clínico</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== ABA 2: CLÍNICO ===================== */}
        {activeTab === 'clinico' && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-800 space-y-6 animate-fade-in">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                Avaliação Clínica & Antropometria
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Medidas corporais, IMC automático, patologias e hábitos alimentares.
              </p>
            </div>

            {/* Antropometria & IMC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Peso atual */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Weight className="w-3.5 h-3.5 text-rose-400" /> Peso Atual
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="500"
                    placeholder="Ex: 78.5"
                    value={pesoAtual}
                    onChange={(e) => setPesoAtual(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* Altura atual */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" /> Altura
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="30"
                    max="260"
                    placeholder="Ex: 178"
                    value={alturaCm}
                    onChange={(e) => setAlturaCm(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                    cm
                  </span>
                </div>
              </div>

              {/* IMC Calculado (somente leitura) */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-center">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  IMC (Calculado automaticamente)
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

            {/* Objetivo (Múltipla Escolha + Campo Livre) */}
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
                  placeholder="Outro objetivo ou observação adicional sobre a meta..."
                  value={objetivoTexto}
                  onChange={(e) => setObjetivoTexto(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            {/* Nível de Atividade Física (Seleção Única) */}
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

            {/* Patologias ou Condições de Saúde */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Patologias ou Condições de Saúde
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Opção Nenhum */}
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

                {/* Tags customizadas já adicionadas */}
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

              {/* Campo para adicionar livremente */}
              <div className="flex items-center gap-2 pt-1 max-w-md">
                <input
                  type="text"
                  placeholder="Adicionar outra patologia..."
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
                  placeholder="Adicionar outra restrição alimentar..."
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
                  placeholder="Adicionar outra alergia alimentar..."
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
                  placeholder="Ex: Losartana 50mg pela manhã, etc..."
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Suplementos em Uso
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Whey protein pós-treino, Creatina 5g diárias, Ômega 3..."
                  value={suplementos}
                  onChange={(e) => setSuplementos(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('pessoal')}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar para Pessoal</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('habitos')}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Avançar para Hábitos</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== ABA 3: HÁBITOS ===================== */}
        {activeTab === 'habitos' && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-800 space-y-6 animate-fade-in">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coffee className="w-4 h-4 text-rose-500" />
                Rotina Diária & Hábitos de Vida
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Horários, hidratação, refeições e prática esportiva semanal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Refeições por dia */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Refeições por dia
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Ex: 4"
                  value={refeicoesPorDia}
                  onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>

              {/* Horário que acorda */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Horário que acorda
                </label>
                <input
                  type="text"
                  placeholder="Ex: 6 ou 630"
                  value={horarioAcorda}
                  onChange={(e) => setHorarioAcorda(e.target.value)}
                  onBlur={() => setHorarioAcorda(formatTimeInput(horarioAcorda))}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Digite ex: 6 (06:00) ou 630 (06:30)
                </span>
              </div>

              {/* Horário que dorme */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Horário que dorme
                </label>
                <input
                  type="text"
                  placeholder="Ex: 23 ou 2230"
                  value={horarioDorme}
                  onChange={(e) => setHorarioDorme(e.target.value)}
                  onBlur={() => setHorarioDorme(formatTimeInput(horarioDorme))}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Digite ex: 23 (23:00) ou 2230 (22:30)
                </span>
              </div>

              {/* Quantidade de água por dia */}
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
                    placeholder="Ex: 2.5"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                    className="w-full pl-4 pr-14 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                    litros
                  </span>
                </div>
              </div>
            </div>

            {/* Pratica atividade física (Sim / Não) */}
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

              {/* Se sim, abre campo de texto: qual atividade e frequência semanal */}
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

            {/* Observações Gerais */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Observações Gerais
              </label>
              <textarea
                rows={3}
                placeholder="Histórico alimentar prévio, preferências do paciente, rotina de viagens..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-rose-500 outline-none"
              />
            </div>

            {/* Footer with actions */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar para Clínico</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs tracking-wide shadow-xl shadow-rose-950/50 border border-rose-500/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando no Neon...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Concluir e Salvar Paciente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
