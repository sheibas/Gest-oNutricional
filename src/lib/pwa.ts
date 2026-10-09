import { useState, useEffect } from 'react';

/**
 * PWA Service Worker Registration and Install Prompt Management
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Global reference for deferred install prompt
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn());
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((fn) => fn());
  });
}

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado com escopo:', reg.scope);

          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (
                  installingWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  console.log('[PWA] Nova versão disponível.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error('[PWA] Falha ao registrar Service Worker:', err);
        });
    });
  }
}

/**
 * Hook para gerenciar instalação discreta do PWA
 */
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState<boolean>(!!globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(isAppInstalled());
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      setCanInstall(!!globalDeferredPrompt);
      setIsInstalled(isAppInstalled());
    };

    promptListeners.add(update);
    update();

    return () => {
      promptListeners.delete(update);
    };
  }, []);

  const promptInstall = async () => {
    if (globalDeferredPrompt) {
      await globalDeferredPrompt.prompt();
      const choice = await globalDeferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        globalDeferredPrompt = null;
        setCanInstall(false);
      }
    } else if (isIOS() && !isInstalled) {
      setShowIOSModal(true);
    }
  };

  return {
    canInstall: canInstall || (isIOS() && !isInstalled),
    isInstalled,
    promptInstall,
    showIOSModal,
    setShowIOSModal,
    isIOSDevice: isIOS(),
  };
}

/**
 * Verifica se está rodando em modo standalone (app instalado)
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Detecta se é dispositivo iOS / Safari
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream
  );
}
