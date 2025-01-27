<script>
    // Simulação de Login
    const users = {}; // Para simular um banco de dados no frontend.

    function login(username, password) {
        if (users[username] && users[username] === password) {
            alert(`Bem-vindo, ${username}!`);
            showGames(); // Mostra os jogos após login bem-sucedido
        } else {
            alert("Credenciais inválidas. Tente novamente.");
        }
    }

    function register(username, password) {
        if (users[username]) {
            alert("Usuário já registrado!");
        } else {
            users[username] = password;
            alert("Registro bem-sucedido! Faça login para jogar.");
        }
    }

    // Exibir Jogos
    function showGames() {
        document.querySelector('.container').style.display = 'none';
        document.querySelector('.games').style.display = 'block';
    }

    // Lógica Blackjack
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

    // Lógica Roleta
    function playRoulette() {
        const randomNumber = Math.floor(Math.random() * 37);
        const bet = document.querySelector("#roulette-bet").value;

        let result = randomNumber == bet
            ? `Parabéns! A roleta parou em ${randomNumber}. Você ganhou!`
            : `A roleta parou em ${randomNumber}. Você perdeu.`;

        document.querySelector("#roulette-output").innerText = result;
    }
</script>
