// --- Variáveis de Jogo (Foco RPG de Sobrevivência) ---
const gameState = {
    generatorHealth: 100,
    generatorPower: 100,
    resources: { // Recusos essenciais
        metal: 0,
        fuel: 0
    },
    gameDay: 1,
    isDay: true, // Para o ciclo visual dia/noite
    domeLevel: 0, // 0 = sem cúpula, 1 = cúpula construída
    weapons: [], // Array de objetos de arma: { id: 1, broken: false }
    
    // Intervalos de jogo
    gameLoopInterval: null, // Loop principal
    powerConsumptionInterval: null, // Consumo de energia
    monsterAttackInterval: null, // Ataques de monstro
    dayNightCycleInterval: null, // Ciclo dia/noite

    gameOver: false,

    // Configurações e Escalabilidade
    mineAmount: { metal: 5, fuel: 2 }, // Recursos por ação de mineração
    monsterBaseDamage: 15,
    monsterHealthPool: 60, // "Vida" total dos monstros por ataque
    monsterAttackChance: 0.2, // Chance base de ataque a cada 'tick' de 20s
    domeProtection: 0.5, // Cúpula reduz 50% do dano
    weaponDamage: 20, // Dano de cada arma por ataque
    weaponBreakChance: 0.25, // Chance de uma arma quebrar
    generatorFuelConsumption: 1, // Consumo de combustível por tick
    powerFromFuel: 25, // Energia restaurada por unidade de combustível

    costs: {
        buildDome: { metal: 100 },
        addWeapon: { metal: 50 },
        repairDome: { metal: 20 },
        repairWeapon: { metal: 10 }
    }
};

// --- Referências de Elementos do DOM ---
const generatorHealthSpan = document.getElementById('generatorHealth');
const generatorHealthBar = document.getElementById('generatorHealthBar');
const generatorPowerSpan = document.getElementById('generatorPower');
const generatorPowerBar = document.getElementById('generatorPowerBar');
const metalResourcesSpan = document.getElementById('metalResources');
const fuelResourcesSpan = document.getElementById('fuelResources');
const gameDaySpan = document.getElementById('gameDay');

const mineMetalButton = document.getElementById('mineMetalButton');
const collectFuelButton = document.getElementById('collectFuelButton');
const repairDomeButton = document.getElementById('repairDomeButton');
const repairWeaponsButton = document.getElementById('repairWeaponsButton');
const upgradeDomeButton = document.getElementById('upgradeDomeButton');
const addWeaponButton = document.getElementById('addWeaponButton');
const fuelGeneratorButton = document.getElementById('fuelGeneratorButton');

const messageLog = document.getElementById('messageLog');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const weaponsContainer = document.getElementById('weaponsContainer');
const generatorImage = document.getElementById('generatorImage');
const domeImage = document.getElementById('domeImage');
const generatorStatus = document.getElementById('generatorStatus');
const domeStatus = document.getElementById('domeStatus');
const skyElement = document.querySelector('.sky');


