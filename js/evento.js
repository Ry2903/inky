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

// Inicializar
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await user.reload();
        const nomeUsuario = user.displayName || user.email.split('@')[0];
        userNameEl.textContent = `Olá, ${nomeUsuario}`;
        
        // Pegar ID do evento da URL
        const params = new URLSearchParams(window.location.search);
        currentEventoId = params.get('id');
        
        if (currentEventoId) {
            loadEvento();
        } else {
            window.location.href = 'home.html';
        }
    } else {
        window.location.href = 'index.html';
    }
});

// Carregar evento
async function loadEvento() {
    try {
        loadingEvento.style.display = 'flex';
        participantesContainer.innerHTML = '';
        emptyState.classList.add('hidden');

        const docSnapshot = await db.collection('eventos').doc(currentEventoId).get();

        if (!docSnapshot.exists) {
            loadingEvento.style.display = 'none';
            emptyState.classList.remove('hidden');
            emptyState.querySelector('p').textContent = 'Evento não encontrado';
            return;
        }

        currentEvento = {
            id: docSnapshot.id,
            ...docSnapshot.data()
        };

        // Preencher info do evento
        nomeEvento.textContent = currentEvento.nome;
        autorEvento.textContent = `Criado por: ${currentEvento.nomeAutor}`;

        // Mostrar botão excluir apenas se o usuário é o criador
        if (currentEvento.criadoPor === currentUser.uid) {
            btnExcluir.classList.remove('hidden');
        }

        // Armazenar participantes
        allParticipantes = currentEvento.participantes || [];

        loadingEvento.style.display = 'none';
        renderParticipantes(allParticipantes);

    } catch (error) {
        console.error('Erro ao carregar evento:', error);
        loadingEvento.style.display = 'none';
        emptyState.classList.remove('hidden');
        emptyState.querySelector('p').textContent = 'Erro ao carregar evento';
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
                        ? `Check-in: ${new Date(p.dataCheckin).toLocaleDateString('pt-BR', {hour: '2-digit', minute: '2-digit'})}` 
                        : 'Sem check-in'}
                </div>
            </div>
            <div class="participante-actions">
                ${p.dataCheckin 
                    ? `<button class="btn-validado" onclick="fazerCheckIn(${index})">Desfazer Check-in</button>`
                    : `<button class="btn-validar" onclick="fazerCheckIn(${index})">Fazer Check-in</button>`
                }
                ${currentEvento.criadoPor === currentUser.uid ? `
                    <button class="btn-remover" onclick="removerParticipante(${index})" title="Remover">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Fazer ou desfazer check-in (todos os usuários podem)
async function fazerCheckIn(index) {
    try {
        const participante = allParticipantes[index];

        if (participante.dataCheckin) {
            // Desfazer check-in
            participante.dataCheckin = null;
        } else {
            // Fazer check-in
            participante.dataCheckin = new Date().toISOString();
        }

        // Atualizar no Firestore
        await db.collection('eventos').doc(currentEventoId).update({
            participantes: allParticipantes
        });

        renderParticipantes(allParticipantes);
    } catch (error) {
        console.error('Erro ao atualizar check-in:', error);
        alert('Erro ao atualizar check-in');
    }
}

// Remover participante (só criador)
async function removerParticipante(index) {
    try {
        if (currentEvento.criadoPor !== currentUser.uid) {
            alert('Apenas o criador do evento pode remover participantes');
            return;
        }

        if (confirm(`Tem certeza que deseja remover ${allParticipantes[index].nome}?`)) {
            allParticipantes.splice(index, 1);

            await db.collection('eventos').doc(currentEventoId).update({
                participantes: allParticipantes
            });

            renderParticipantes(allParticipantes);
        }
    } catch (error) {
        console.error('Erro ao remover:', error);
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

    const filtrados = allParticipantes.filter(p => 
        p.nome.toLowerCase().includes(termo)
    );

    renderParticipantes(filtrados);
});

// Logout
async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Excluir evento
async function excluirEvento() {
    try {
        if (currentEvento.criadoPor !== currentUser.uid) {
            alert('Apenas o criador pode excluir este evento');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o evento "${currentEvento.nome}"? Esta ação não pode ser desfeita.`)) {
            await db.collection('eventos').doc(currentEventoId).delete();
            alert('Evento excluído com sucesso');
            window.location.href = 'home.html';
        }
    } catch (error) {
        console.error('Erro ao excluir evento:', error);
        alert('Erro ao excluir evento');
    }
}
