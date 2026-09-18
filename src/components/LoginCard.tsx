import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { authClient, type User } from '../lib/auth';

interface LoginCardProps {
  onSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ onSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações locais
    if (!email.trim()) {
      setErrorMessage('Por favor, digite seu e-mail.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, digite sua senha.');
      return;
    }

    if (password.length < 9) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await authClient.signIn({
        email: email.trim(),
        password,
      });
      onSuccess(user);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Falha ao autenticar. Verifique seus dados e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow accent top right */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-900/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Logo */}
        <div className="text-center mb-8 relative">
          <Logo size="md" className="mb-5" />
          <h1 className="text-xl font-bold text-white tracking-tight">
            Acessar sua Conta
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Entre com suas credenciais de nutricionista
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-sm text-rose-200 leading-relaxed font-medium">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative">
          {/* Email field */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              E-mail
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-rose-500 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-4 py-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Senha
              </label>
              <span className="text-[11px] text-zinc-500">Mínimo 9 caracteres</span>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-rose-500 transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••"
                minLength={9}
                className="w-full pl-10 pr-11 py-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-rose-950/60 hover:shadow-rose-700/30 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
          <p className="text-sm text-zinc-400">
            Não tem conta?{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-rose-400 font-semibold hover:text-rose-300 hover:underline transition-colors cursor-pointer ml-1"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
