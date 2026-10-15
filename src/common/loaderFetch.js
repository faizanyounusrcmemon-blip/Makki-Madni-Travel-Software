// loaderFetch.js

let globalLoadingCallback = null;
let activeRequestsCount = 0;

// browser ka original fetch save karo
const originalFetch = window.fetch;

export const setGlobalLoader = (callback) => {
  globalLoadingCallback = callback;
};

export const loaderFetch = async (...args) => {
  activeRequestsCount++;
  if (activeRequestsCount === 1 && globalLoadingCallback) {
    globalLoadingCallback(true);
  }

  try {
    const res = await originalFetch(...args);
    return res;
  } finally {
    activeRequestsCount--;
    if (activeRequestsCount <= 0) {
      activeRequestsCount = 0;
      if (globalLoadingCallback) {
        globalLoadingCallback(false);
      }
    }
  }
};