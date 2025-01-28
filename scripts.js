// Simulação de banco de dados no frontend
const users = {};

// Funções de login e registro
function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (users[username] && users[username] === password) {
        alert(`Bem-vindo, ${username}!`);
        showGames();
    } else {
        alert("Credenciais inválidas. Tente novamente.");
    }
}

function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    if (users[username]) {
        alert("Usuário já registrado!");
    } else {
        users[username] = password;
        alert("Registro bem-sucedido! Faça login para jogar.");
    }
}

// Alternar entre formulários
function showForm(form) {
    document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(form).classList.add('active');
    document.getElementById(`${form}-tab`).classList.add('active');
}

// Mostrar seção de jogos
function showGames() {
    document.querySelector('.container').style.display = 'none';
    document.querySelector('.games').style.display = 'block';
}

// Lógica do Blackjack
function playBlackjack() {
    const playerCard = Math.floor(Math.random() * 11) + 1;
    const dealerCard = Math.floor(Math.random() * 11) + 1;

    let result = "";
    if (playerCard > dealerCard) {
        result = `Você venceu! Sua carta: ${playerCard}, Dealer: ${dealerCard}`;
    } else if (playerCard < dealerCard) {
        result = `Você perdeu! Sua carta: ${playerCard}, Dealer: ${dealerCard}`;
    } else {
        result = `Empate! Sua carta: ${playerCard}, Dealer: ${dealerCard}`;
    }

    document.querySelector("#blackjack-output").innerText = result;
}

// Lógica da Roleta
function playRoulette() {
    const randomNumber = Math.floor(Math.random() * 37);
    const bet = document.querySelector("#roulette-bet").value;

    let result = randomNumber == bet
        ? `Parabéns! A roleta parou em ${randomNumber}. Você ganhou!`
        : `A roleta parou em ${randomNumber}. Você perdeu.`;

    document.querySelector("#roulette-output").innerText = result;
}
