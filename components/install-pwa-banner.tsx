'use client';

import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIOSDevice(userAgent: string) {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('pwa-install-dismissed') === '1';
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setDismissed(stored);
    setIsStandalone(standalone);
    setIsIOS(isIOSDevice(window.navigator.userAgent));

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  const shouldShow = useMemo(() => {
    if (isStandalone || dismissed) {
      return false;
    }
    return Boolean(deferredPrompt) || isIOS;
  }, [deferredPrompt, dismissed, isIOS, isStandalone]);

  if (!shouldShow) {
    return null;
  }

  const close = () => {
    window.localStorage.setItem('pwa-install-dismissed', '1');
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    close();
  };

  return (
    <div className="fixed left-4 right-4 bottom-20 md:bottom-6 z-50">
      <div className="mx-auto max-w-md rounded-xl border bg-card/95 backdrop-blur-sm shadow-lg p-4">
        <p className="text-sm font-medium">Install English C1 on your device</p>
        <p className="text-xs text-muted-foreground mt-1">
          {isIOS
            ? 'On iPhone/iPad: Share -> Add to Home Screen.'
            : 'Install for faster launch and full-screen app mode.'}
        </p>
        <div className="mt-3 flex gap-2">
          {deferredPrompt ? (
            <button
              type="button"
              onClick={install}
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Install
            </button>
          ) : null}
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
}
