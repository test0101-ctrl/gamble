// --- Variáveis de Jogo (Simplificadas para o "Clique e Vicie") ---
const gameState = {
    metal: 0,
    generatorHealth: 100,
    gameDay: 1,
    
    // Produção
    clickProduction: 1, // Metal por clique
    idleProductionPerSecond: 0, // Metal por segundo (drones)
    
    // Defesa
    turrets: 0, // Número de torretas
    turretDamage: 10, // Dano por torreta em cada ataque
    
    // Dificuldade
    baseMonsterDamage: 10, // Dano base do monstro ao gerador
    monsterHealth: 50, // "Vida" dos mutantes em um ataque
    attackInterval: 30, // Segundos entre ataques (começa fácil)
    timeUntilNextAttack: 30, // Contador regressivo
    
    // Custos (balanceados para progressão rápida inicial)
    costs: {
        upgradeClick: { metal: 10, multiplier: 0.5 }, // Aumenta 50% da produção atual
        buyDrone: { metal: 50, production: 1 }, // Adiciona 1 metal por segundo
        addTurret: { metal: 100 },
        repairGenerator: { metal: 50 }
    },

    // Intervalos
    gameLoopInterval: null,
    attackCountdownInterval: null,

    gameOver: false
};

// --- Referências do DOM ---
const metalResourcesSpan = document.getElementById('metalResources');
const generatorHealthSpan = document.getElementById('generatorHealth');
const gameDaySpan = document.getElementById('gameDay');
const clickProductionSpan = document.getElementById('clickProduction');
const idleProductionSpan = document.getElementById('idleProduction');
const nextAttackInSpan = document.getElementById('nextAttackIn');
const attackDamageSpan = document.getElementById('attackDamage');

const mineButton = document.getElementById('mineButton');
const upgradeClickButton = document.getElementById('upgradeClickButton');
const buyDroneButton = document.getElementById('buyDroneButton');
const addTurretButton = document.getElementById('addTurretButton');
const repairGeneratorButton = document.getElementById('repairGeneratorButton');

const messageLog = document.getElementById('messageLog');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');


// --- Funções de Utilitário ---
function updateUI() {
    metalResourcesSpan.textContent = Math.floor(gameState.metal);
    generatorHealthSpan.textContent = `${gameState.generatorHealth}%`;
    gameDaySpan.textContent = gameState.gameDay;
    clickProductionSpan.textContent = gameState.clickProduction;
    idleProductionSpan.textContent = gameState.idleProductionPerSecond;
    nextAttackInSpan.textContent = gameState.timeUntilNextAttack;
    attackDamageSpan.textContent = Math.floor(calculateMonsterDamage());

    // Feedback visual do gerador
    if (gameState.generatorHealth <= 25) {
        generatorHealthSpan.classList.add('critical');
        generatorHealthSpan.classList.remove('damaged');
    } else if (gameState.generatorHealth <= 60) {
        generatorHealthSpan.classList.add('damaged');
        generatorHealthSpan.classList.remove('critical');
    } else {
        generatorHealthSpan.classList.remove('critical', 'damaged');
    }

    // Habilitar/Desabilitar botões
    upgradeClickButton.disabled = gameState.metal < gameState.costs.upgradeClick.metal || gameState.gameOver;
    buyDroneButton.disabled = gameState.metal < gameState.costs.buyDrone.metal || gameState.gameOver;
    addTurretButton.disabled = gameState.metal < gameState.costs.addTurret.metal || gameState.gameOver;
    repairGeneratorButton.disabled = gameState.metal < gameState.costs.repairGenerator.metal || gameState.generatorHealth === 100 || gameState.gameOver;

    // Atualiza o texto dos botões de upgrade com o custo atual
    upgradeClickButton.textContent = `Melhorar Clique (${gameState.costs.upgradeClick.metal} Metal)`;
    buyDroneButton.textContent = `Comprar Drone (${gameState.costs.buyDrone.metal} Metal)`;
    addTurretButton.textContent = `Adicionar Torreta (${gameState.costs.addTurret.metal} Metal)`;
}

