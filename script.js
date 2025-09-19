// ... (Your tailwind.config and animeDatabase remain the same) ...

// VARIÁVEIS GLOBAIS
let loggedInUser = null;

// FUNÇÕES DE UTILIDADE (REMOVIDAS, AGORA USAMOS FIREBASE)

// FUNÇÕES DO BANCO DE DADOS (AGORA COM FIREBASE)

// Use a Promise-based approach for asynchronous operations
async function registerUser(username, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Create a user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            username,
            email,
            searchHistory: [],
            watchedAnimes: [],
            cart: []
        });
        alert("Usuário cadastrado com sucesso!");
        return true;
    } catch (error) {
        alert("Erro no cadastro: " + error.message);
        return false;
    }
}

async function loginUser(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
    } catch (error) {
        alert("E-mail ou senha incorretos.");
        return false;
    }
}

function logoutUser() {
    signOut(auth).then(() => {
        alert("Você foi desconectado.");
    }).catch((error) => {
        console.error("Erro ao desconectar:", error);
    });
}

// Replaces updateUserProfile with Firestore update
async function updateUserProfile() {
    if (loggedInUser) {
        const userRef = doc(db, "users", loggedInUser.uid);
        await setDoc(userRef, {
            searchHistory: loggedInUser.searchHistory,
            watchedAnimes: loggedInUser.watchedAnimes,
            cart: loggedInUser.cart
        }, { merge: true }); // 'merge: true' ensures we only update the fields provided
    }
}

// ... (Your renderAnimes function remains the same, but the addToCart and searchAnimes will be updated) ...

async function renderSearchHistory() {
    const container = document.getElementById('searchHistory');
    container.innerHTML = '';
    if (!loggedInUser) {
        container.innerHTML = `<p class="text-gray-400">Faça login para ver o histórico.</p>`;
        return;
    }
    const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));
    const history = userDoc.exists() ? userDoc.data().searchHistory : [];

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
        button.addEventListener('click', async (e) => {
            const index = parseInt(e.target.dataset.index);
            const userRef = doc(db, "users", loggedInUser.uid);
            const userDoc = await getDoc(userRef);
            const history = userDoc.data().searchHistory;
            history.splice(index, 1);
            await updateDoc(userRef, { searchHistory: history });
            renderSearchHistory();
        });
    });
}

async function renderWatchedAnimes() {
    const container = document.getElementById('watchedAnimes');
    container.innerHTML = '';
    if (!loggedInUser) {
        container.innerHTML = `<p class="text-center text-gray-400">Faça login para ver seus animes.</p>`;
        return;
    }
    const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));
    const watched = userDoc.exists() ? userDoc.data().watchedAnimes : [];

    if (watched.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400">Você ainda não assistiu a nenhum anime.</p>`;
        return;
    }
    // The rest of the rendering logic is the same...
}

async function renderCart() {
    const container = document.getElementById('cartItems');
    const emptyMessage = document.getElementById('emptyCartMessage');
    const cartCount = document.getElementById('cartCount');
    container.innerHTML = '';
    if (!loggedInUser) {
        emptyMessage.style.display = 'block';
        cartCount.textContent = '0';
        return;
    }

    const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));
    const cart = userDoc.exists() ? userDoc.data().cart : [];

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
            button.addEventListener('click', async (e) => {
                const index = parseInt(e.target.dataset.index);
                const userRef = doc(db, "users", loggedInUser.uid);
                const userDoc = await getDoc(userRef);
                const cart = userDoc.data().cart;
                cart.splice(index, 1);
                await updateDoc(userRef, { cart });
                renderCart();
            });
        });
    }

    cartCount.textContent = cart.length;
}

// FUNÇÕES DE FUNCIONALIDADE
async function searchAnimes(term) {
    const results = animeDatabase.filter(anime => 
        anime.title.toLowerCase().includes(term.toLowerCase()) || 
        anime.genre.some(genre => genre.toLowerCase().includes(term.toLowerCase()))
    );
    renderAnimes(results, 'featuredAnimes', true);
    if (loggedInUser) {
        const userRef = doc(db, "users", loggedInUser.uid);
        const userDoc = await getDoc(userRef);
        const history = userDoc.data().searchHistory;
        history.unshift(term);
        if (history.length > 5) {
            history.pop();
        }
        await updateDoc(userRef, { searchHistory: history });
        renderSearchHistory();
    }
}

async function addToCart(anime) {
    if (!loggedInUser) {
        alert("Por favor, faça login para adicionar animes ao carrinho.");
        return;
    }
    const userRef = doc(db, "users", loggedInUser.uid);
    const userDoc = await getDoc(userRef);
    const cart = userDoc.data().cart;
    cart.push(anime);
    await updateDoc(userRef, { cart });
    renderCart();
    alert(`${anime.title} foi adicionado ao seu carrinho.`);
}

async function removeFromCart(index) {
    const userRef = doc(db, "users", loggedInUser.uid);
    const userDoc = await getDoc(userRef);
    const cart = userDoc.data().cart;
    cart.splice(index, 1);
    await updateDoc(userRef, { cart });
    renderCart();
}

function updateUI() {
    const userStatus = document.getElementById('userStatus');
    const historySection = document.getElementById('historySection');
    const watchedSection = document.getElementById('watchedSection');
    
    if (loggedInUser) {
        userStatus.textContent = loggedInUser.email; // Use email as username isn't directly in the auth object
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
    // Firebase listener for auth state changes
    onAuthStateChanged(auth, (user) => {
        loggedInUser = user;
        updateUI();
    });

    // ... (The rest of your event listeners for buttons and forms remain the same) ...
});