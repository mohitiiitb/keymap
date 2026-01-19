document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('keyword');
  const urlInput = document.getElementById('url');
  const saveBtn = document.getElementById('save');
  const tableBody = document.querySelector('#table tbody');
  const importFile = document.getElementById('importFile');
  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');
  const searchInput = document.getElementById('searchInput');
  const deleteAllBtn = document.getElementById('deleteAllBtn');

  let currentKeywords = {};

  /** Load mappings and sort by key ascending */
  function loadMappings() {
    chrome.storage.local.get({ keywords: {} }, ({ keywords }) => {
      currentKeywords = keywords;
      applySearchAndRender();
    });
  }

  /** Save mapping or delete if URL empty */
  function saveMapping() {
    const keyword = keyInput.value.trim();
    const url = urlInput.value.trim();
    if (!keyword) return;

    chrome.storage.local.get({ keywords: {} }, ({ keywords }) => {
      if (url) keywords[keyword] = url;
      else delete keywords[keyword];

      chrome.storage.local.set({ keywords }, () => {
        currentKeywords = keywords;
        applySearchAndRender();
        keyInput.value = '';
        urlInput.value = '';
      });
    });
  }

  /** Render table rows in sorted key order */
  function renderTable(entries) {
    tableBody.innerHTML = '';
    entries.sort((a, b) => a[0].localeCompare(b[0])); // sort ascending by key
    entries.forEach(([keyword, url]) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${keyword}</td><td><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></td>`;
      tableBody.appendChild(row);
    });
  }

  /** Apply search filter */
  function applySearchAndRender() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = Object.entries(currentKeywords)
      .filter(([keyword, url]) => keyword.toLowerCase().includes(query) || url.toLowerCase().includes(query));
    renderTable(filtered);
  }

  /** Import JSON */
  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target.result);
        if (typeof imported !== 'object' || Array.isArray(imported))
          throw new Error('Invalid JSON format');
        chrome.storage.local.set({ keywords: imported }, loadMappings);
        alert('Import successful!');
      } catch (err) {
        alert('Failed to import JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  }

  /** Export JSON */
  function exportJSON() {
    chrome.storage.local.get({ keywords: {} }, ({ keywords }) => {
      const blob = new Blob([JSON.stringify(keywords, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mappings.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /** Delete all mappings */
  function deleteAllMappings() {
    if (!confirm("Are you sure you want to delete all mappings?")) return;
    chrome.storage.local.set({ keywords: {} }, () => {
      currentKeywords = {};
      renderTable([]);
    });
  }

  /** Event listeners */
  saveBtn.addEventListener('click', saveMapping);
  [keyInput, urlInput].forEach(input => input.addEventListener('keydown', e => { if (e.key === 'Enter') saveMapping(); }));
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', importJSON);
  exportBtn.addEventListener('click', exportJSON);
  deleteAllBtn.addEventListener('click', deleteAllMappings);
  searchInput.addEventListener('input', applySearchAndRender);

  // Initialize
  loadMappings();
});
