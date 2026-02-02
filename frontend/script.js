const fileInput = document.getElementById('file-input');
const uploadForm = document.getElementById('upload-form');
const inputPlaceholder = document.getElementById('input-placeholder');
const analyzeBtn = document.getElementById('analyze-btn');
const downloadBtn = document.getElementById('download-btn');
const newAnalyzeBtn = document.getElementById('btn-nouvelle-analyse');
const historyList = document.getElementById('history-list');

// Views
const welcomeView = document.getElementById('welcome-view');
const loadingView = document.getElementById('loading-view');
const resultsView = document.getElementById('results-view');

// Elements
const pdfViewer = document.getElementById('pdf-viewer');
const filenameDisplay = document.getElementById('filename-display');
const headerRiskBadge = document.getElementById('header-risk-badge');
const globalSubtitle = document.getElementById('global-subtitle');
const clausesList = document.getElementById('clauses-list');

let currentFile = null;
let currentPdfBase64 = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});

// --- Event Listeners ---

// 1. New Analysis Button (Reset)
if (newAnalyzeBtn) {
    newAnalyzeBtn.addEventListener('click', () => {
        resetApp();
    });
}

// 2. File Input
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
});

// 3. Form Submit
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (currentFile) await analyzeFile(currentFile);
});

// 4. Download
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (currentPdfBase64) {
            downloadPDF(currentPdfBase64, "Rapport_LexiScan.pdf");
        } else {
            alert("Aucun rapport disponible.");
        }
    });
}

// --- Logic Functions ---

function handleFileSelect(file) {
    if (file.type !== 'application/pdf') { alert("PDF uniquement."); return; }
    currentFile = file;
    inputPlaceholder.textContent = file.name;
    inputPlaceholder.classList.add('text-white');
    analyzeBtn.disabled = false;
}

function resetApp() {
    // Reset Data
    currentFile = null;
    currentPdfBase64 = null;

    // Reset UI Inputs
    fileInput.value = '';
    inputPlaceholder.textContent = "Envoyer un PDF pour analyse...";
    inputPlaceholder.classList.remove('text-white');
    analyzeBtn.disabled = true;

    // Clear Viewer
    pdfViewer.src = "";
    clausesList.innerHTML = "";

    // Return to Welcome
    setViewState('welcome');
}

function setViewState(state) {
    welcomeView.classList.add('hidden');
    loadingView.classList.add('hidden');
    resultsView.classList.add('hidden');

    if (state === 'welcome') welcomeView.classList.remove('hidden');
    if (state === 'loading') {
        loadingView.classList.remove('hidden');
        uploadForm.parentElement.classList.add('hidden');
    }
    if (state === 'results') {
        resultsView.classList.remove('hidden');
        uploadForm.parentElement.classList.add('hidden');
    } else {
        uploadForm.parentElement.classList.remove('hidden');
    }
}

async function analyzeFile(file) {
    setViewState('loading');
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('http://localhost:8000/analyze', { method: 'POST', body: formData });

        let data;
        try {
            data = await res.json();
        } catch (err) {
            throw new Error("Réponse serveur invalide (Non-JSON).");
        }

        if (!res.ok) throw new Error(data.detail || "Erreur backend inconnue.");

        // Success
        renderResults(data, file.name);
        addToHistory(file.name); // Save to history

    } catch (e) {
        setViewState('welcome');
        alert("Erreur lors de l'analyse : " + e.message);
        resetInputOnly();
    }
}

function resetInputOnly() {
    currentFile = null;
    inputPlaceholder.textContent = "Envoyer un PDF...";
    inputPlaceholder.classList.remove('text-white');
    analyzeBtn.disabled = true;
    fileInput.value = '';
}

