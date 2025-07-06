// --- Variáveis de Jogo ---
const gameState = {
    generatorHealth: 100,
    generatorPower: 100,
    resources: 0,
    gameTime: 0,
    domeLevel: 0, // 0 = sem cúpula, 1 = cúpula básica
    weapons: [], // Array de objetos de arma: { id: 1, health: 100, broken: false }
    isMining: false,
    mineInterval: null,
    attackInterval: null,
    powerConsumptionInterval: null,
    gameOver: false,
    monsterAttackChance: 0.1, // 10% de chance de ataque por ciclo de mineração
    domeProtection: [0, 0.5], // Níveis de proteção da cúpula (0% para nível 0, 50% para nível 1)
    weaponDamage: 10,
    monsterHealth: 50,
    monsterSpawnRate: 15000, // Monstros a cada 15 segundos (aproximado)
    monsterDamage: 20
};

// --- Referências de Elementos do DOM ---
const generatorHealthSpan = document.getElementById('generatorHealth');
const generatorPowerSpan = document.getElementById('generatorPower');
const resourcesSpan = document.getElementById('resources');
const gameTimeSpan = document.getElementById('gameTime');
const mineButton = document.getElementById('mineButton');
const repairDomeButton = document.getElementById('repairDomeButton');
const repairWeaponsButton = document.getElementById('repairWeaponsButton');
const upgradeDomeButton = document.getElementById('upgradeDomeButton');
const addWeaponButton = document.getElementById('addWeaponButton');
const messageLog = document.getElementById('messageLog');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const weaponsContainer = document.getElementById('weaponsContainer');

// --- Funções de Utilitário ---
function updateUI() {
    generatorHealthSpan.textContent = `${gameState.generatorHealth}%`;
    generatorPowerSpan.textContent = `${gameState.generatorPower}%`;
    resourcesSpan.textContent = gameState.resources;
    gameTimeSpan.textContent = `${gameState.gameTime}s`;

    // Habilitar/Desabilitar botões
    mineButton.disabled = gameState.gameOver;
    repairDomeButton.disabled = gameState.gameOver || gameState.domeLevel === 0 || gameState.resources < 20; // Custo de exemplo
    repairWeaponsButton.disabled = gameState.gameOver || gameState.weapons.every(w => !w.broken) || gameState.resources < 10; // Custo de exemplo
    upgradeDomeButton.disabled = gameState.gameOver || gameState.resources < 100 || gameState.domeLevel > 0; // Exemplo: só pode ter 1 nível
    addWeaponButton.disabled = gameState.gameOver || gameState.resources < 50;

    // Atualizar visual da cúpula
    document.getElementById('domeImage').style.opacity = gameState.domeLevel > 0 ? '1' : '0.5';

    // Atualizar visual do gerador (ex: cor vermelha se saúde baixa)
    if (gameState.generatorHealth < 30) {
        generatorHealthSpan.style.color = 'red';
    } else if (gameState.generatorHealth < 60) {
        generatorHealthSpan.style.color = 'orange';
    } else {
        generatorHealthSpan.style.color = '#f39c12';
    }

    renderWeapons();
}

