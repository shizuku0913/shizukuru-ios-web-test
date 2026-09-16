// Shizukuru v10.10.0 — optional language registry.
// Optional packs are imported only when selected, so adding languages does not increase startup parsing cost.
const OPTIONAL = Object.freeze({
  es: () => import('./packs/es.js'),
  fr: () => import('./packs/fr.js'),
  de: () => import('./packs/de.js'),
  it: () => import('./packs/it.js'),
  'pt-BR': () => import('./packs/pt-BR.js'),
  'zh-TW': () => import('./packs/zh-TW.js'),
  th: () => import('./packs/th.js'),
  id: () => import('./packs/id.js'),
  vi: () => import('./packs/vi.js'),
  ru: () => import('./packs/ru.js'),
  ar: () => import('./packs/ar.js'),
  hi: () => import('./packs/hi.js')
});

export function installLanguageRegistry(i18n) {
  const loaded = new Set(i18n.availableLanguages());
  const activate = async code => {
    if (loaded.has(code)) return true;
    const loader = OPTIONAL[code];
    if (!loader) return false;
    try {
      const mod = await loader();
      if (!mod.dictionary || !mod.officialNames) return false;
      if (!i18n.registerLanguage(code, mod.dictionary)) return false;
      window.ShizukuruOptionalOfficialNames ||= Object.create(null);
      window.ShizukuruOptionalOfficialNames[code] = mod.officialNames;
      if (mod.generatedNames) {
        window.ShizukuruOptionalGeneratedNames ||= Object.create(null);
        window.ShizukuruOptionalGeneratedNames[code] = mod.generatedNames;
      }
      if (mod.giftCopy) {
        window.ShizukuruOptionalGiftCopy ||= Object.create(null);
        window.ShizukuruOptionalGiftCopy[code] = mod.giftCopy;
      }
      loaded.add(code);
      return true;
    } catch (_error) {
      return false;
    }
  };
  const api = Object.freeze({
    codes: Object.freeze(Object.keys(OPTIONAL)),
    isOptional(code) { return Object.prototype.hasOwnProperty.call(OPTIONAL, code); },
    isLoaded(code) { return loaded.has(code); },
    activate
  });
  Object.defineProperty(window, 'ShizukuruLanguageRegistry', { value: api, configurable: false, writable: false });
  return api;
}
