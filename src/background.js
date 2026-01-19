async function getMapping() {
  return new Promise(resolve => {
    chrome.storage.local.get("keywords", data => {
      resolve(data.keywords || {});
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("keywords", data => {
    if (!data.keywords) {
      chrome.storage.local.set({ keywords: {} });
    }
  });
});

chrome.omnibox.onInputEntered.addListener(async text => {
  const mapping = await getMapping();
  const key = text.trim();
  const target = mapping[key];
  const url = target || "https://www.google.com/search?q=" + encodeURIComponent(key);
  chrome.tabs.update({ url });
});