function logMessage(message, type = 'info') {
    const li = document.createElement('li');
    li.textContent = `[${formatTime(gameState.gameTime)}] ${message}`;
    li.classList.add(`message-${type}`);
    messageLog.prepend(li); // Adiciona as mensagens mais recentes no topo
    if (messageLog.children.length > 20) { // Limita o número de mensagens
        messageLog.removeChild(messageLog.lastChild);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function gameOver() {
    gameState.gameOver = true;
    clearInterval(gameState.mineInterval);
    clearInterval(gameState.attackInterval);
    clearInterval(gameState.powerConsumptionInterval);
    gameOverScreen.style.display = 'flex';
    logMessage("GAME OVER! Seu gerador foi destruído.", "error");
}

function takeDamage(target, amount) {
    if (target === 'generator') {
        gameState.generatorHealth -= amount;
        if (gameState.generatorHealth <= 0) {
            gameState.generatorHealth = 0;
            gameOver();
        }
        logMessage(`O gerador sofreu ${amount} de dano! Saúde: ${gameState.generatorHealth}%`, "error");
    }
    updateUI();
}

// --- Funções de Lógica do Jogo ---

function startGame() {
    // Resetar estado do jogo
    gameState.generatorHealth = 100;
    gameState.generatorPower = 100;
    gameState.resources = 0;
    gameState.gameTime = 0;
    gameState.domeLevel = 0;
    gameState.weapons = [];
    gameState.isMining = false;
    gameState.gameOver = false;
    gameState.monsterAttackChance = 0.1;
    gameState.monsterHealth = 50;
    gameOverScreen.style.display = 'none';

    // Limpar intervalos antigos se existirem
    clearInterval(gameState.mineInterval);
    clearInterval(gameState.attackInterval);
    clearInterval(gameState.powerConsumptionInterval);

    // Iniciar intervalos
    gameState.powerConsumptionInterval = setInterval(consumePower, 5000); // Consome energia a cada 5 segundos
    gameState.gameInterval = setInterval(() => { gameState.gameTime++; updateUI(); }, 1000); // Atualiza tempo de jogo a cada segundo
    gameState.attackInterval = setInterval(trySpawnMonster, gameState.monsterSpawnRate); // Tenta spawnar monstro periodicamente

    logMessage("Bem-vindo de volta à Terra Despedaçada. Sobreviva!", "info");
    updateUI();
}

function mineResources() {
    if (gameState.gameOver) return;

    // Aumentar recursos
    const minedAmount = Math.floor(Math.random() * 5) + 1; // De 1 a 5 recursos
    gameState.resources += minedAmount;
    logMessage(`Você minerou ${minedAmount} recursos. Total: ${gameState.resources}.`, "success");

    // Chance de ataque de monstro
    if (Math.random() < gameState.monsterAttackChance) {
        logMessage("Criaturas mutantes apareceram e estão atacando o gerador!", "warning");
        handleMonsterAttack();
    }
    updateUI();
}

function consumePower() {
    if (gameState.gameOver) return;

    let consumption = 1; // Consumo base
    if (gameState.domeLevel > 0) consumption += 0.5; // Cúpula consome mais
    consumption += gameState.weapons.length * 0.2; // Armas consomem mais

    gameState.generatorPower -= consumption;

    if (gameState.generatorPower <= 0) {
        gameState.generatorPower = 0;
        takeDamage('generator', 5); // Gerador começa a sofrer dano se sem energia
        logMessage("O gerador está sem energia e sofrendo dano!", "error");
    } else if (gameState.generatorPower < 20) {
        logMessage("A energia do gerador está baixa!", "warning");
    }
    updateUI();
}

function handleMonsterAttack() {
    let damageToGenerator = gameState.monsterDamage;

    // Aplicar proteção da cúpula
    if (gameState.domeLevel > 0) {
        damageToGenerator *= (1 - gameState.domeProtection[gameState.domeLevel]);
        logMessage(`A cúpula absorveu parte do ataque!`, "info");
    }

    // Ataque das armas
    let totalWeaponDamage = 0;
    let activeWeapons = gameState.weapons.filter(w => !w.broken);
    activeWeapons.forEach(weapon => {
        totalWeaponDamage += gameState.weaponDamage;
        // Chance da arma quebrar
        if (Math.random() < 0.2) { // 20% de chance de quebrar por ataque
            weapon.broken = true;
            logMessage(`Uma de suas armas quebrou! Precisa de reparos.`, "warning");
        }
    });

    gameState.monsterHealth -= totalWeaponDamage;
    logMessage(`Suas armas causaram ${totalWeaponDamage} de dano aos monstros!`, "info");

    if (gameState.monsterHealth <= 0) {
        logMessage("Os monstros foram derrotados!", "success");
        gameState.monsterHealth = 50; // Resetar saúde do monstro para o próximo ataque
        return; // Monstros derrotados, sem dano ao gerador
    }

    takeDamage('generator', Math.round(damageToGenerator));
}

function trySpawnMonster() {
    // Apenas para simular, o spawn real é no mineResources
    // Esta função pode ser usada para ataques independentes da mineração
    if (gameState.gameOver) return;

    if (Math.random() < 0.3) { // Chance de ataque independente da mineração
        logMessage("Um grupo de mutantes selvagens se aproxima da sua base!", "warning");
        handleMonsterAttack();
    }
}


function upgradeDome() {
    const cost = 100;
    if (gameState.resources >= cost && gameState.domeLevel === 0) {
        gameState.resources -= cost;
        gameState.domeLevel = 1;
        logMessage("Cúpula de proteção construída! O gerador está mais seguro.", "success");
    } else if (gameState.domeLevel > 0) {
        logMessage("Você já possui uma cúpula!", "warning");
    } else {
        logMessage("Recursos insuficientes para construir a cúpula (precisa de 100).", "error");
    }
    updateUI();
}

function repairDome() {
    const cost = 20; // Custo de reparo da cúpula
    if (gameState.domeLevel > 0 && gameState.resources >= cost) {
        // Por simplicidade, assume-se que a cúpula não tem "vida" e está sempre ativa se "construída"
        // Em um jogo mais complexo, a cúpula teria sua própria barra de vida.
        // Aqui, reparamos a "deterioração" imaginária ou a capacidade da cúpula.
        gameState.resources -= cost;
        logMessage("Cúpula reparada e funcionando perfeitamente.", "success");
    } else if (gameState.domeLevel === 0) {
        logMessage("Você não possui uma cúpula para reparar.", "warning");
    } else {
        logMessage("Recursos insuficientes para reparar a cúpula (precisa de 20).", "error");
    }
    updateUI();
}


let nextWeaponId = 1;
function addWeapon() {
    const cost = 50;
    if (gameState.resources >= cost) {
        gameState.resources -= cost;
        gameState.weapons.push({ id: nextWeaponId++, health: 100, broken: false });
        logMessage("Nova arma automática adicionada à defesa da base!", "success");
    } else {
        logMessage("Recursos insuficientes para adicionar uma arma (precisa de 50).", "error");
    }
    updateUI();
}

function repairWeapons() {
    const costPerWeapon = 10;
    const brokenWeapons = gameState.weapons.filter(w => w.broken);
    if (brokenWeapons.length === 0) {
        logMessage("Nenhuma arma quebrada para reparar.", "info");
        return;
    }

    const totalCost = brokenWeapons.length * costPerWeapon;
    if (gameState.resources >= totalCost) {
        gameState.resources -= totalCost;
        brokenWeapons.forEach(w => w.broken = false);
        logMessage(`Todas as ${brokenWeapons.length} armas quebradas foram reparadas!`, "success");
    } else {
        logMessage(`Recursos insuficientes para reparar todas as armas (precisa de ${totalCost}).`, "error");
    }
    updateUI();
}

function renderWeapons() {
    weaponsContainer.innerHTML = ''; // Limpa as armas existentes
    gameState.weapons.forEach(weapon => {
        const weaponDiv = document.createElement('div');
        weaponDiv.classList.add('weapon');
        if (weapon.broken) {
            weaponDiv.classList.add('broken');
        }
        weaponDiv.innerHTML = `
            <img src="images/${weapon.broken ? 'weapon_broken.png' : 'weapon_ok.png'}" alt="Weapon">
            <p>Arma ${weapon.id}</p>
            ${weapon.broken ? '<p>QUEBRADA!</p>' : ''}
        `;
        weaponsContainer.appendChild(weaponDiv);
    });
}


// --- Event Listeners ---
mineButton.addEventListener('click', mineResources);
upgradeDomeButton.addEventListener('click', upgradeDome);
addWeaponButton.addEventListener('click', addWeapon);
repairDomeButton.addEventListener('click', repairDome);
repairWeaponsButton.addEventListener('click', repairWeapons);
restartButton.addEventListener('click', startGame);


// --- Inicialização do Jogo ---
startGame();