// --- Funções de Utilitário e UI ---
function updateUI() {
    // Atualizar barras e textos de status do gerador
    generatorHealthSpan.textContent = `${gameState.generatorHealth}%`;
    generatorHealthBar.style.width = `${gameState.generatorHealth}%`;
    generatorPowerSpan.textContent = `${gameState.generatorPower}%`;
    generatorPowerBar.style.width = `${gameState.generatorPower}%`;

    if (gameState.generatorHealth <= 25) {
        generatorHealthBar.style.backgroundColor = 'var(--accent-red)';
        generatorStatus.textContent = 'CRÍTICO!';
        generatorStatus.style.color = 'var(--accent-red)';
        generatorImage.src = 'images/generator_critical.png';
    } else if (gameState.generatorHealth <= 60) {
        generatorHealthBar.style.backgroundColor = 'var(--accent-orange)';
        generatorStatus.textContent = 'DANIFICADO';
        generatorStatus.style.color = 'var(--accent-orange)';
        generatorImage.src = 'images/generator_damaged.png';
    } else {
        generatorHealthBar.style.backgroundColor = 'var(--accent-green)';
        generatorStatus.textContent = 'NORMAL';
        generatorStatus.style.color = 'var(--accent-green)';
        generatorImage.src = 'images/generator_ok.png';
    }

    if (gameState.generatorPower <= 20) {
        generatorPowerBar.style.backgroundColor = 'var(--accent-red)';
    } else if (gameState.generatorPower <= 50) {
        generatorPowerBar.style.backgroundColor = 'var(--accent-orange)';
    } else {
        generatorPowerBar.style.backgroundColor = 'var(--accent-green)';
    }

    // Atualizar recursos e dia
    metalResourcesSpan.textContent = gameState.resources.metal;
    fuelResourcesSpan.textContent = gameState.resources.fuel;
    gameDaySpan.textContent = gameState.gameDay;

    // Habilitar/Desabilitar botões de ação com base em recursos e estado
    mineMetalButton.disabled = gameState.gameOver;
    collectFuelButton.disabled = gameState.gameOver;

    upgradeDomeButton.disabled = gameState.gameOver || gameState.domeLevel > 0 ||
                                 gameState.resources.metal < gameState.costs.buildDome.metal;

    addWeaponButton.disabled = gameState.gameOver ||
                               gameState.resources.metal < gameState.costs.addWeapon.metal;

    // Habilitar reparos se houver dano ou armas quebradas E recursos
    repairDomeButton.disabled = gameState.gameOver || gameState.domeLevel === 0 ||
                                 gameState.resources.metal < gameState.costs.repairDome.metal;
    
    const brokenWeapons = gameState.weapons.filter(w => w.broken).length;
    repairWeaponsButton.disabled = gameState.gameOver || brokenWeapons === 0 ||
                                    gameState.resources.metal < (brokenWeapons * gameState.costs.repairWeapon.metal);

    fuelGeneratorButton.disabled = gameState.gameOver || gameState.resources.fuel < 1 || gameState.generatorPower >= 100;

    // Atualizar visual da cúpula
    if (gameState.domeLevel === 0) {
        domeImage.src = 'images/dome_lvl0.png';
        domeStatus.textContent = 'Nenhuma';
        domeStatus.style.color = 'var(--accent-red)';
    } else if (gameState.domeLevel === 1) {
        domeImage.src = 'images/dome_lvl1.png';
        domeStatus.textContent = 'Ativa';
        domeStatus.style.color = 'var(--accent-green)';
    }

    renderWeapons(); // Renderiza o estado das armas
}

function logMessage(message, type = 'info') {
    const li = document.createElement('li');
    li.textContent = `[Dia ${gameState.gameDay}] ${message}`;
    li.classList.add(`message-${type}`);
    messageLog.prepend(li); // Adiciona no início (mais recente no topo)
    if (messageLog.children.length > 25) { // Limita o número de mensagens
        messageLog.removeChild(messageLog.lastChild);
    }
}

function gameOver() {
    gameState.gameOver = true;
    clearInterval(gameState.gameLoopInterval);
    clearInterval(gameState.powerConsumptionInterval);
    clearInterval(gameState.monsterAttackInterval);
    clearInterval(gameState.dayNightCycleInterval);
    gameOverScreen.style.display = 'flex';
    logMessage("GAME OVER! Seu gerador foi destruído pelos mutantes. A sua jornada termina aqui.", "error");
}

function takeDamage(target, amount) {
    if (gameState.gameOver) return;

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
    gameState.resources = { metal: 0, fuel: 0 };
    gameState.gameDay = 1;
    gameState.isDay = true;
    gameState.domeLevel = 0;
    gameState.weapons = [];
    gameState.gameOver = false;
    
    // Resetar dificuldade/escalonamento
    gameState.monsterHealthPool = 60;
    gameState.monsterBaseDamage = 15;
    gameState.monsterAttackChance = 0.2;

    gameOverScreen.style.display = 'none';

    // Limpar intervalos antigos
    clearInterval(gameState.gameLoopInterval);
    clearInterval(gameState.powerConsumptionInterval);
    clearInterval(gameState.monsterAttackInterval);
    clearInterval(gameState.dayNightCycleInterval);

    // Iniciar novos intervalos
    gameState.gameLoopInterval = setInterval(gameLoop, 1000); // Principal tick do jogo (1 segundo)
    gameState.powerConsumptionInterval = setInterval(consumePower, 5000); // Consome energia a cada 5 segundos
    gameState.monsterAttackInterval = setInterval(tryTriggerMonsterAttack, 20000); // Tenta ataque de monstro a cada 20 segundos
    gameState.dayNightCycleInterval = setInterval(advanceDay, 60000); // Avança um dia a cada 60 segundos (1 minuto)

    // Estado inicial do céu
    skyElement.classList.remove('night');
    skyElement.classList.add('day'); 

    logMessage("Bem-vindo, sobrevivente. O futuro da humanidade depende deste gerador.", "game-event");
    updateUI();
}