function logMessage(message, type = 'info') {
    const li = document.createElement('li');
    li.textContent = `[Dia ${gameState.gameDay}] ${message}`;
    li.classList.add(`message-${type}`);
    messageLog.prepend(li);
    if (messageLog.children.length > 15) { // Limita o log para manter o foco
        messageLog.removeChild(messageLog.lastChild);
    }
}

function gameOver() {
    gameState.gameOver = true;
    clearInterval(gameState.gameLoopInterval);
    clearInterval(gameState.attackCountdownInterval);
    gameOverScreen.style.display = 'flex';
    logMessage("GAME OVER! O gerador foi sobrepujado.", "error");
}

function takeDamage(amount) {
    if (gameState.gameOver) return;

    gameState.generatorHealth -= amount;
    if (gameState.generatorHealth <= 0) {
        gameState.generatorHealth = 0;
        gameOver();
    }
    logMessage(`O gerador sofreu ${amount} de dano! Saúde: ${gameState.generatorHealth}%`, "error");
}

function calculateMonsterDamage() {
    // Dano base + escalonamento pelo dia
    let damage = gameState.baseMonsterDamage + Math.floor(gameState.gameDay / 3) * 5;
    return Math.max(5, damage); // Dano mínimo
}

function calculateMonsterHealth() {
    // Vida dos monstros escalona com o dia, torretas efetivas contra essa vida
    let health = gameState.monsterHealth + (gameState.gameDay * 5);
    return Math.max(20, health); // Vida mínima
}

// --- Funções de Jogo Core ---

function startGame() {
    // Resetar estado
    gameState.metal = 0;
    gameState.generatorHealth = 100;
    gameState.gameDay = 1;
    gameState.clickProduction = 1;
    gameState.idleProductionPerSecond = 0;
    gameState.turrets = 0;
    gameState.baseMonsterDamage = 10;
    gameState.monsterHealth = 50;
    gameState.attackInterval = 30;
    gameState.timeUntilNextAttack = gameState.attackInterval;
    gameState.gameOver = false;

    // Resetar custos de upgrade (para balanceamento)
    gameState.costs.upgradeClick.metal = 10;
    gameState.costs.buyDrone.metal = 50;
    gameState.costs.addTurret.metal = 100;
    gameState.costs.repairGenerator.metal = 50;


    gameOverScreen.style.display = 'none';

    clearInterval(gameState.gameLoopInterval);
    clearInterval(gameState.attackCountdownInterval);

    gameState.gameLoopInterval = setInterval(gameLoop, 1000); // Roda a cada segundo
    gameState.attackCountdownInterval = setInterval(countdownAttack, 1000);

    logMessage("A escuridão chegou. O gerador é sua única esperança. Comece a minar!", "game-event");
    updateUI();
}

function gameLoop() {
    // Produção automática de metal
    gameState.metal += gameState.idleProductionPerSecond;
    updateUI();
}

function countdownAttack() {
    gameState.timeUntilNextAttack--;

    if (gameState.timeUntilNextAttack <= 0) {
        handleMonsterAttack();
        // Resetar contador e escalar dificuldade
        gameState.gameDay++;
        logMessage(`Um novo dia amanheceu: Dia ${gameState.gameDay}!`, "game-event");
        
        // Reduz o tempo entre ataques gradualmente (torna o jogo mais intenso)
        gameState.attackInterval = Math.max(10, gameState.attackInterval - 1); 
        gameState.timeUntilNextAttack = gameState.attackInterval;
    }
    updateUI();
}

function mineMetal() {
    if (gameState.gameOver) return;
    gameState.metal += gameState.clickProduction;
    logMessage(`Você minerou ${gameState.clickProduction} Metal!`, "success");
    updateUI();
}

