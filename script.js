tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: "#000000",
                secondary: "#111111"
            }
        }
    }
};

// SIMULAÇÃO DE BANCO DE DADOS
// Usamos o localStorage para simular um banco de dados
const animeDatabase = [
    {
        id: 1,
        title: "Attack on Titan",
        image: "https://picsum.photos/200/300?random=1",
        genre: ["Ação", "Drama", "Fantasia"],
        rating: 4.8,
        episodes: 75,
        price: 9.99
    },
    {
        id: 2,
        title: "Demon Slayer",
        image: "https://picsum.photos/200/300?random=2",
        genre: ["Ação", "Fantasia", "Shounen"],
        rating: 4.9,
        episodes: 44,
        price: 12.50
    },
    {
        id: 3,
        title: "Jujutsu Kaisen",
        image: "https://picsum.photos/200/300?random=3",
        genre: ["Ação", "Fantasia", "Horror"],
        rating: 4.7,
        episodes: 24,
        price: 8.75
    },
    {
        id: 4,
        title: "My Hero Academia",
        image: "https://picsum.photos/200/300?random=4",
        genre: ["Ação", "Comédia", "Shounen"],
        rating: 4.6,
        episodes: 113,
        price: 15.00
    },
    {
        id: 5,
        title: "Death Note",
        image: "https://picsum.photos/200/300?random=5",
        genre: ["Mistério", "Psicológico", "Thriller"],
        rating: 4.9,
        episodes: 37,
        price: 7.99
    },
    {
        id: 6,
        title: "One Piece",
        image: "https://picsum.photos/200/300?random=6",
        genre: ["Ação", "Aventura", "Comédia"],
        rating: 4.7,
        episodes: 1000,
        price: 20.00
    }
];

// VARIÁVEIS GLOBAIS
let loggedInUser = null;

// FUNÇÕES DE UTILIDADE
const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));
const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];
const saveLoggedInUser = (user) => localStorage.setItem('loggedInUser', JSON.stringify(user));
const getLoggedInUser = () => JSON.parse(localStorage.getItem('loggedInUser'));

// FUNÇÕES DO BANCO DE DADOS (SIMULADO)
function registerUser(username, email, password) {
    const users = getUsers();
    const userExists = users.find(user => user.email === email);
    if (userExists) {
        alert("E-mail já cadastrado!");
        return false;
    }
    const newUser = {
        username,
        email,
        password,
        searchHistory: [],
        watchedAnimes: [],
        cart: []
    };
    users.push(newUser);
    saveUsers(users);
    alert("Usuário cadastrado com sucesso!");
    return true;
}

function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        loggedInUser = user;
        saveLoggedInUser(user);
        updateUI();
        alert(`Bem-vindo, ${user.username}!`);
        return true;
    }
    alert("E-mail ou senha incorretos.");
    return false;
}

function logoutUser() {
    loggedInUser = null;
    localStorage.removeItem('loggedInUser');
    updateUI();
    alert("Você foi desconectado.");
}

function updateUserProfile() {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === loggedInUser.email);
    if (userIndex !== -1) {
        users[userIndex] = loggedInUser;
        saveUsers(users);
        saveLoggedInUser(loggedInUser);
    }
}

// FUNÇÕES DE RENDERIZAÇÃO
function renderAnimes(animes, containerId, showCartButton = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (animes.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400">Nenhum anime encontrado.</p>`;
        return;
    }
    animes.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.className = 'bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition-transform';
        animeCard.innerHTML = `
            <img src="${anime.image}" alt="${anime.title}" class="w-full h-40 object-cover" loading="lazy">
            <div class="p-3">
                <h3 class="font-bold truncate">${anime.title}</h3>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-yellow-400 text-sm">
                        ${'★'.repeat(Math.floor(anime.rating))}${'☆'.repeat(5 - Math.floor(anime.rating))}
                    </span>
                    <span class="text-gray-400 text-sm">${anime.episodes} eps</span>
                </div>
                ${showCartButton ? `<button data-anime-id="${anime.id}" class="add-to-cart-btn w-full mt-3 rgb-button text-sm py-1 rounded-full">Adicionar ao Carrinho</button>` : ''}
            </div>
        `;
        container.appendChild(animeCard);
    });

    if (showCartButton) {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const animeId = parseInt(e.target.dataset.animeId);
                const animeToAdd = animeDatabase.find(a => a.id === animeId);
                addToCart(animeToAdd);
            });
        });
    }
}

