// Referências de elementos
const eventsContainer = document.getElementById('eventsContainer');
const loadingEvents = document.getElementById('loadingEvents');
const emptyState = document.getElementById('emptyState');
const userNameEl = document.getElementById('userName');

// Obter Auth e Firestore do Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Estado de autenticação
let currentUser = null;

// Inicializar página
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        // Mostrar o nome que foi cadastrado, ou o email se não tiver nome
        const nomeUsuario = user.displayName || user.email.split('@')[0];
        userNameEl.textContent = `Olá, ${nomeUsuario}`;
        loadEvents();
    } else {
        // Redirecionar para login se não estiver autenticado
        window.location.href = 'index.html';
    }
});

// Carregar eventos do Firestore (com listener em tempo real)
function loadEvents() {
    try {
        loadingEvents.style.display = 'flex';

        // Usar onSnapshot para atualizar em tempo real
        db.collection('eventos').onSnapshot((querySnapshot) => {
            console.log('Atualizando eventos...');
            
            if (querySnapshot.empty) {
                loadingEvents.style.display = 'none';
                eventsContainer.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }

            const events = [];
            querySnapshot.forEach((doc) => {
                events.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('Total de eventos:', events.length);
            loadingEvents.style.display = 'none';
            renderEvents(events);

        }, (error) => {
            console.error('Erro ao carregar eventos:', error);
            loadingEvents.style.display = 'none';
            eventsContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
            emptyState.querySelector('p').textContent = 'Erro ao carregar eventos';
        });

    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        loadingEvents.style.display = 'none';
        eventsContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyState.querySelector('p').textContent = 'Erro ao carregar eventos';
    }
}

// Renderizar eventos
function renderEvents(events) {
    if (events.length === 0) {
        eventsContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    eventsContainer.innerHTML = events.map(event => {
        // Contar total de participantes
        const totalParticipantes = event.participantes ? event.participantes.length : 0;
        
        // Contar check-ins realizados
        const checkinsRealizados = event.participantes 
            ? event.participantes.filter(p => p.dataCheckin && p.dataCheckin !== null && p.dataCheckin !== '').length 
            : 0;

        return `
        <a href="evento.html?id=${event.id}" class="event-card">
            <img 
                src="${event.imagemUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22400%22 height=%22300%22/%3E%3C/svg%3E'}" 
                alt="${event.nome}" 
                class="event-image"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22400%22 height=%22300%22/%3E%3C/svg%3E'"
            >
            <div class="event-info">
                <h3 class="event-title">${event.nome}</h3>
                <div class="event-meta">
                    <span>
                        <i class="fas fa-calendar"></i>
                        ${event.data || 'Data não informada'}
                    </span>
                </div>
                <div class="event-meta">
                    <span>
                        <i class="fas fa-users"></i>
                        ${totalParticipantes} ${totalParticipantes === 1 ? 'pessoa' : 'pessoas'}
                    </span>
                </div>
                <div class="event-meta">
                    <span>
                        <i class="fas fa-check-circle"></i>
                        ${checkinsRealizados} check-in(s)
                    </span>
                </div>
                <button class="event-button" onclick="goToEvent(event, '${event.id}')">
                    Ver Evento
                </button>
            </div>
        </a>
        `;
    }).join('');
}

// Ir para página do evento
function goToEvent(e, eventId) {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `evento.html?id=${eventId}`;
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}