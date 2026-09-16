// Shizukuru i18n v10.8.98 — isolated JA/EN display connection.
// No storage, observers, or event listeners live in this module.
export function createI18n({ dictionaries, defaultLanguage = 'ja', mode = 'connected-ja-en' }) {
  const tables = { ...(dictionaries || {}) };
  const supported = () => Object.keys(tables);
  let language = supported().includes(defaultLanguage) ? defaultLanguage : (supported()[0] || 'ja');

  const tableFor = (lang = language) => tables?.[lang] || tables?.[defaultLanguage] || Object.freeze({});

  const api = {
    mode,
    get language() { return language; },
    availableLanguages() { return supported(); },
    registerLanguage(code, dictionary) {
      if (!code || !dictionary || typeof dictionary !== 'object') return false;
      tables[code] = dictionary;
      return true;
    },
    setLanguage(next) {
      if (!supported().includes(next)) return false;
      language = next;
      return true;
    },
    has(key, lang = language) {
      return Object.prototype.hasOwnProperty.call(tableFor(lang), key);
    },
    t(key, vars = {}, lang = language) {
      const table = tableFor(lang);
      const fallback = tableFor(defaultLanguage);
      let value = Object.prototype.hasOwnProperty.call(table, key) ? table[key]
        : Object.prototype.hasOwnProperty.call(fallback, key) ? fallback[key]
        : key;
      if (typeof value !== 'string') return value;
      return value.replace(/\{([^}]+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
      );
    },
    audit(root = document, lang = language) {
      const nodes = root.querySelectorAll ? root.querySelectorAll('[data-i18n]') : [];
      const used = new Set(Array.from(nodes, node => node.dataset.i18n).filter(Boolean));
      const table = tableFor(lang);
      const missing = Array.from(used).filter(key => !Object.prototype.hasOwnProperty.call(table, key)).sort();
      return Object.freeze({ language: lang, used: used.size, dictionary: Object.keys(table).length, missing: Object.freeze(missing) });
    }
  };
  return Object.freeze(api);
}
