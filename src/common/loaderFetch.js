// loaderFetch.js

let globalLoadingCallback = null;

// browser ka original fetch save karo
const originalFetch = window.fetch;

export const setGlobalLoader = (callback) => {
  globalLoadingCallback = callback;
};

export const loaderFetch = async (...args) => {
  if (globalLoadingCallback) globalLoadingCallback(true);

  try {
    // ✅ original fetch call karo
    const res = await originalFetch(...args);
    return res;
  } finally {
    if (globalLoadingCallback) globalLoadingCallback(false);
  }
};