function gameLoop() {
    // Lógica que acontece a cada segundo (opcional, para complexidade futura)
    // Por enquanto, apenas atualiza a UI para garantir que o tempo de ataque seja visível.
    updateUI();
}

function advanceDay() {
    gameState.gameDay++;
    logMessage(`O ${gameState.gameDay}º dia começa. O perigo espreita...`, "game-event");
    
    // Escalonamento da dificuldade
    gameState.monsterHealthPool += 10; // Monstros ficam mais resistentes
    gameState.monsterBaseDamage += 2; // Monstros causam mais dano
    gameState.monsterAttackChance = Math.min(0.8, gameState.monsterAttackChance + 0.02); // Aumenta chance de ataque, com limite

    // Alternar visual do dia/noite (não afeta jogabilidade diretamente aqui)
    gameState.isDay = !gameState.isDay;
    if (gameState.isDay) {
        skyElement.classList.remove('night');
        skyElement.classList.add('day');
    } else {
        skyElement.classList.remove('day');
        skyElement.classList.add('night');
    }

    updateUI();
}

function mineResource(type) {
    if (gameState.gameOver) return;

    let minedAmount = gameState.mineAmount[type] + Math.floor(Math.random() * 3); // Pequena variação
    gameState.resources[type] += minedAmount;
    logMessage(`Você minerou ${minedAmount} de ${type === 'metal' ? 'Metal' : 'Combustível'}. Total: ${gameState.resources[type]}.`, "success");

    // Chance de ataque ao minerar
    if (Math.random() < gameState.monsterAttackChance * 0.8) { // Ligeiramente menor chance que ataque periódico
        logMessage("A mineração atraiu a atenção de mutantes! Prepare-se!", "warning");
        handleMonsterAttack();
    }
    updateUI();
}

function consumePower() {
    if (gameState.gameOver) return;

    let consumption = gameState.generatorFuelConsumption; // Consumo base
    if (gameState.domeLevel > 0) consumption += 0.5; // Cúpula consome mais
    consumption += gameState.weapons.length * 0.2; // Armas também consomem

    // Para evitar frações de combustível, arredondamos o consumo
    consumption = Math.max(1, Math.ceil(consumption)); 

    if (gameState.resources.fuel >= consumption) {
        gameState.resources.fuel -= consumption;
        gameState.generatorPower = Math.min(100, gameState.generatorPower + (consumption * 2)); // Combustível gera energia
    } else {
        // Se sem combustível, o gerador perde energia e pode sofrer dano
        gameState.generatorPower -= (consumption * 5); 
        if (gameState.generatorPower <= 0) {
            gameState.generatorPower = 0;
            takeDamage('generator', 10); // Gerador sofre dano se sem energia
            logMessage("O gerador está sem energia! Sofrendo danos críticos!", "error");
        } else if (gameState.generatorPower < 30) {
            logMessage("A energia do gerador está criticamente baixa! Abasteça-o!", "warning");
        }
    }
    updateUI();
}

function fuelGenerator() {
    if (gameState.gameOver) return;

    const fuelToUse = 10; // Custo de combustível por abastecimento
    if (gameState.resources.fuel >= fuelToUse && gameState.generatorPower < 100) {
        gameState.resources.fuel -= fuelToUse;
        gameState.generatorPower = Math.min(100, gameState.generatorPower + gameState.powerFromFuel);
        logMessage(`Gerador abastecido com ${fuelToUse} de Combustível! Energia: ${gameState.generatorPower}%`, "info");
    } else if (gameState.generatorPower >= 100) {
        logMessage("A energia do gerador já está no máximo.", "info");
    } else {
        logMessage(`Você precisa de ${fuelToUse} Combustível para abastecer.`, "warning");
    }
    updateUI();
}

function tryTriggerMonsterAttack() {
    if (gameState.gameOver) return;
    // Ataque periódico principal
    if (Math.random() < gameState.monsterAttackChance) {
        logMessage("UM ENXAME DE MUTANTES ESTÁ ATACANDO SUA BASE!", "game-event");
        handleMonsterAttack();
    }
}

