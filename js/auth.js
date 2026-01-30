// Referências de elementos
const loginForm = document.getElementById('login');
const signupForm = document.getElementById('signup');
const loginFormContainer = document.getElementById('loginForm');
const signupFormContainer = document.getElementById('signupForm');
const loadingSpinner = document.getElementById('loadingSpinner');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// Obter Auth do Firebase
const auth = firebase.auth();

// Alternar entre formulários
function toggleForms() {
    loginFormContainer.classList.toggle('active');
    signupFormContainer.classList.toggle('active');
    
    // Limpar erros e campos
    loginError.classList.remove('show');
    signupError.classList.remove('show');
    loginForm.reset();
    signupForm.reset();
}

// Mostrar loading
function showLoading(show = true) {
    loadingSpinner.classList.toggle('hidden', !show);
}

// Mostrar erro
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    
    // Remover mensagem após 5 segundos
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

// LOGIN
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validações básicas
    if (!email || !password) {
        showError(loginError, 'Preencha todos os campos');
        return;
    }
    
    if (password.length < 6) {
        showError(loginError, 'Senha deve ter no mínimo 6 caracteres');
        return;
    }
    
    showLoading(true);
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Login bem-sucedido:', userCredential.user);
        
        // Redirecionar para home
        window.location.href = 'home.html';
        
    } catch (error) {
        let mensagem = 'Erro ao fazer login';
        
        switch (error.code) {
            case 'auth/invalid-email':
                mensagem = 'E-mail inválido';
                break;
            case 'auth/user-not-found':
                mensagem = 'Usuário não encontrado';
                break;
            case 'auth/wrong-password':
                mensagem = 'Senha incorreta';
                break;
            case 'auth/too-many-login-attempts':
                mensagem = 'Muitas tentativas. Tente novamente mais tarde';
                break;
            case 'auth/network-request-failed':
                mensagem = 'Erro de conexão. Verifique sua internet';
                break;
        }
        
        showError(loginError, mensagem);
        showLoading(false);
    }
});

// CADASTRO
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    // Validações básicas
    if (!name || !email || !password) {
        showError(signupError, 'Preencha todos os campos');
        return;
    }
    
    if (name.length < 3) {
        showError(signupError, 'Nome deve ter no mínimo 3 caracteres');
        return;
    }
    
    if (!email.includes('@')) {
        showError(signupError, 'E-mail inválido');
        return;
    }
    
    if (password.length < 6) {
        showError(signupError, 'Senha deve ter no mínimo 6 caracteres');
        return;
    }
    
    showLoading(true);
    
    try {
        // Criar usuário
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Atualizar perfil com nome
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        console.log('Cadastro bem-sucedido:', userCredential.user);
        
        // Redirecionar para home
        window.location.href = 'home.html';
        
    } catch (error) {
        let mensagem = 'Erro ao criar conta';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                mensagem = 'Este e-mail já está cadastrado';
                break;
            case 'auth/invalid-email':
                mensagem = 'E-mail inválido';
                break;
            case 'auth/weak-password':
                mensagem = 'Senha muito fraca';
                break;
            case 'auth/network-request-failed':
                mensagem = 'Erro de conexão. Verifique sua internet';
                break;
        }
        
        showError(signupError, mensagem);
        showLoading(false);
    }
});

// Verificar se usuário já está logado
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário logado, redirecionar
        window.location.href = 'home.html';
    }
});