// Referências de elementos
const nomeEvento = document.getElementById('nomeEvento');
const autorEvento = document.getElementById('autorEvento');
const participantesContainer = document.getElementById('participantesContainer');
const loadingEvento = document.getElementById('loadingEvento');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchParticipante');
const userNameEl = document.getElementById('userName');
const btnExcluir = document.getElementById('btnExcluir');

// Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Estado
let currentUser = null;
let currentEvento = null;
let currentEventoId = null;
let allParticipantes = [];

// Inicialização
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;
    await user.reload();

    const nomeUsuario = user.displayName || user.email.split('@')[0];
    userNameEl.textContent = `Olá, ${nomeUsuario}`;

    const params = new URLSearchParams(window.location.search);
    currentEventoId = params.get('id');

    if (!currentEventoId) {
        window.location.href = 'home.html';
        return;
    }

    loadEvento();
});

// Carregar evento
async function loadEvento() {
    try {
        loadingEvento.style.display = 'flex';
        participantesContainer.innerHTML = '';
        emptyState.classList.add('hidden');

        const doc = await db.collection('eventos').doc(currentEventoId).get();

        if (!doc.exists) {
            loadingEvento.style.display = 'none';
            emptyState.classList.remove('hidden');
            emptyState.querySelector('p').textContent = 'Evento não encontrado';
            return;
        }

        currentEvento = { id: doc.id, ...doc.data() };

        nomeEvento.textContent = currentEvento.nome;
        autorEvento.textContent = `Criado por: ${currentEvento.nomeAutor}`;

        if (currentEvento.criadoPor === currentUser.uid) {
            btnExcluir.classList.remove('hidden');
        }

        allParticipantes = currentEvento.participantes || [];

        loadingEvento.style.display = 'none';
        renderParticipantes(allParticipantes);

    } catch (error) {
        console.error(error);
        loadingEvento.style.display = 'none';
    }
}

// Renderizar participantes
function renderParticipantes(participantes) {
    if (participantes.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    participantesContainer.innerHTML = participantes.map((p, index) => `
        <div class="participante-item">
            <div class="participante-info">
                <div class="participante-nome">${p.nome}</div>
                <div class="participante-status">
                    ${p.dataCheckin
                        ? `Check-in: ${new Date(p.dataCheckin).toLocaleString('pt-BR')}`
                        : 'Sem check-in'}
                </div>
            </div>

            <div class="participante-actions">
                ${!p.dataCheckin
                    ? `<button class="btn-validar" onclick="fazerCheckIn(${index})">
                        Fazer Check-in
                      </button>`
                    : `<span class="participante-status">Check-in realizado</span>`
                }

                ${currentEvento.criadoPor === currentUser.uid
                    ? `<button class="btn-remover" onclick="removerParticipante(${index})">
                        <i class="fas fa-times"></i>
                      </button>`
                    : ''
                }
            </div>
        </div>
    `).join('');
}

// 🚨 CHECK-IN LIVRE — QUALQUER USUÁRIO, QUALQUER PARTICIPANTE
async function fazerCheckIn(index) {
    try {
        allParticipantes[index].dataCheckin = new Date().toISOString();

        await db.collection('eventos')
            .doc(currentEventoId)
            .update({ participantes: allParticipantes });

        renderParticipantes(allParticipantes);
    } catch (error) {
        console.error('Erro no check-in:', error);
        alert('Erro ao fazer check-in');
    }
}

// Remover participante (apenas criador)
async function removerParticipante(index) {
    if (currentEvento.criadoPor !== currentUser.uid) return;

    if (!confirm(`Remover ${allParticipantes[index].nome}?`)) return;

    try {
        allParticipantes.splice(index, 1);

        await db.collection('eventos')
            .doc(currentEventoId)
            .update({ participantes: allParticipantes });

        renderParticipantes(allParticipantes);
    } catch (error) {
        console.error(error);
        alert('Erro ao remover participante');
    }
}

// Buscar participantes
searchInput.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase().trim();

    if (!termo) {
        renderParticipantes(allParticipantes);
        return;
    }

    renderParticipantes(
        allParticipantes.filter(p =>
            p.nome.toLowerCase().includes(termo)
        )
    );
});

// Logout
async function logout() {
    await auth.signOut();
    window.location.href = 'index.html';
}

// Excluir evento
async function excluirEvento() {
    if (currentEvento.criadoPor !== currentUser.uid) return;

    if (!confirm(`Excluir o evento "${currentEvento.nome}"?`)) return;

    await db.collection('eventos').doc(currentEventoId).delete();
    window.location.href = 'home.html';
}