function handleMonsterAttack() {
    let currentMonsterHealth = gameState.monsterHealthPool; // Vida dos mutantes para este ataque
    let finalDamageToGenerator = gameState.monsterBaseDamage;

    // Defesa das armas
    let totalWeaponDamage = 0;
    let activeWeapons = gameState.weapons.filter(w => !w.broken);
    activeWeapons.forEach(weapon => {
        totalWeaponDamage += gameState.weaponDamage;
        // Chance da arma quebrar
        if (Math.random() < gameState.weaponBreakChance) {
            weapon.broken = true;
            logMessage(`Uma de suas armas (ID ${weapon.id}) quebrou! Precisa de reparos.`, "warning");
        }
    });

    currentMonsterHealth -= totalWeaponDamage;
    logMessage(`Suas ${activeWeapons.length} armas causaram ${totalWeaponDamage} de dano aos mutantes!`, "info");

    if (currentMonsterHealth <= 0) {
        logMessage("Os mutantes foram derrotados! A base está segura.", "success");
        return; // Monstros derrotados, gerador seguro
    }

    // Se mutantes sobreviveram, o gerador leva dano
    // Aplica proteção da cúpula
    if (gameState.domeLevel > 0) {
        finalDamageToGenerator *= (1 - gameState.domeProtection);
        logMessage(`A Cúpula de Proteção absorveu parte do impacto!`, "info");
    }

    takeDamage('generator', Math.round(finalDamageToGenerator));
    logMessage("Os mutantes conseguiram romper as defesas e danificar o gerador!", "error");
}

function upgradeDome() {
    const cost = gameState.costs.buildDome;
    if (gameState.resources.metal >= cost.metal && gameState.domeLevel === 0) {
        gameState.resources.metal -= cost.metal;
        gameState.domeLevel = 1;
        logMessage("Cúpula de Proteção construída! Sua base está muito mais segura.", "success");
    } else if (gameState.domeLevel > 0) {
        logMessage("Você já possui uma Cúpula de Proteção.", "info");
    } else {
        logMessage(`Recursos insuficientes (precisa de ${cost.metal} Metal).`, "warning");
    }
    updateUI();
}

function repairDome() {
    const cost = gameState.costs.repairDome;
    // Em um RPG, a cúpula teria saúde e você repararia, mas para simplificar,
    // o botão de reparar cúpula existe para o jogador sentir que pode manter as defesas
    if (gameState.domeLevel > 0 && gameState.resources.metal >= cost.metal) {
        gameState.resources.metal -= cost.metal;
        logMessage("Cúpula de Proteção reparada e restaurada à sua integridade total.", "success");
    } else if (gameState.domeLevel === 0) {
        logMessage("Não há Cúpula para reparar.", "warning");
    } else {
        logMessage(`Recursos insuficientes (precisa de ${cost.metal} Metal).`, "warning");
    }
    updateUI();
}

let nextWeaponId = 1; // Para dar um ID único a cada arma
function addWeapon() {
    const cost = gameState.costs.addWeapon;
    if (gameState.resources.metal >= cost.metal) {
        gameState.resources.metal -= cost.metal;
        gameState.weapons.push({ id: nextWeaponId++, broken: false });
        logMessage(`Nova Arma Automática (ID ${nextWeaponId - 1}) adicionada às defesas!`, "success");
    } else {
        logMessage(`Recursos insuficientes (precisa de ${cost.metal} Metal).`, "warning");
    }
    updateUI();
}

function repairWeapons() {
    const brokenWeapons = gameState.weapons.filter(w => w.broken);
    if (brokenWeapons.length === 0) {
        logMessage("Nenhuma arma quebrada para reparar.", "info");
        return;
    }

    const totalCost = brokenWeapons.length * gameState.costs.repairWeapon.metal;
    if (gameState.resources.metal >= totalCost) {
        gameState.resources.metal -= totalCost;
        brokenWeapons.forEach(w => w.broken = false);
        logMessage(`Todas as ${brokenWeapons.length} armas quebradas foram reparadas!`, "success");
    } else {
        logMessage(`Recursos insuficientes para reparar todas as armas (precisa de ${totalCost} Metal).`, "warning");
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
            ${weapon.broken ? '<p class="status-broken">QUEBRADA</p>' : '<p class="status-ok">OPERACIONAL</p>'}
        `;
        weaponsContainer.appendChild(weaponDiv);
    });
}

// --- Event Listeners ---
mineMetalButton.addEventListener('click', () => mineResource('metal'));
collectFuelButton.addEventListener('click', () => mineResource('fuel'));
upgradeDomeButton.addEventListener('click', upgradeDome);
addWeaponButton.addEventListener('click', addWeapon);
repairDomeButton.addEventListener('click', repairDome);
repairWeaponsButton.addEventListener('click', repairWeapons);
fuelGeneratorButton.addEventListener('click', fuelGenerator);
restartButton.addEventListener('click', startGame);

// --- Inicialização do Jogo ---
startGame();
