/**
 * Registry of LAN form types. Drives form selector, server routing, and reportHandlers.
 * Add an entry here when adding a new form (Ton/Licht, Extern, etc.).
 *
 * @typedef {Object} LanFormEntry
 * @property {string} id - Stable id (e.g. 'secu', 'tonLicht', 'extern')
 * @property {string} name - Display name for selector page (e.g. 'Secuzettel')
 * @property {string} path - URL path for this form (e.g. '/secu'); static app served under this path
 * @property {string} folderName - Subfolder under scanFolder (e.g. 'SecuWebForms')
 * @property {string} source - Report source (e.g. 'secu', 'tontechniker', 'andere-mitarbeiter')
 * @property {string} scanName - Label in report / DocumentScanner (e.g. 'Securityzettel')
 * @property {string} publicDir - Dir name under server/ for static assets (e.g. 'secu-form-public')
 * @property {string} submitPath - API path for POST submit (e.g. '/api/secu-submit')
 * @property {{ storeKey: string, getPath: string, addPath: string }} [nameCatalog] - Optional; for forms with person name autocomplete
 */

const LAN_FORM_REGISTRY = [
  {
    id: 'secu',
    name: 'Secuzettel',
    path: '/secu',
    folderName: 'SecuWebForms',
    source: 'secu',
    scanName: 'Securityzettel',
    publicDir: 'secu-form-public',
    submitPath: '/api/secu-submit',
    nameCatalog: {
      storeKey: 'secuPersonNames',
      getPath: '/api/secu-names',
      addPath: '/api/secu-add-name',
    },
  },
  // Future: { id: 'tonLicht', name: 'Ton/Licht', path: '/ton-licht', folderName: 'TonLichtWebForms', ... },
  // Future: { id: 'extern', name: 'Externe Mitarbeiter', path: '/extern', folderName: 'ExternWebForms', ... },
];

function getLanFormRegistry() {
  return LAN_FORM_REGISTRY;
}

function getFormById(id) {
  return LAN_FORM_REGISTRY.find((f) => f.id === id) || null;
}

function getFormByPath(pathPrefix) {
  const normalized = pathPrefix.replace(/\/$/, '') || '/';
  return LAN_FORM_REGISTRY.find((f) => f.path === normalized || pathPrefix.startsWith(f.path + '/')) || null;
}

module.exports = {
  LAN_FORM_REGISTRY,
  getLanFormRegistry,
  getFormById,
  getFormByPath,
};
