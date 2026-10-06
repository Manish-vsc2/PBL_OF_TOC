import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-between text-xs shadow-md">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-blue-200 shrink-0" />
        <span>
          <strong>Install TOC App:</strong> Add this analyzer to your home screen / desktop for offline access!
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/20 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
