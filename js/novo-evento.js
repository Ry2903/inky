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

// Supabase (certifique-se de ter importado e inicializado)
import { supabase } from './supabaseClient';

// Variável para armazenar a imagem selecionada
let imagemSelecionada = null;

// Verificar autenticação
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'index.html';
    }
});

// Clicar no label para abrir input
document.querySelector('.upload-area').addEventListener('click', () => {
    imagemInput.click();
});

// Mostrar erro
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 5000);
}

// Mostrar loading
function showLoading(show = true) {
    loadingSpinner.classList.toggle('hidden', !show);
}

// Lidar com upload de imagem
imagemInput.addEventListener('change', async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    // Validar tipo
    if (!arquivo.type.startsWith('image/')) {
        showError(imageError, 'Selecione um arquivo de imagem válido');
        imagemInput.value = '';
        return;
    }

    // Validar tamanho máximo 15MB (maior por celulares)
    if (arquivo.size > 15 * 1024 * 1024) {
        showError(imageError, 'A imagem deve ter no máximo 15MB');
        imagemInput.value = '';
        return;
    }

    // Converter HEIC/HEIF para JPEG
    imagemSelecionada = await convertToJPEGIfNeeded(arquivo);

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (event) => {
        imagemPreview.src = event.target.result;
        imagemPreview.classList.remove('hidden');
        uploadPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(imagemSelecionada);
});

// Função que converte HEIC/HEIF para JPEG (ou retorna o arquivo normal)
async function convertToJPEGIfNeeded(file) {
    if (!['image/heic', 'image/heif'].includes(file.type)) return file;

    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                const jpegFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpeg'), { type: 'image/jpeg' });
                resolve(jpegFile);
            }, 'image/jpeg', 0.9);
        };
    });
}

// Redimensionar imagem antes do upload
function resizeImage(file, maxWidth = 1024, maxHeight = 1024) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: file.type })), file.type, 0.8);
        };
    });
}

// Upload seguro no Supabase
async function uploadImagemSupabase(file) {
    const arquivoFinal = await resizeImage(file);
    const fileName = `${Date.now()}_${arquivoFinal.name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '')}`;

    const { data, error } = await supabase.storage.from('eventos').upload(`fotos/${fileName}`, arquivoFinal);
    if (error) throw error;

    const { publicUrl } = supabase.storage.from('eventos').getPublicUrl(data.path);
    return publicUrl;
}

// Submeter formulário
novoEventoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!nomeEvento.value.trim()) {
        showError(formError, 'Nome do evento é obrigatório');
        return;
    }
    if (!dataEvento.value) {
        showError(formError, 'Data do evento é obrigatória');
        return;
    }

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
        if (imagemSelecionada) imagemUrl = await uploadImagemSupabase(imagemSelecionada);

        const participantesTexto = participantesEvento.value.trim();
        const participantes = participantesTexto
            ? participantesTexto.split('\n').map(nome => ({
                nome: nome.trim(),
                dataCheckin: null,
                validado: false
            })).filter(p => p.nome.length > 0)
            : [];

        const novoEvento = {
            nome: nomeEvento.value.trim(),
            data: dataEvento.value,
            imagemUrl,
            criadoPor: auth.currentUser.uid,
            nomeAutor: auth.currentUser.displayName || auth.currentUser.email,
            criadoEm: new Date(),
            participantes
        };

        await db.collection('eventos').add(novoEvento);

        window.location.href = 'home.html';
    } catch (error) {
        console.error('Erro ao criar evento:', error);
        showError(formError, 'Erro ao criar evento. Tente novamente.');
        showLoading(false);
    }
});

// Setar data mínima
const hoje = new Date().toISOString().split('T')[0];
dataEvento.setAttribute('min', hoje);
