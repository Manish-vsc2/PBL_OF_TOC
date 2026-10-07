import React, { useState, useEffect } from 'react';
import {
  Download,
  Laptop,
  Smartphone,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';

interface InstallAppProps {
  buttonClassName?: string;
  variant?: 'header' | 'banner' | 'floating';
}

export const InstallAppButton: React.FC<InstallAppProps> = ({
  buttonClassName = '',
  variant = 'header',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA window
    const checkIsInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkIsInstalled();

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setShowModal(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowModal(true);
      }
    } else {
      // If browser doesn't support direct trigger or already handled, open instructions modal
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Header Button */}
      <button
        type="button"
        id="install-app-header-btn"
        onClick={handleInstallClick}
        title={isInstalled ? 'App is installed on Desktop' : 'Install TOC Studio as Desktop App'}
        className={
          buttonClassName ||
          `flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
            isInstalled
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 border border-indigo-400/40 shadow-blue-500/20 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
          }`
        }
      >
        {isInstalled ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Installed ✓</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span className="font-semibold">Install App</span>
          </>
        )}
      </button>

      {/* Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Laptop className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight font-heading">
                    Install TOC Studio on Desktop
                  </h3>
                  <p className="text-xs text-blue-100">
                    Standalone Desktop & Mobile Application
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              {/* Feature Badges */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Instant Launch</span>
                  <span className="text-[10px] text-slate-500">Desktop Icon</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">100% Offline</span>
                  <span className="text-[10px] text-slate-500">No Internet Req</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Clean Window</span>
                  <span className="text-[10px] text-slate-500">No Browser Bars</span>
                </div>
              </div>

              {/* Direct 1-Click Install Button if Event Available */}
              {deferredPrompt && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-900 dark:text-blue-200 block text-xs">
                      Ready to install now!
                    </span>
                    <span className="text-[11px] text-blue-700 dark:text-blue-300">
                      Click below to add directly to your Desktop apps.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install Now
                  </button>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>How to install on Windows / Mac (Chrome & Edge):</span>
                </h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <p>
                      Look at the <strong>right side of your browser URL bar</strong> (top of screen).
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <p>
                      Click the <strong>Install icon (⊕ or 💻)</strong> or click <strong>Menu (⋮) → "Save and share" / "Apps" → "Install TOC Studio"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <p>
                      Click <strong>"Install"</strong> in the popup. The app will open in a separate window and create an icon on your <strong>Desktop & Taskbar</strong>!
                    </p>
                  </div>
                </div>
                {/* Windows Desktop Shortcut Tip */}
                <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl space-y-1.5 text-[11px]">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Agar Desktop par icon nahi dikhe:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    1. Chrome ke new tab me <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">chrome://apps</code> type karke Enter karein.
                    <br />
                    2. <strong>TOC Studio</strong> par Right-Click karein → <strong>"Create shortcuts..."</strong> → <strong>Desktop</strong> par tick lagayein → <strong>Create</strong> dabayein!
                  </p>
                </div>
              </div>

              {/* Mobile Device Instructions */}
              <div className="space-y-1 pt-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>On Mobile (Android / iPhone):</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tap browser menu <strong>(⋮ or Share)</strong> → tap <strong>"Add to Home Screen"</strong> / <strong>"Install App"</strong>.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