function renderResults(data, originalName) {
    setViewState('results');

    filenameDisplay.textContent = originalName;

    // 1. PDF Display (Modified or Original)
    if (data.pdf_base64) {
        currentPdfBase64 = data.pdf_base64;
        pdfViewer.src = `data:application/pdf;base64,${data.pdf_base64}#toolbar=0&navpanes=0&scrollbar=0`;
    } else {
        pdfViewer.src = ""; // Should not happen with new backend
    }

    // 2. Global Status Badge
    const status = data.status || "Info";
    globalSubtitle.textContent = data.message || "Analyse terminée.";

    headerRiskBadge.className = "px-3 py-1 rounded-full text-xs font-bold border transform scale-100 transition-all";

    if (status === "Critique") {
        headerRiskBadge.textContent = "CRITIQUE";
        headerRiskBadge.className += " border-red-500 text-red-400 bg-red-500/10";
        globalSubtitle.className = "text-sm text-red-400";
    } else if (status === "Avertissement") {
        headerRiskBadge.textContent = "AVERTISSEMENT";
        headerRiskBadge.className += " border-orange-500 text-orange-400 bg-orange-500/10";
        globalSubtitle.className = "text-sm text-orange-400";
    } else {
        headerRiskBadge.textContent = "SAFE";
        headerRiskBadge.className += " border-green-500 text-green-400 bg-green-500/10";
        globalSubtitle.className = "text-sm text-green-400";
    }

    // 3. Clauses List
    clausesList.innerHTML = '';

    if (!data.clauses || data.clauses.length === 0) {
        // Safe State
        clausesList.innerHTML = `
            <div class="text-center p-8 text-slate-500 animate-fade-in">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                    <i class="fa-solid fa-check text-2xl text-green-500"></i>
                </div>
                <p class="text-sm font-medium text-slate-400">Aucun risque significatif détecté.</p>
                <p class="text-xs text-slate-600 mt-1">Le document semble conforme aux standards.</p>
            </div>
        `;
    } else {
        data.clauses.forEach(cl => {
            const card = document.createElement('div');
            let color = "slate";
            if (cl.niveau_risque === "Moyen") color = "orange";
            if (cl.niveau_risque === "Critique") color = "red";

            card.className = `p-4 rounded-xl border border-${color}-900/50 bg-slate-800/30 mb-3 hover:bg-slate-800/50 transition-colors`;
            card.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                     <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-${color}-500/10 text-${color}-400">
                        ${cl.niveau_risque}
                     </span>
                </div>
                <!-- Citation -->
                <p class="text-xs text-slate-300 italic mb-3 border-l-2 border-${color}-500/50 pl-3 leading-relaxed">
                    "${cl.citation_exacte}"
                </p>
                
                <p class="text-xs text-slate-400 mb-3">
                    <strong class="text-slate-300">Analyse :</strong> ${cl.explication}
                </p>
                <div class="text-xs text-blue-400 bg-blue-500/5 p-2 rounded border border-blue-500/10 flex gap-2">
                    <i class="fa-solid fa-wand-magic-sparkles mt-0.5"></i>
                    <span>${cl.conseil}</span>
                </div>
            `;
            clausesList.appendChild(card);
        });
    }
}

function downloadPDF(base64Data, fileName) {
    const linkSource = `data:application/pdf;base64,${base64Data}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
}

// --- History Management ---

function addToHistory(filename) {
    let history = JSON.parse(localStorage.getItem('lexiscan_history') || '[]');
    // Add to top, remove duplicates
    history = history.filter(h => h !== filename);
    history.unshift(filename);
    // Limit to 10
    if (history.length > 10) history.pop();

    localStorage.setItem('lexiscan_history', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    if (!historyList) return;
    const history = JSON.parse(localStorage.getItem('lexiscan_history') || '[]');

    // Keep the header "RÉCENT"
    const header = '<div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Récent</div>';

    if (history.length === 0) {
        historyList.innerHTML = header + '<div class="px-3 py-2 text-xs text-slate-600 italic">Aucun historique</div>';
        return;
    }

    const htmlItems = history.map(name => `
        <div class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group">
            <i class="fa-regular fa-file-pdf group-hover:text-blue-400 transition-colors"></i>
            <span class="truncate">${name}</span>
        </div>
    `).join('');

    historyList.innerHTML = header + htmlItems;
}
