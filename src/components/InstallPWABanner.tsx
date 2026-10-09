import React, { useState } from 'react';
import { Download, X, Smartphone, Sparkles, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../lib/pwa';

export const InstallPWABanner: React.FC = () => {
  const { canInstall, isInstalled, promptInstall, showIOSModal, setShowIOSModal, isIOSDevice } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('nutripadel_pwa_dismissed') === 'true';
  });

  // Se já estiver instalado ou não estiver disponível para instalar ou dispensado
  if (isInstalled || !canInstall || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('nutripadel_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Floating Bottom Banner */}
      <aside
        aria-label="Instalar Aplicativo NutriPadel"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-short"
      >
        <div className="p-4 rounded-3xl bg-zinc-900/95 border border-rose-500/40 shadow-2xl backdrop-blur-xl text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/80">
              <Smartphone className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white truncate">Instalar NutriPadel</h4>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-950 text-rose-300 border border-rose-500/30 font-bold">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                Acesse mais rápido direto da sua tela inicial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={promptInstall}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal de Instruções para iPhone / iOS Safari */}
      {showIOSModal && isIOSDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-white">Instalar no iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300">
              <p className="leading-relaxed">
                Para instalar o <strong>NutriPadel</strong> no seu dispositivo Apple:
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-rose-400 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">1. Toque no botão Compartilhar</span>
                    <span className="text-[11px] text-zinc-400">Na barra inferior do Safari</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">2. Selecione "Adicionar à Tela de Início"</span>
                    <span className="text-[11px] text-zinc-400">Role para baixo nas opções</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
