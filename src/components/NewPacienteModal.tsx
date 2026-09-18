import React, { useState } from 'react';
import { X, UserPlus, Sparkles, Loader2 } from 'lucide-react';
import { createPaciente } from '../lib/db';

interface NewPacienteModalProps {
  nutricionistaId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewPacienteModal: React.FC<NewPacienteModalProps> = ({
  nutricionistaId,
  onClose,
  onSuccess,
}) => {
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('feminino');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [pesoInicial, setPesoInicial] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('moderado');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe o nome do paciente.');
      return;
    }

    if (!nutricionistaId) {
      setError('Identificador do nutricionista não encontrado.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createPaciente({
        nutricionista_id: nutricionistaId,
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        peso_inicial: pesoInicial ? parseFloat(pesoInicial) : null,
        altura: altura ? parseFloat(altura) : null,
        objetivo_texto: objetivoTexto.trim() || null,
        nivel_atividade: nivelAtividade || null,
        medicamentos: medicamentos.trim() || null,
        suplementos: suplementos.trim() || null,
        observacoes: observacoes.trim() || null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente:', err);
      setError('Falha ao cadastrar paciente no banco de dados. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-left">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cadastrar Novo Paciente / Atleta</h2>
              <p className="text-xs text-zinc-400">Armazenamento em tempo real no Neon</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Eduardo Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="atleta@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">WhatsApp</label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Sexo</label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              >
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Peso Inicial (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 72.5"
                value={pesoInicial}
                onChange={(e) => setPesoInicial(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Altura (m)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 1.78"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Nível de Atividade</label>
              <select
                value={nivelAtividade}
                onChange={(e) => setNivelAtividade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              >
                <option value="sedentario">Sedentário</option>
                <option value="leve">Leve (1-2x/semana)</option>
                <option value="moderado">Moderado (3-4x/semana)</option>
                <option value="intenso">Intenso (5+x/semana - Atleta Padel)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Objetivo Principal</label>
              <input
                type="text"
                placeholder="Ex: Performance no Padel, Hipertrofia..."
                value={objetivoTexto}
                onChange={(e) => setObjetivoTexto(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Medicamentos em Uso</label>
              <input
                type="text"
                placeholder="Ex: Anti-hipertensivo, etc..."
                value={medicamentos}
                onChange={(e) => setMedicamentos(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Suplementação</label>
              <input
                type="text"
                placeholder="Ex: Creatina, Whey Protein, Multivitamínico..."
                value={suplementos}
                onChange={(e) => setSuplementos(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Observações Gerais</label>
              <textarea
                rows={2}
                placeholder="Histórico clínico, rotina de treinos de Padel..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-950/40 border border-rose-500/30 flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Cadastrar Paciente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