function renderSearchHistory() {
    const container = document.getElementById('searchHistory');
    container.innerHTML = '';
    const history = loggedInUser.searchHistory || [];
    if (history.length === 0) {
        container.innerHTML = `<p class="text-gray-400">Seu histórico de pesquisa está vazio.</p>`;
        return;
    }
    history.forEach((search, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'flex justify-between items-center py-2 border-b border-gray-700 last:border-0';
        historyItem.innerHTML = `
            <span>${search}</span>
            <button class="text-gray-400 hover:text-red-500 remove-history-btn" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(historyItem);
    });

    document.querySelectorAll('.remove-history-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            loggedInUser.searchHistory.splice(index, 1);
            updateUserProfile();
            renderSearchHistory();
        });
    });
}

function renderWatchedAnimes() {
    const container = document.getElementById('watchedAnimes');
    container.innerHTML = '';
    const watched = loggedInUser.watchedAnimes || [];
    if (watched.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400">Você ainda não assistiu a nenhum anime.</p>`;
        return;
    }
    watched.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.className = 'bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition-transform';
        animeCard.innerHTML = `
            <img src="${anime.image}" alt="${anime.title}" class="w-full h-40 object-cover" loading="lazy">
            <div class="p-3">
                <h3 class="font-bold truncate">${anime.title}</h3>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-green-400 text-sm">Continuar</span>
                    <span class="text-gray-400 text-sm">Ep ${anime.lastEpisode || 1}</span>
                </div>
            </div>
        `;
        container.appendChild(animeCard);
    });
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const emptyMessage = document.getElementById('emptyCartMessage');
    const cartCount = document.getElementById('cartCount');
    container.innerHTML = '';
    const cart = loggedInUser.cart || [];
    
    if (cart.length === 0) {
        emptyMessage.style.display = 'block';
    } else {
        emptyMessage.style.display = 'none';
        cart.forEach((anime, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'flex items-center space-x-4 bg-gray-700 p-3 rounded-lg';
            cartItem.innerHTML = `
                <img src="${anime.image}" alt="${anime.title}" class="w-16 h-16 object-cover rounded">
                <div class="flex-grow">
                    <h4 class="font-bold">${anime.title}</h4>
                    <p class="text-gray-400">R$ ${anime.price.toFixed(2)}</p>
                </div>
                <button class="text-red-500 hover:text-red-400 remove-from-cart-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(cartItem);
        });

        document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                removeFromCart(index);
            });
        });
    }

    cartCount.textContent = cart.length;
}

// FUNÇÕES DE FUNCIONALIDADE
function searchAnimes(term) {
    const results = animeDatabase.filter(anime => 
        anime.title.toLowerCase().includes(term.toLowerCase()) || 
        anime.genre.some(genre => genre.toLowerCase().includes(term.toLowerCase()))
    );
    renderAnimes(results, 'featuredAnimes', true);
    if (loggedInUser) {
        loggedInUser.searchHistory.unshift(term);
        // Limita o histórico a 5 itens
        if (loggedInUser.searchHistory.length > 5) {
            loggedInUser.searchHistory.pop();
        }
        updateUserProfile();
        renderSearchHistory();
    }
}

function addToCart(anime) {
    if (!loggedInUser) {
        alert("Por favor, faça login para adicionar animes ao carrinho.");
        return;
    }
    loggedInUser.cart.push(anime);
    updateUserProfile();
    renderCart();
    alert(`${anime.title} foi adicionado ao seu carrinho.`);
}

function removeFromCart(index) {
    loggedInUser.cart.splice(index, 1);
    updateUserProfile();
    renderCart();
}

function updateUI() {
    const userStatus = document.getElementById('userStatus');
    const historySection = document.getElementById('historySection');
    const watchedSection = document.getElementById('watchedSection');
    
    if (loggedInUser) {
        userStatus.textContent = loggedInUser.username;
        historySection.style.display = 'block';
        watchedSection.style.display = 'block';
        renderSearchHistory();
        renderWatchedAnimes();
        renderCart();
    } else {
        userStatus.textContent = 'Login';
        historySection.style.display = 'none';
        watchedSection.style.display = 'none';
        document.getElementById('cartCount').textContent = '0';
    }
}

// LISTENERS DE EVENTOS
document.addEventListener('DOMContentLoaded', () => {
    // Tenta carregar o usuário logado
    loggedInUser = getLoggedInUser();
    updateUI();
    renderAnimes(animeDatabase, 'featuredAnimes', true);

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const loginButton = document.getElementById('loginButton');
    const loginModal = document.getElementById('loginModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const registerButton = document.getElementById('registerButton');
    const backToLoginButton = document.getElementById('backToLoginButton');
    const cartButton = document.getElementById('cartButton');
    const cartModal = document.getElementById('cartModal');
    const closeCartModal = document.getElementById('closeCartModal');

    searchButton.addEventListener('click', () => {
        searchAnimes(searchInput.value.trim());
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchAnimes(searchInput.value.trim());
        }
    });

    loginButton.addEventListener('click', () => {
        if (loggedInUser) {
            logoutUser();
        } else {
            loginModal.classList.remove('hidden');
        }
    });

    closeLoginModal.addEventListener('click', () => {
        loginModal.classList.add('hidden');
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (loginUser(email, password)) {
            loginModal.classList.add('hidden');
        }
    });

    registerButton.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    backToLoginButton.addEventListener('click', () => {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        if (registerUser(username, email, password)) {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        }
    });

    cartButton.addEventListener('click', () => {
        if (loggedInUser) {
            cartModal.classList.remove('hidden');
        } else {
            alert("Por favor, faça login para visualizar seu carrinho.");
        }
    });

    closeCartModal.addEventListener('click', () => {
        cartModal.classList.add('hidden');
    });

    document.querySelectorAll('#genreButtons button').forEach(button => {
        button.addEventListener('click', () => {
            searchAnimes(button.textContent.trim());
        });
    });
});