function upgradeClickProduction() {
    const cost = gameState.costs.upgradeClick.metal;
    if (gameState.metal >= cost) {
        gameState.metal -= cost;
        gameState.clickProduction += Math.ceil(gameState.clickProduction * gameState.costs.upgradeClick.multiplier); // Aumenta a produção por clique
        gameState.costs.upgradeClick.metal = Math.floor(cost * 1.5); // Custo aumenta para o próximo upgrade
        logMessage(`Produção por clique melhorada! Agora gera ${gameState.clickProduction} Metal.`, "info");
    } else {
        logMessage(`Precisa de ${cost - gameState.metal} mais Metal para melhorar o clique.`, "warning");
    }
    updateUI();
}

function buyDrone() {
    const cost = gameState.costs.buyDrone.metal;
    if (gameState.metal >= cost) {
        gameState.metal -= cost;
        gameState.idleProductionPerSecond += gameState.costs.buyDrone.production; // Adiciona um drone
        gameState.costs.buyDrone.metal = Math.floor(cost * 1.8); // Custo aumenta mais para drones
        logMessage(`Um Drone foi ativado! Produção automática de ${gameState.idleProductionPerSecond} Metal/seg.`, "info");
    } else {
        logMessage(`Precisa de ${cost - gameState.metal} mais Metal para comprar um Drone.`, "warning");
    }
    updateUI();
}

function addTurret() {
    const cost = gameState.costs.addTurret.metal;
    if (gameState.metal >= cost) {
        gameState.metal -= cost;
        gameState.turrets++;
        gameState.costs.addTurret.metal = Math.floor(cost * 1.6); // Custo aumenta para torretas
        logMessage(`Uma Torreta de defesa foi instalada! Defesa ativa: ${gameState.turrets}.`, "info");
    } else {
        logMessage(`Precisa de ${cost - gameState.metal} mais Metal para adicionar uma Torreta.`, "warning");
    }
    updateUI();
}

function repairGenerator() {
    const cost = gameState.costs.repairGenerator.metal;
    if (gameState.metal >= cost && gameState.generatorHealth < 100) {
        gameState.metal -= cost;
        gameState.generatorHealth = Math.min(100, gameState.generatorHealth + 25); // Repara 25% da vida
        logMessage(`Gerador reparado em 25%! Saúde: ${gameState.generatorHealth}%`, "success");
    } else if (gameState.generatorHealth === 100) {
        logMessage("Gerador já está com saúde máxima.", "info");
    } else {
        logMessage(`Precisa de ${cost - gameState.metal} mais Metal para reparar o Gerador.`, "warning");
    }
    updateUI();
}

function handleMonsterAttack() {
    let currentMonsterHealth = calculateMonsterHealth();
    let monsterDamage = calculateMonsterDamage();

    logMessage(`MUTANTES ATACAM! Vida dos mutantes: ${currentMonsterHealth}.`, "game-event");

    // Torretas atacam
    let totalTurretDamage = gameState.turrets * gameState.turretDamage;
    currentMonsterHealth -= totalTurretDamage;
    logMessage(`Suas ${gameState.turrets} Torretas causaram ${totalTurretDamage} de dano!`, "info");

    if (currentMonsterHealth <= 0) {
        logMessage("As torretas repeliram os mutantes com sucesso!", "success");
        return; // Monstros derrotados
    }

    // Se os monstros não foram derrotados, o gerador leva dano
    takeDamage(monsterDamage);
    logMessage(`Os mutantes romperam as defesas e causaram dano ao gerador!`, "error");
}

// --- Event Listeners ---
mineButton.addEventListener('click', mineMetal);
upgradeClickButton.addEventListener('click', upgradeClickProduction);
buyDroneButton.addEventListener('click', buyDrone);
addTurretButton.addEventListener('click', addTurret);
repairGeneratorButton.addEventListener('click', repairGenerator);
restartButton.addEventListener('click', startGame);

// --- Inicialização do Jogo ---
startGame();
