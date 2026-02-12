// State
const state = {
    user: null,
    currentFile: null,
    sessionId: "default-" + Date.now(),
    chatHistory: []
};

// DOM Elements
const authOverlay = document.getElementById('auth-overlay');
const appLayout = document.getElementById('app-layout');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const btnShowRegister = document.getElementById('btn-show-register');
const btnShowLogin = document.getElementById('btn-show-login');

const views = {
    dashboard: document.getElementById('view-dashboard'),
    history: document.getElementById('view-history'),
    settings: document.getElementById('view-settings'),
    chat: document.getElementById('view-chat-view')
};

const navBtns = document.querySelectorAll('.nav-btn');
const fileInput = document.getElementById('file-input');
const chatInput = document.getElementById('chat-input');
const chatContainer = document.getElementById('chat-messages');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('lexiscan_token')) {
        showApp();
    }
});

// Auth Logic
btnShowRegister.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

btnShowLogin.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('http://localhost:8000/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
        
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('lexiscan_token', data.token);
            localStorage.setItem('lexiscan_user', JSON.stringify(data.user));
            showApp();
        } else {
            alert("Identifiants incorrects.");
        }
    } catch (err) {
        alert("Erreur serveur");
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstname = document.getElementById('reg-firstname').value;
    const lastname = document.getElementById('reg-lastname').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-password-confirm').value;

    if(!email || !password || !firstname || !lastname) return alert("Tous les champs sont requis.");
    if(password !== confirm) return alert("Les mots de passe ne correspondent pas.");
    if(password.length < 6) return alert("Mot de passe trop court (min 6).");

    try {
        const res = await fetch('http://localhost:8000/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                first_name: firstname,
                last_name: lastname,
                email: email, 
                password: password,
                password_confirm: confirm
            })
        });
        
        if (res.ok) {
            alert("Compte créé ! Connectez-vous.");
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            document.getElementById('email').value = email;
            document.getElementById('password').value = "";
        } else {
            const data = await res.json();
            alert("Erreur: " + (data.detail || "Inconnue"));
        }
    } catch (err) {
        alert("Erreur serveur");
    }
});

function showApp() {
    authOverlay.classList.add('hidden');
    appLayout.classList.remove('opacity-0');
    const user = JSON.parse(localStorage.getItem('lexiscan_user') || '{}');
    if (document.getElementById('settings-email')) {
        document.getElementById('settings-email').textContent = user.email || 'User';
    }
}

// Navigation
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active', 'text-accent', 'bg-white/5'));
        btn.classList.add('active', 'text-accent', 'bg-white/5');

        const target = btn.dataset.target;
        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[target].classList.remove('hidden');
    });
});

// File Upload & Analysis
fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    state.currentFile = file;
    
    document.getElementById('filename-display').textContent = "Analyse en cours...";
    document.getElementById('placeholder-state').classList.add('hidden');
    document.getElementById('doc-type-badge').textContent = file.name.split('.').pop().toUpperCase();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', state.sessionId);

    try {
        const res = await fetch('http://localhost:8000/analyze', { method: 'POST', body: formData });
        const data = await res.json();
        
        renderResults(data, file);
    } catch (err) {
        alert("Erreur analyse: " + err.message);
    }
});

function renderResults(data, file) {
    document.getElementById('filename-display').textContent = file.name;

    const pdfEmbed = document.getElementById('pdf-embed');
    const imgEmbed = document.getElementById('image-embed');
    const txtView = document.getElementById('text-viewer');
    
    [pdfEmbed, imgEmbed, txtView].forEach(el => el.classList.add('hidden'));

    if (data.pdf_base64) {
        if (data.pdf_base64.startsWith('JVBER')) { // PDF Signature
            pdfEmbed.classList.remove('hidden');
            pdfEmbed.src = `data:application/pdf;base64,${data.pdf_base64}#toolbar=0&navpanes=0`;
        } else { // Assume Image
            imgEmbed.classList.remove('hidden');
            imgEmbed.src = `data:image/jpeg;base64,${data.pdf_base64}`;
        }
    } else {
        txtView.classList.remove('hidden');
        txtView.textContent = "Contenu textuel analysé (visualisation brute non dispo).";
    }

    // Score
    let score = 100;
    (data.clauses || []).forEach(c => {
        if (c.niveau_risque === 'Critique') score -= 20;
        else if (c.niveau_risque === 'Moyen') score -= 10;
        else score -= 5;
    });
    score = Math.max(0, score);
    
    document.getElementById('score-display').textContent = `${score}%`;
    document.getElementById('audit-status').textContent = data.message || "Analyse terminée";
    
    const bar = document.getElementById('risk-bar');
    bar.style.width = `${score}%`;
    bar.className = `h-full transition-all duration-1000 ${score > 80 ? 'bg-success' : score > 50 ? 'bg-warning' : 'bg-danger'}`;

    // List
    const list = document.getElementById('clauses-list');
    list.innerHTML = '';
    
    if (!data.clauses || data.clauses.length === 0) {
        list.innerHTML = `<div class="text-zinc-500 text-center text-sm mt-10">Aucun problème détecté.</div>`;
    } else {
        data.clauses.forEach(c => {
            const card = document.createElement('div');
            let borderClass = c.niveau_risque === 'Critique' ? 'border-danger/30 bg-danger/5' : 
                              c.niveau_risque === 'Moyen' ? 'border-warning/30 bg-warning/5' : 'border-zinc-700 bg-surface/50';

            card.className = `p-4 rounded-lg border ${borderClass} mb-3 hover:bg-white/5 transition-all cursor-pointer`;
            card.innerHTML = `
                <div class="flex justify-between mb-2">
                    <span class="text-[10px] uppercase font-bold tracking-wider text-zinc-400">${c.type || 'General'}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-white">${c.niveau_risque}</span>
                </div>
                <p class="text-xs text-zinc-300 italic mb-2 border-l-2 border-zinc-600 pl-2">"${c.citation_exacte}"</p>
                <p class="text-xs text-zinc-400 font-light">${c.explication}</p>
                <div class="mt-2 text-xs text-accent bg-accent/10 p-2 rounded flex gap-2 items-start">
                    <i class="fa-solid fa-lightbulb mt-0.5"></i> <span>${c.conseil}</span>
                </div>
            `;
            list.appendChild(card);
        });
    }
}

// Chat Logic
document.getElementById('send-chat').addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage() });

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addBubble(text, 'user');
    chatInput.value = '';

    try {
        const res = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                session_id: state.sessionId,
                message: text,
                history: state.chatHistory
            })
        });
        const data = await res.json();
        
        addBubble(data.response, 'ai');
        state.chatHistory.push({role: "user", content: text});
        state.chatHistory.push({role: "assistant", content: data.response});
    } catch (err) {
        addBubble("Erreur chat: " + err.message, 'ai');
    }
}

function addBubble(text, type) {
    const div = document.createElement('div');
    div.className = `flex gap-4 ${type === 'user' ? 'flex-row-reverse' : ''}`;
    
    const avatar = type === 'user' 
        ? `<div class="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black text-xs font-bold">U</div>`
        : `<div class="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-white text-xs"><i class="fa-solid fa-cube"></i></div>`;
    
    const bubbleClass = type === 'user' ? 'bg-accent text-black' : 'bg-surface/50 border border-white/5 text-zinc-300';

    div.innerHTML = `
        ${avatar}
        <div class="${bubbleClass} p-4 rounded-xl ${type === 'user'?'rounded-tr-none':'rounded-tl-none'} text-sm leading-relaxed max-w-lg shadow-lg">
            ${text}
        </div>
    `;
    
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
