const loadPackagedRules = async () => {
  const url = chrome.runtime.getURL('data/eggData.json');
  const res = await fetch(url);
  const json = await res.json();
  return Array.isArray(json.rules) ? json.rules : [];
};

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const { eggData } = await chrome.storage.sync.get(['eggData']);
  if (reason === 'install' && (!eggData || !eggData.length)) {
    const rules = await loadPackagedRules();
    await chrome.storage.sync.set({ eggData: rules });
  }
});
