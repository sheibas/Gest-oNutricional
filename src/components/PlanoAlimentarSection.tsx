import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Utensils,
  Coffee,
  Clock,
  Sun,
  Moon,
  Save,
  AlertCircle,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Calendar,
  FileText,
  Loader2,
  PenLine,
  CheckCircle2,
  HelpCircle,
  ChefHat,
  ArrowRight,
} from 'lucide-react';
import {
  getPlanosAlimentares,
  createPlanoAlimentar,
  deletePlanoAlimentar,
  type Paciente,
  type PlanoAlimentar,
  type PlanoSemanalConteudo,
  type DiaPlano,
  type RefeicoesDoDia,
} from '../lib/db';
import { formatDateBR } from '../lib/utils';

interface PlanoAlimentarSectionProps {
  paciente: Paciente | null;
  pacienteId: string;
  onPlanoSaved?: () => void;
}

const DIAS_DA_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const REFEICOES_CONFIG = [
  {
    key: 'cafe_da_manha' as keyof RefeicoesDoDia,
    titulo: 'Café da Manhã',
    icone: Coffee,
    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
    descricao: 'Primeira refeição do dia para aporte energético',
  },
  {
    key: 'lanche_manha' as keyof RefeicoesDoDia,
    titulo: 'Lanche da Manhã',
    icone: Sun,
    badgeColor: 'text-orange-400 bg-orange-950/40 border-orange-500/30',
    descricao: 'Intermediário para manutenção do metabolismo',
  },
  {
    key: 'almoco' as keyof RefeicoesDoDia,
    titulo: 'Almoço',
    icone: Utensils,
    badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
    descricao: 'Refeição principal rica em proteínas e micronutrientes',
  },
  {
    key: 'lanche_tarde' as keyof RefeicoesDoDia,
    titulo: 'Lanche da Tarde',
    icone: Clock,
    badgeColor: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
    descricao: 'Energia pré-treino ou lanche intermediário vespertino',
  },
  {
    key: 'jantar' as keyof RefeicoesDoDia,
    titulo: 'Jantar',
    icone: Moon,
    badgeColor: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30',
    descricao: 'Refeição noturna nutritiva e de fácil digestão',
  },
];

const MENSAGENS_LOADING = [
  'Buscando dados e prontuário do paciente...',
  'IA analisando metas, restrições e preferências...',
  'Calculando combinações nutricionais balanceadas...',
  'Estruturando cardápio completo da semana...',
  'Refinando opções da culinária brasileira...',
  'Finalizando plano alimentar personalizado...',
];

/**
 * Cria uma estrutura vazia de plano alimentar semanal com 7 dias e 5 opções por refeição
 */
function criarPlanoSemanalVazio(titulo = 'Novo Plano Alimentar'): PlanoSemanalConteudo {
  return {
    titulo,
    plano_semanal: DIAS_DA_SEMANA.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ['', '', '', '', ''],
        lanche_manha: ['', '', '', '', ''],
        almoco: ['', '', '', '', ''],
        lanche_tarde: ['', '', '', '', ''],
        jantar: ['', '', '', '', ''],
      },
    })),
  };
}

/**
 * Normaliza os dados do plano alimentar garantindo todos os 7 dias e 5 refeições com 5 opções
 */
function normalizarPlanoSemanal(dados: any): PlanoSemanalConteudo {
  if (!dados) return criarPlanoSemanalVazio();

  let planoArray: any[] = [];
  if (Array.isArray(dados.plano_semanal)) {
    planoArray = dados.plano_semanal;
  } else if (Array.isArray(dados)) {
    planoArray = dados;
  }

  const planoSemanalNormalizado: DiaPlano[] = DIAS_DA_SEMANA.map((nomeDia) => {
    const diaEncontrado = planoArray.find(
      (d) =>
        d &&
        typeof d.dia === 'string' &&
        d.dia.toLowerCase().trim() === nomeDia.toLowerCase().trim()
    );

    const normalizarRefeicao = (lista: any): string[] => {
      const arr = Array.isArray(lista) ? lista.map(String) : [];
      const res: string[] = [];
      for (let i = 0; i < 5; i++) {
        res.push(arr[i] || '');
      }
      return res;
    };

    return {
      dia: nomeDia,
      refeicoes: {
        cafe_da_manha: normalizarRefeicao(diaEncontrado?.refeicoes?.cafe_da_manha),
        lanche_manha: normalizarRefeicao(diaEncontrado?.refeicoes?.lanche_manha),
        almoco: normalizarRefeicao(diaEncontrado?.refeicoes?.almoco),
        lanche_tarde: normalizarRefeicao(diaEncontrado?.refeicoes?.lanche_tarde),
        jantar: normalizarRefeicao(diaEncontrado?.refeicoes?.jantar),
      },
    };
  });

  return {
    titulo: dados.titulo || 'Plano Semanal Personalizado',
    observacoes_gerais: dados.observacoes_gerais || '',
    plano_semanal: planoSemanalNormalizado,
  };
}

