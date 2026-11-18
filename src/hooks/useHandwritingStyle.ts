import { useEffect, useState } from 'react';
import {
  applyHandwritingCssVars,
  HANDWRITING_STORAGE_KEY,
  HANDWRITING_UPDATED_EVENT,
  HandwritingStyleSettings,
  loadHandwritingSettings,
  resetHandwritingSettings,
  saveHandwritingSettings,
} from '../services/handwritingStyle';

export function useHandwritingStyle() {
  const [settings, setSettings] = useState<HandwritingStyleSettings>(() => {
    const loaded = loadHandwritingSettings();
    applyHandwritingCssVars(loaded);
    return loaded;
  });

  useEffect(() => {
    applyHandwritingCssVars(settings);

    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<HandwritingStyleSettings>).detail;
      if (detail) {
        setSettings(detail);
      } else {
        setSettings(loadHandwritingSettings());
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === HANDWRITING_STORAGE_KEY) {
        const next = loadHandwritingSettings();
        applyHandwritingCssVars(next);
        setSettings(next);
      }
    };

    window.addEventListener(HANDWRITING_UPDATED_EVENT, onUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(HANDWRITING_UPDATED_EVENT, onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const updateSettings = (
    updater:
      | Partial<HandwritingStyleSettings>
      | ((prev: HandwritingStyleSettings) => HandwritingStyleSettings)
  ) => {
    const current = loadHandwritingSettings();
    const next =
      typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    const saved = saveHandwritingSettings(next);
    setSettings(saved);
    return saved;
  };

  const resetToOriginal = () => {
    const saved = resetHandwritingSettings(true);
    setSettings(saved);
    return saved;
  };

  const restoreDefaultHandwriting = () => {
    const saved = resetHandwritingSettings(false);
    setSettings(saved);
    return saved;
  };

  return { settings, updateSettings, resetToOriginal, restoreDefaultHandwriting };
}
