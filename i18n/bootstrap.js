// Shizukuru i18n v10.8.98 — JA/EN display connection.
// The existing LanguageManager still owns the temporary test switch and persistence.
// This module only supplies translation data for the manager's current language.
import { createI18n } from './core.js';
import { ja } from './ja.js';
import { en } from './en.js';
import { zhCN } from './zh-CN.js';
import { officialNamesZhCN } from './official-names-zh-CN.js';
import { ko } from './ko.js';
import { officialNamesKo } from './official-names-ko.js';
import { generatedNamesZhCN } from './generated-names-zh-CN.js';
import { generatedNamesKo } from './generated-names-ko.js';
import { giftCopyZhCN } from './gift-copy-zh-CN.js';
import { giftCopyKo } from './gift-copy-ko.js';
import { installLanguageRegistry } from './language-registry.js';

const dictionaries = Object.freeze({ ja, en, 'zh-CN': zhCN, ko });
const initialLanguage = window.LanguageManager?.currentLanguage?.() || 'ja';
const i18n = createI18n({ dictionaries, defaultLanguage: initialLanguage, mode: 'connected-ja-en-zh-cn-ko' });

Object.defineProperty(window, 'ShizukuruI18nNext', { value: i18n, configurable: false, writable: false });
Object.defineProperty(window, 'ShizukuruOfficialNamesZhCN', { value: officialNamesZhCN, configurable: false, writable: false });
Object.defineProperty(window, 'ShizukuruOfficialNamesKo', { value: officialNamesKo, configurable: false, writable: false });
Object.defineProperty(window, 'ShizukuruCoreGeneratedNames', { value: Object.freeze({'zh-CN': generatedNamesZhCN, ko: generatedNamesKo}), configurable: false, writable: false });
Object.defineProperty(window, 'ShizukuruCoreGiftCopy', { value: Object.freeze({'zh-CN': giftCopyZhCN, ko: giftCopyKo}), configurable: false, writable: false });
const languageRegistry = installLanguageRegistry(i18n);


const syncFromHost = () => {
  const current = window.LanguageManager?.currentLanguage?.() || 'ja';
  i18n.setLanguage(current);
};

syncFromHost();

const savedLanguage = window.LanguageManager?.currentLanguage?.() || 'ja';
if (languageRegistry.isOptional(savedLanguage)) {
  languageRegistry.activate(savedLanguage).then(ready => {
    if (ready) {
      i18n.setLanguage(savedLanguage);
      window.LanguageManager?.setLanguage?.(savedLanguage, { persist: false });
    }
  });
}


const report = i18n.audit(document);
const dictionaryAudit = Object.freeze({
  japaneseKeys: Object.keys(ja).length,
  englishKeys: Object.keys(en).length,
  simplifiedChineseKeys: Object.keys(zhCN).length,
  koreanKeys: Object.keys(ko).length,
  missingInEnglish: Object.freeze(Object.keys(ja).filter(key => !Object.prototype.hasOwnProperty.call(en, key))),
  extraInEnglish: Object.freeze(Object.keys(en).filter(key => !Object.prototype.hasOwnProperty.call(ja, key))),
  missingInSimplifiedChinese: Object.freeze(Object.keys(ja).filter(key => !Object.prototype.hasOwnProperty.call(zhCN, key))),
  extraInSimplifiedChinese: Object.freeze(Object.keys(zhCN).filter(key => !Object.prototype.hasOwnProperty.call(ja, key))),
  missingInKorean: Object.freeze(Object.keys(ja).filter(key => !Object.prototype.hasOwnProperty.call(ko, key))),
  extraInKorean: Object.freeze(Object.keys(ko).filter(key => !Object.prototype.hasOwnProperty.call(ja, key)))
});
Object.defineProperty(window, 'ShizukuruI18nNextAudit', {
  value: Object.freeze({ ...report, dictionaries: dictionaryAudit }),
  configurable: false,
  writable: false
});