export const PlanoAlimentarSection: React.FC<PlanoAlimentarSectionProps> = ({
  paciente,
  pacienteId,
  onPlanoSaved,
}) => {
  // Lista de históricos do banco
  const [historicoPlanos, setHistoricoPlanos] = useState<PlanoAlimentar[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);

  // Estado do plano atualmente em edição/exibição
  const [planoAtivo, setPlanoAtivo] = useState<PlanoSemanalConteudo | null>(null);
  const [diaAtivoIndex, setDiaAtivoIndex] = useState<number>(0);

  // Estados de IA & Loading
  const [isGeneratingIA, setIsGeneratingIA] = useState<boolean>(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState<number>(0);
  const [savingPlano, setSavingPlano] = useState<boolean>(false);

  // Toast / Notificações
  const [toast, setToast] = useState<{
    tipo: 'sucesso' | 'erro' | 'aviso';
    mensagem: string;
    acao?: { texto: string; onClick: () => void };
  } | null>(null);

  // Modal de confirmação para deletar
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Ref para auto-scroll até a área de edição
  const editorRef = useRef<HTMLDivElement>(null);

  // Carregar histórico de planos salvos no Neon
  const carregarHistorico = useCallback(async () => {
    if (!pacienteId) return;
    setLoadingHistorico(true);
    try {
      const planos = await getPlanosAlimentares(pacienteId);
      setHistoricoPlanos(planos);
    } catch (err) {
      console.error('Erro ao carregar histórico de planos:', err);
    } finally {
      setLoadingHistorico(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  // Rotatividade das mensagens dinâmicas de loading da IA
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isGeneratingIA) {
      setLoadingMessageIndex(0);
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % MENSAGENS_LOADING.length);
      }, 2600);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGeneratingIA]);

  // Limpa toast após tempo determinado
  useEffect(() => {
    if (toast && !toast.acao) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  /**
   * Dispara a geração de plano com IA consumindo a serverless function /api/gerar-plano
   */
  const handleGerarComIA = async () => {
    if (isGeneratingIA) return;

    setIsGeneratingIA(true);
    setToast(null);

    try {
      // Monta os dados completos do paciente para o backend
      const payload = {
        paciente: {
          nome: paciente?.nome,
          data_nascimento: paciente?.data_nascimento,
          sexo: paciente?.sexo,
          peso: paciente?.peso_inicial,
          altura: paciente?.altura,
          objetivos: paciente?.objetivos,
          objetivo_texto: paciente?.objetivo_texto,
          nivel_atividade: paciente?.nivel_atividade,
          patologias: paciente?.patologias,
          restricoes_alimentares: paciente?.restricoes_alimentares,
          alergias: paciente?.alergias,
          medicamentos: paciente?.medicamentos,
          suplementos: paciente?.suplementos,
          refeicoes_por_dia: paciente?.refeicoes_por_dia,
          horario_acorda: paciente?.horario_acorda,
          horario_dorme: paciente?.horario_dorme,
          litros_agua: paciente?.litros_agua,
          atividade_fisica: paciente?.atividade_fisica,
          atividade_fisica_descricao: paciente?.atividade_fisica_descricao,
          observacoes: paciente?.observacoes,
        },
      };

      // Chamada HTTP para a serverless function segura no backend
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Validação com try/catch ao tratar JSON da resposta
      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error('Falha ao decodificar a resposta do servidor.');
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.detalhes || 'Erro na resposta da API');
      }

      // Normaliza o retorno da IA e alimenta o estado do React
      const planoNormalizado = normalizarPlanoSemanal(data);
      planoNormalizado.titulo = `Plano com IA (${new Date().toLocaleDateString('pt-BR')})`;

      setPlanoAtivo(planoNormalizado);
      setDiaAtivoIndex(0);

      setToast({
        tipo: 'sucesso',
        mensagem:
          '✨ Plano semanal gerado com sucesso pela IA! Você pode revisar e ajustar cada opção abaixo antes de salvar.',
      });

      // Scroll suave até o editor
      setTimeout(() => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error('Erro ao gerar plano alimentar com IA:', error);
      // Toast amigável e resiliente conforme regras do Prompt 6
      setToast({
        tipo: 'erro',
        mensagem:
          'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
        acao: {
          texto: 'Criar Plano Manual',
          onClick: () => handleCriarPlanoManual(),
        },
      });
    } finally {
      setIsGeneratingIA(false);
    }
  };

  /**
   * Inicializa um plano semanal manual vazio para edição direta
   */
  const handleCriarPlanoManual = () => {
    const planoVazio = criarPlanoSemanalVazio(
      `Plano Manual (${new Date().toLocaleDateString('pt-BR')})`
    );
    setPlanoAtivo(planoVazio);
    setDiaAtivoIndex(0);
    setToast({
      tipo: 'sucesso',
      mensagem:
        '📝 Modelo de plano alimentar aberto. Preencha as 5 opções de cada refeição conforme desejar.',
    });
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  /**
   * Atualiza uma opção específica de refeição no plano ativo
   */
  const handleUpdateOpcao = (
    refeicaoKey: keyof RefeicoesDoDia,
    opcaoIndex: number,
    novoValor: string
  ) => {
    if (!planoAtivo) return;

    setPlanoAtivo((prev) => {
      if (!prev) return prev;
      const novoPlano = { ...prev };
      const dias = [...novoPlano.plano_semanal];
      const diaAtual = { ...dias[diaAtivoIndex] };
      const refeicoes = { ...diaAtual.refeicoes };
      const opcoes = [...refeicoes[refeicaoKey]];

      opcoes[opcaoIndex] = novoValor;
      refeicoes[refeicaoKey] = opcoes;
      diaAtual.refeicoes = refeicoes;
      dias[diaAtivoIndex] = diaAtual;

      novoPlano.plano_semanal = dias;
      return novoPlano;
    });
  };

  /**
   * Salva o plano alimentar gerado/editado no Neon DB
   */
  const handleSalvarPlano = async () => {
    if (!planoAtivo) return;

    setSavingPlano(true);
    setToast(null);

    try {
      const salvo = await createPlanoAlimentar(pacienteId, planoAtivo);
      if (!salvo) throw new Error('Falha ao persistir no banco de dados.');

      // Atualiza imediatamente o histórico
      await carregarHistorico();

      setToast({
        tipo: 'sucesso',
        mensagem:
          '✅ Plano alimentar salvo com sucesso no histórico do paciente!',
      });

      if (onPlanoSaved) onPlanoSaved();
    } catch (err: any) {
      console.error('Erro ao salvar plano:', err);
      setToast({
        tipo: 'erro',
        mensagem: 'Erro ao salvar o plano no banco de dados. Tente novamente.',
      });
    } finally {
      setSavingPlano(false);
    }
  };

  /**
   * Carrega um plano histórico já salvo para a tela de visualização/edição
   */
  const handleCarregarHistoricoParaEdicao = (planoHist: PlanoAlimentar) => {
    let conteudo = planoHist.conteudo;
    if (typeof conteudo === 'string') {
      try {
        conteudo = JSON.parse(conteudo);
      } catch {
        conteudo = {};
      }
    }
    const normalizado = normalizarPlanoSemanal(conteudo);
    if (!normalizado.titulo) {
      normalizado.titulo = `Plano arquivado em ${formatDateBR(planoHist.created_at?.split('T')[0])}`;
    }
    setPlanoAtivo(normalizado);
    setDiaAtivoIndex(0);

    setToast({
      tipo: 'sucesso',
      mensagem: `Carregado plano de ${formatDateBR(planoHist.created_at?.split('T')[0])} para visualização/edição.`,
    });

    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  /**
   * Exclui um plano do histórico
   */
  const handleConfirmarExclusao = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const ok = await deletePlanoAlimentar(deletingId);
      if (ok) {
        setHistoricoPlanos((prev) => prev.filter((p) => p.id !== deletingId));
        setToast({
          tipo: 'sucesso',
          mensagem: 'Plano alimentar removido do histórico com sucesso.',
        });
      } else {
        throw new Error('Falha ao deletar.');
      }
    } catch (err) {
      console.error('Erro ao excluir plano:', err);
      setToast({
        tipo: 'erro',
        mensagem: 'Não foi possível excluir o plano selecionado.',
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const diaAtual = planoAtivo?.plano_semanal[diaAtivoIndex];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ========================================================================= */}
      {/* BANNER PRINCIPAL COM OS BOTÕES DE AÇÃO                                    */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inteligência Artificial Integrada</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Gerador Inteligente de Planos Alimentares
            </h3>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Elabore um cardápio semanal completo estruturado em 7 dias com 5 opções
              estratégicas para cada uma das refeições. O sistema analisa automaticamente
              os objetivos, restrições, rotina e preferências de{' '}
              <strong className="text-zinc-200">{paciente?.nome || 'este paciente'}</strong>.
            </p>

            {/* Badges do perfil do paciente */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs text-zinc-300">
              {paciente?.objetivos && paciente.objetivos.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center gap-1.5 text-[11px]">
                  🎯 Meta: {paciente.objetivos.slice(0, 2).join(', ')}
                </span>
              )}
              {paciente?.alergias && paciente.alergias.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 flex items-center gap-1.5 text-[11px]">
                  ⚠️ Alergias: {paciente.alergias.join(', ')}
                </span>
              )}
              {paciente?.restricoes_alimentares &&
                paciente.restricoes_alimentares.length > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-300 flex items-center gap-1.5 text-[11px]">
                    🚫 Restrições: {paciente.restricoes_alimentares.join(', ')}
                  </span>
                )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Botão Secundário: Criar Plano Manual */}
            <button
              type="button"
              onClick={handleCriarPlanoManual}
              disabled={isGeneratingIA}
              className="px-4 py-3 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-bold text-xs tracking-wide border border-zinc-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:border-zinc-500"
            >
              <PenLine className="w-4 h-4 text-zinc-400" />
              <span>Criar Manualmente</span>
            </button>

            {/* Botão em Destaque: ✨ Gerar Plano com IA */}
            <button
              type="button"
              onClick={handleGerarComIA}
              disabled={isGeneratingIA}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-rose-950/60 border border-rose-500/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
            >
              {isGeneratingIA ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Calculando Cardápio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-rose-200 group-hover:rotate-12 transition-transform" />
                  <span>✨ Gerar Plano com IA</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FEEDBACK TOAST / NOTIFICAÇÃO                                              */}
      {/* ========================================================================= */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in ${
            toast.tipo === 'sucesso'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : toast.tipo === 'erro'
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-200 shadow-xl'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{toast.mensagem}</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {toast.acao && (
              <button
                type="button"
                onClick={toast.acao.onClick}
                className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              >
                <span>{toast.acao.texto}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-black/20 text-current transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOADING VISUAL COM MENSAGENS DINÂMICAS                                    */}
      {/* ========================================================================= */}
      {isGeneratingIA && (
        <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/90 border border-rose-500/30 text-center space-y-6 shadow-2xl animate-pulse relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-950/80">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h4 className="text-lg font-bold text-white tracking-tight">
              Inteligência Artificial em Execução
            </h4>
            <p className="text-xs sm:text-sm text-rose-300 font-medium transition-all duration-300">
              {MENSAGENS_LOADING[loadingMessageIndex]}
            </p>
          </div>

          {/* Barra de progresso visual */}
          <div className="w-full max-w-sm mx-auto h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-700"
              style={{
                width: `${((loadingMessageIndex + 1) / MENSAGENS_LOADING.length) * 100}%`,
              }}
            />
          </div>

          <p className="text-[11px] text-zinc-500">
            Isso pode levar alguns segundos enquanto o Gemini estrutura 175 opções de refeições saudáveis.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERFACE DE EDIÇÃO EM ABAS (TABS POR DIA DA SEMANA)                      */}
      {/* ========================================================================= */}
      {planoAtivo && (
        <div
          ref={editorRef}
          className="rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden animate-fade-in"
        >
          {/* Header do Editor com Título e Botão "Salvar Plano Alimentar" */}
          <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-rose-500" />
                <h4 className="text-base sm:text-lg font-extrabold text-white">
                  {planoAtivo.titulo || 'Plano Alimentar Semanal'}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Modo de Edição Ativo
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Altere qualquer um dos 5 inputs de texto de cada refeição antes de salvar no histórico.
              </p>
            </div>

            {/* Ações do Header: Salvar e Fechar */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPlanoAtivo(null)}
                className="px-3.5 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Fechar</span>
              </button>

              {/* Botão "Salvar Plano Alimentar" só visível se houver plano na tela */}
              <button
                type="button"
                onClick={handleSalvarPlano}
                disabled={savingPlano}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-950/50 border border-emerald-500/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {savingPlano ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Plano Alimentar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Abas (Tabs) dos Dias da Semana */}
          <div className="px-4 sm:px-6 pt-4 border-b border-zinc-800 bg-zinc-900/30 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max pb-3">
              {planoAtivo.plano_semanal.map((diaItem, idx) => {
                const isActive = diaAtivoIndex === idx;
                return (
                  <button
                    key={diaItem.dia}
                    type="button"
                    onClick={() => setDiaAtivoIndex(idx)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 border border-rose-500/40'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{diaItem.dia}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-black/20 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      5 ref.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo do Dia Ativo: As 5 Refeições com seus 5 inputs cada */}
          {diaAtual && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">
                    Cardápio para {diaAtual.dia}
                  </span>
                  <span className="text-xs text-zinc-500">
                    (5 opções variadas por refeição)
                  </span>
                </div>

                <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Todos os campos são editáveis diretamente</span>
                </div>
              </div>

              {/* Grid das 5 Refeições */}
              <div className="space-y-6">
                {REFEICOES_CONFIG.map((refeicao) => {
                  const Icon = refeicao.icone;
                  const opcoes = diaAtual.refeicoes[refeicao.key] || ['', '', '', '', ''];

                  return (
                    <div
                      key={refeicao.key}
                      className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors space-y-4"
                    >
                      {/* Header da Refeição */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold ${refeicao.badgeColor}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-white">
                              {refeicao.titulo}
                            </h5>
                            <p className="text-[11px] text-zinc-400">
                              {refeicao.descricao}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] text-zinc-500 self-start sm:self-auto font-mono">
                          5 alternativas
                        </span>
                      </div>

                      {/* Os 5 inputs de texto preenchidos pela IA ou em branco */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                        {opcoes.map((opcaoTexto, opIdx) => (
                          <div key={opIdx} className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              Opção {opIdx + 1}
                            </label>
                            <textarea
                              rows={3}
                              value={opcaoTexto}
                              onChange={(e) =>
                                handleUpdateOpcao(refeicao.key, opIdx, e.target.value)
                              }
                              placeholder={`Ex: Opção ${opIdx + 1}...`}
                              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-rose-500 text-zinc-200 text-xs leading-relaxed outline-none transition-all resize-none font-normal"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão de Rodapé para salvar */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  Dica: Você pode trocar de dia da semana nas abas superiores para revisar todo o plano.
                </span>

                <button
                  type="button"
                  onClick={handleSalvarPlano}
                  disabled={savingPlano}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-950/50 border border-emerald-500/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {savingPlano ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando no Banco...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Plano Alimentar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* HISTÓRICO DE PLANOS ALIMENTARES GERADOS (Neon PostgreSQL)                 */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-400" />
              Histórico de Planos Arquivados ({historicoPlanos.length})
            </h4>
            <p className="text-xs text-zinc-400">
              Registros mantidos em ordem cronológica decrescente. Cada geração é preservada.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarHistorico}
            disabled={loadingHistorico}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            title="Atualizar histórico"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingHistorico ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        {loadingHistorico ? (
          <div className="py-12 text-center text-zinc-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-500" />
            <p className="text-xs">Consultando planos no Neon...</p>
          </div>
        ) : historicoPlanos.length === 0 ? (
          <div className="py-16 glass-panel rounded-3xl border border-zinc-800 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500 shadow-inner">
              <Utensils className="w-7 h-7 text-zinc-600" />
            </div>
            <h4 className="text-base font-bold text-zinc-200">
              Nenhum plano alimentar gerado ainda
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Utilize o botão acima "✨ Gerar Plano com IA" para formular o primeiro plano
              semanal deste paciente com base nas metas e hábitos cadastrados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {historicoPlanos.map((plano) => {
              const dataFormatada = formatDateBR(plano.created_at?.split('T')[0]);
              let titulo = 'Plano Alimentar';
              try {
                const c =
                  typeof plano.conteudo === 'string'
                    ? JSON.parse(plano.conteudo)
                    : plano.conteudo;
                if (c?.titulo) titulo = c.titulo;
              } catch {}

              return (
                <div
                  key={plano.id}
                  className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 transition-all flex flex-col justify-between gap-4 group shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                        {titulo}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30 font-semibold">
                        Salvo no Banco
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Gerado em {dataFormatada}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCarregarHistoricoParaEdicao(plano)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar / Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingId(plano.id)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Excluir este plano"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO                                          */}
      {/* ========================================================================= */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Excluir Plano Alimentar?</h4>
              <p className="text-xs text-zinc-400">
                Esta ação removerá este plano do histórico do paciente no banco de dados.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmarExclusao}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
