// Configuração do Supabase
const SUPABASE_URL = 'https://jntljdsyapjvaorstitw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudGxqZHN5YXBqdmFvcnN0aXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDg3MDAsImV4cCI6MjA4MTY4NDcwMH0.1DXIkYT8evx6oO7sRHJH_Oc9TUHOPMo53SqMxawHc-Y';

// Função para fazer upload de imagem
async function uploadImagemSupabase(file) {
    try {
        // Gerar nome único para a imagem
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const nomeArquivo = `${timestamp}-${randomId}-${file.name}`;

        // Fazer upload
        const response = await fetch(
            `${SUPABASE_URL}/storage/v1/object/eventos/${nomeArquivo}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': file.type
                },
                body: file
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Resposta do servidor:', errorData);
            throw new Error('Erro ao fazer upload');
        }

        // Construir URL pública da imagem
        const urlPublica = `${SUPABASE_URL}/storage/v1/object/public/eventos/${nomeArquivo}`;
        
        return urlPublica;

    } catch (error) {
        console.error('Erro no upload:', error);
        throw error;
    }
}