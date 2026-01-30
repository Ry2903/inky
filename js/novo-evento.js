// Referências de elementos
const novoEventoForm = document.getElementById('novoEventoForm');
const imagemInput = document.getElementById('imagemInput');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const imagemPreview = document.getElementById('imagemPreview');
const nomeEvento = document.getElementById('nomeEvento');
const dataEvento = document.getElementById('dataEvento');
const participantesEvento = document.getElementById('participantesEvento');
const formError = document.getElementById('formError');
const loadingSpinner = document.getElementById('loadingSpinner');
const imageError = document.getElementById('imageError');

// Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Supabase
// Assumindo que você já inicializou o supabase com `supabase = createClient(...)`

// Variável para armazenar a imagem selecionada
let imagemSelecionada = null;

// Verificar autenticação
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'index.html';
    }
});

// Lidar com upload de imagem
imagemInput.addEventListener('change', (e) => {
    const arquivo = e.target.files[0];
    
    if (!arquivo) return;

    // Validar tipo de arquivo
    if (!arquivo.type.startsWith('image/')) {
        showError(imageError, 'Selecione um arquivo de imagem válido');
        imagemInput.value = '';
        return;
    }

    // Validar tamanho (máx 5MB)
    if (arquivo.size > 5 * 1024 * 1024) {
        showError(imageError, 'A imagem deve ter no máximo 5MB');
        imagemInput.value = '';
        return;
    }

    imagemSelecionada = arquivo; // manter o arquivo original para upload

    // Preview da imagem (desktop e mobile)
    const reader = new FileReader();
    reader.onload = (event) => {
        imagemPreview.src = event.target.result;
        imagemPreview.classList.remove('hidden');
        uploadPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(arquivo);
});

// Clicar no label para abrir input
document.querySelector('.upload-area').addEventListener('click', () => {
    imagemInput.click();
});

// Mostrar erro
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

// Mostrar loading
function showLoading(show = true) {
    loadingSpinner.classList.toggle('hidden', !show);
}

// Função de upload de imagem para o Supabase
async function uploadImagemSupabase(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { data, error } = await supabase.storage
            .from('eventos')
            .upload(fileName, file); // enviando File diretamente

        if (error) throw error;

        // Retornar URL pública
        const { publicUrl } = supabase.storage.from('eventos').getPublicUrl(fileName);
        return publicUrl;

    } catch (err) {
        console.error('Erro no upload Supabase:', err);
        showError(imageError, 'Erro ao enviar a imagem');
        return null;
    }
}

// Submeter formulário
novoEventoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validações
    if (!nomeEvento.value.trim()) {
        showError(formError, 'Nome do evento é obrigatório');
        return;
    }

    if (!dataEvento.value) {
        showError(formError, 'Data do evento é obrigatória');
        return;
    }

    // Validar data
    const dataSelected = new Date(dataEvento.value);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataSelected < hoje) {
        showError(formError, 'Selecione uma data no futuro');
        return;
    }

    showLoading(true);

    try {
        let imagemUrl = null;

        // Se tiver imagem, fazer upload no Supabase
        if (imagemSelecionada) {
            imagemUrl = await uploadImagemSupabase(imagemSelecionada);
        }

        // Processar participantes
        const participantesTexto = participantesEvento.value.trim();
        const participantes = participantesTexto 
            ? participantesTexto.split('\n').map(nome => ({
                nome: nome.trim(),
                dataCheckin: null,
                validado: false
              })).filter(p => p.nome.length > 0)
            : [];

        // Criar documento no Firestore
        const novoEvento = {
            nome: nomeEvento.value.trim(),
            data: dataEvento.value,
            imagemUrl: imagemUrl,
            criadoPor: auth.currentUser.uid,
            nomeAutor: auth.currentUser.displayName || auth.currentUser.email,
            criadoEm: new Date(),
            participantes: participantes
        };

        const docRef = await db.collection('eventos').add(novoEvento);

        console.log('Evento criado:', docRef.id);

        // Redirecionar para home
        window.location.href = 'home.html';

    } catch (error) {
        console.error('Erro ao criar evento:', error);
        showError(formError, 'Erro ao criar evento. Tente novamente.');
        showLoading(false);
    }
});

// Set data mínima como hoje
const hoje = new Date().toISOString().split('T')[0];
dataEvento.setAttribute('min', hoje);
