// Shizukuru v10.11.32 — iOS-safe optional language registry.
// WKWebView file:// can reject dynamic import() for local optional modules on some iOS builds.
// iOS therefore resolves the same 12 packs from static module imports; Android remains lazy-loaded.
import * as esPack from './packs/es.js';
import * as frPack from './packs/fr.js';
import * as dePack from './packs/de.js';
import * as itPack from './packs/it.js';
import * as ptBRPack from './packs/pt-BR.js';
import * as zhTWPack from './packs/zh-TW.js';
import * as thPack from './packs/th.js';
import * as idPack from './packs/id.js';
import * as viPack from './packs/vi.js';
import * as ruPack from './packs/ru.js';
import * as arPack from './packs/ar.js';
import * as hiPack from './packs/hi.js';

const OPTIONAL = Object.freeze({
  'es': esPack,
  'fr': frPack,
  'de': dePack,
  'it': itPack,
  'pt-BR': ptBRPack,
  'zh-TW': zhTWPack,
  'th': thPack,
  'id': idPack,
  'vi': viPack,
  'ru': ruPack,
  'ar': arPack,
  'hi': hiPack
});

export function installLanguageRegistry(i18n) {
  const loaded = new Set(i18n.availableLanguages());
  const activate = async code => {
    if (loaded.has(code)) return true;
    const mod = OPTIONAL[code];
    if (!mod) return false;
    try {
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
