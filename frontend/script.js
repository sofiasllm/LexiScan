const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const uploadForm = document.getElementById('upload-form');
const inputPlaceholder = document.getElementById('input-placeholder');
const analyzeBtn = document.getElementById('analyze-btn');
const dragOverlay = document.getElementById('drag-overlay');
const container = document.querySelector('.drop-zone-container');

// Views
const welcomeView = document.getElementById('welcome-view');
const loadingView = document.getElementById('loading-view');
const resultsView = document.getElementById('results-view');

// Result Elements
const pdfViewer = document.getElementById('pdf-viewer');
const filenameDisplay = document.getElementById('filename-display');
const scoreDisplay = document.getElementById('score-display');
const riskBadge = document.getElementById('risk-badge');
const globalSummary = document.getElementById('global-summary');
const clausesList = document.getElementById('clauses-list');
const errorToast = document.getElementById('error-toast');
const errorMessage = document.getElementById('error-message');

let currentFile = null;

// --- Event Listeners ---

// File Selection
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

// Drag & Drop
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
        uploadForm.classList.add('drag-active');
    }
});

document.addEventListener('dragleave', (e) => {
    // Only remove if leaving the window or the drop zone specifically
    if (e.relatedTarget === null || !uploadForm.contains(e.relatedTarget)) {
        uploadForm.classList.remove('drag-active');
    }
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadForm.classList.remove('drag-active');

    if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

uploadForm.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling to document
    uploadForm.classList.remove('drag-active');
    if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

// Upload and Analyze
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentFile) return;

    await analyzeFile(currentFile);
});

// --- Functions ---

function handleFileSelect(file) {
    if (file.type !== 'application/pdf') {
        showError('Veuillez sélectionner un fichier PDF.');
        return;
    }

    currentFile = file;
    inputPlaceholder.textContent = file.name;
    inputPlaceholder.classList.add('text-white');
    analyzeBtn.disabled = false;
    analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    // Auto-submit for better UX (optional, but requested in prompt as "Chatbot style")
    // Let's trigger it immediately
    analyzeFile(file);
}

function setViewState(state) {
    // states: 'welcome', 'loading', 'results'
    welcomeView.classList.add('hidden');
    loadingView.classList.add('hidden');
    resultsView.classList.add('hidden');

    if (state === 'welcome') welcomeView.classList.remove('hidden');
    if (state === 'loading') loadingView.classList.remove('hidden');
    if (state === 'results') resultsView.classList.remove('hidden');
}

async function analyzeFile(file) {
    setViewState('loading');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:8000/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erreur lors de l\'analyse.');
        }

        const data = await response.json();
        renderResults(data);

    } catch (error) {
        setViewState('welcome'); // Go back or stay in loading? Go back.
        showError(error.message);
        console.error(error);
        currentFile = null;
        inputPlaceholder.textContent = "Télécharger un contrat PDF...";
        inputPlaceholder.classList.remove('text-white');
        analyzeBtn.disabled = true;
        fileInput.value = '';
    }
}

function renderResults(data) {
    setViewState('results');

    // 1. Set PDF
    filenameDisplay.textContent = data.filename;
    if (data.pdf_base64) {
        // Use object url? No, base64 is already here.
        // For embed/iframe, data URI works.
        pdfViewer.src = `data:application/pdf;base64,${data.pdf_base64}`;
    } else {
        // Fallback if no base64 returned (backend issue?) or if text file
        pdfViewer.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">Prévisualisation non disponible</div>';
    }

    // 2. Set Global Score
    // data.risk_score_global (0-100 where 100 is risky)
    const score = Math.round(data.risk_score_global);
    const scoreText = 100 - score; // Let's present "Safety Score" or stick to "Risk"?
    // Prompt said:
    // If fraud: Show with red highlight + risk summary.
    // If safe: "Document seems safe".

    // Let's interpret risk_score_global:
    // High score = High Risk.

    if (score > 40) {
        // RISKY
        scoreDisplay.textContent = "Risque Élevé";
        scoreDisplay.className = "text-2xl font-bold text-red-500";
        riskBadge.textContent = "Attention";
        riskBadge.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-500/20 text-red-400";
        globalSummary.textContent = `Ce document présente un score de risque de ${score}/100. Plusieurs clauses nécessitent votre vigilance immédiate.`;
    } else if (score > 10) {
        // MEDIUM
        scoreDisplay.textContent = "Risque Modéré";
        scoreDisplay.className = "text-2xl font-bold text-orange-500";
        riskBadge.textContent = "Moyen";
        riskBadge.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-orange-500/20 text-orange-400";
        globalSummary.textContent = `Ce document présente quelques points d'attention (Score: ${score}/100). Vérifiez les clauses signalées.`;
    } else {
        // SAFE
        scoreDisplay.textContent = "Document Sûr";
        scoreDisplay.className = "text-2xl font-bold text-green-500";
        riskBadge.textContent = "Sûr";
        riskBadge.className = "px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-500/20 text-green-400";
        globalSummary.textContent = "Aucune clause majeure à risque n'a été détectée. Ce document semble standard.";
    }

    // 3. Render Clauses
    clausesList.innerHTML = '';

    if (!data.clauses || data.clauses.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = "p-4 text-center text-gray-500 italic";
        emptyState.textContent = "Aucune clause particulière détectée.";
        clausesList.appendChild(emptyState);
    } else {
        data.clauses.forEach((clause, index) => {
            const card = document.createElement('div');
            card.className = "bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors risk-card-enter";
            card.style.animationDelay = `${index * 0.1}s`;

            const riskLevel = clause.analysis?.risk_level || "INCONNU";
            let riskColor = "gray";
            if (riskLevel === "ROUGE") riskColor = "red";
            if (riskLevel === "ORANGE") riskColor = "orange";
            if (riskLevel === "VERT") riskColor = "green";

            card.innerHTML = `
                <div class="flex items-start justify-between mb-2">
                    <span class="text-xs font-bold text-${riskColor}-400 border border-${riskColor}-500/30 bg-${riskColor}-500/10 px-2 py-0.5 rounded uppercase">
                        ${riskLevel}
                    </span>
                    <!-- <span class="text-xs text-gray-500">Page ${clause.page_number || '?'}</span> -->
                </div>
                <p class="text-sm text-gray-300 font-medium mb-2 border-l-2 border-${riskColor}-500 pl-3 italic">
                    "${clause.text.substring(0, 100)}${clause.text.length > 100 ? '...' : ''}"
                </p>
                <p class="text-sm text-gray-400 bg-gray-900/50 p-2 rounded">
                    <i class="fa-solid fa-circle-info mr-1 text-${riskColor}-400"></i>
                    ${clause.analysis?.explanation || "Pas d'explication fournie."}
                </p>
            `;
            clausesList.appendChild(card);
        });
    }
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorToast.classList.remove('translate-x-full');
    setTimeout(() => {
        errorToast.classList.add('translate-x-full');
    }, 5000);
}
