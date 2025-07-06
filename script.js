// --- Variáveis de Jogo (Simplificadas e Focadas) ---
const gameState = {
    generatorHealth: 100,
    generatorPower: 100,
    resources: { // Um recurso principal, um secundário
        metal: 0,
        fuel: 0
    },
    gameDay: 1,
    domeLevel: 0, // 0 = sem cúpula, 1 = cúpula construída
    weapons: [], // Armas: { id: 1, broken: false }
    
    // Intervalos
    gameTickInterval: null,
    powerConsumptionInterval: null,
    monsterAttackInterval: null,
    dayAdvanceInterval: null,

    gameOver: false,

    // Configurações de Dificuldade e Custos
    mineAmount: { metal: 5, fuel: 1 }, // Quanto cada ação de mineração rende
    monsterBaseDamage: 15,
    monsterHealthPool: 50, // Saúde que as armas precisam "zerar" por ataque
    monsterSpawnChance: 0.1, // Chance de ataque de monstro por ação/tick
    domeProtectionMultiplier: 0.5, // Cúpula reduz 50% do dano
    weaponDamage: 25, // Dano de cada arma
    weaponBreakChance: 0.2, // 20% de chance de quebrar por ataque
    generatorFuelConsumptionRate: 1, // Quanto de combustível consome por tick
    powerRestoredPerFuel: 20, // Quanto de energia 1 combustível restaura

    costs: {
        buildDome: { metal: 100 },
        addWeapon: { metal: 50 },
        repairDome: { metal: 20 },
        repairWeapon: { metal: 10 }
    }
};

// --- Referências de Elementos do DOM ---
const generatorHealthSpan = document.getElementById('generatorHealth');
const generatorPowerSpan = document.getElementById('generatorPower');
const resourcesSpan = document.getElementById('resources'); // Agora é Metal
const fuelResourcesSpan = document.getElementById('fuel'); // Novo para combustível
const gameDaySpan = document.getElementById('gameDay');

const mineButton = document.getElementById('mineButton');
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


// --- Funções de Utilitário ---
function updateUI() {
    generatorHealthSpan.textContent = `${gameState.generatorHealth}%`;
    generatorPowerSpan.textContent = `${gameState.generatorPower}%`;
    resourcesSpan.textContent = gameState.resources.metal;
    fuelResourcesSpan.textContent = gameState.resources.fuel; // Atualiza o combustível
    gameDaySpan.textContent = gameState.gameDay;

    // Atualizar cor do texto da saúde/energia para feedback rápido
    if (gameState.generatorHealth < 30) {
        generatorHealthSpan.classList.add('low');
        generatorImage.src = 'images/generator_critical.png';
        generatorStatus.textContent = 'CRÍTICO!';
        generatorStatus.classList.add('low');
        generatorStatus.classList.remove('medium');
    } else if (gameState.generatorHealth < 60) {
        generatorHealthSpan.classList.remove('low');
        generatorHealthSpan.classList.add('medium');
        generatorImage.src = 'images/generator_damaged.png';
        generatorStatus.textContent = 'DANIFICADO';
        generatorStatus.classList.remove('low');
        generatorStatus.classList.add('medium');
    } else {
        generatorHealthSpan.classList.remove('low', 'medium');
        generatorImage.src = 'images/generator_ok.png';
        generatorStatus.textContent = 'NORMAL';
        generatorStatus.classList.remove('low', 'medium');
    }

    if (gameState.generatorPower < 20) {
        generatorPowerSpan.classList.add('low');
    } else {
        generatorPowerSpan.classList.remove('low');
    }

    // Habilitar/Desabilitar botões
    mineButton.disabled = gameState.gameOver;
    collectFuelButton.disabled = gameState.gameOver;

    upgradeDomeButton.disabled = gameState.gameOver || gameState.domeLevel > 0 ||
                                 gameState.resources.metal < gameState.costs.buildDome.metal;

    addWeaponButton.disabled = gameState.gameOver ||
                               gameState.resources.metal < gameState.costs.addWeapon.metal;

    // Botões de reparo
    repairDomeButton.disabled = gameState.gameOver || gameState.domeLevel === 0 ||
                                gameState.resources.metal < gameState.costs.repairDome.metal;
    
    const brokenWeaponsCount = gameState.weapons.filter(w => w.broken).length;
    repairWeaponsButton.disabled = gameState.gameOver || brokenWeaponsCount === 0 ||
                                   gameState.resources.metal < (brokenWeaponsCount * gameState.costs.repairWeapon.metal);

    fuelGeneratorButton.disabled = gameState.gameOver || gameState.resources.fuel < 1 || gameState.generatorPower >= 100;


    // Atualizar visual da cúpula
    if (gameState.domeLevel === 0) {
        domeImage.src = 'images/dome_lvl0.png';
        domeStatus.textContent = 'Nenhuma';
        domeStatus.style.color = 'var(--accent-red)';
    } else {
        domeImage.src = 'images/dome_lvl1.png';
        domeStatus.textContent = 'Ativa';
        domeStatus.style.color = 'var(--accent-green)';
    }

    renderWeapons();
}

function logMessage(message, type = 'info') {
    const li = document.createElement('li');
    li.textContent = `[Dia ${gameState.gameDay}] ${message}`;
    li.classList.add(`message-${type}`);
    messageLog.prepend(li);
    // Limita o número de mensagens para manter o log limpo
    if (messageLog.children.length > 20) { 
        messageLog.removeChild(messageLog.lastChild);
    }
}

function gameOver() {
    gameState.gameOver = true;
    clearInterval(gameState.gameTickInterval);
    clearInterval(gameState.powerConsumptionInterval);
    clearInterval(gameState.monsterAttackInterval);
    clearInterval(gameState.dayAdvanceInterval);
    gameOverScreen.style.display = 'flex';
    logMessage("GAME OVER! Seu gerador foi destruído pelos mutantes.", "error");
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
    gameState.domeLevel = 0;
    gameState.weapons = [];
    gameState.gameOver = false;
    gameState.monsterHealthPool = 50; // Saúde dos monstros para cada ataque

    gameOverScreen.style.display = 'none';

    // Limpar intervalos antigos
    clearInterval(gameState.gameTickInterval);
    clearInterval(gameState.powerConsumptionInterval);
    clearInterval(gameState.monsterAttackInterval);
    clearInterval(gameState.dayAdvanceInterval);

    // Iniciar intervalos principais
    gameState.gameTickInterval = setInterval(gameTick, 1000); // 1 segundo
    gameState.powerConsumptionInterval = setInterval(consumePower, 5000); // Consome energia a cada 5 segundos
    gameState.monsterAttackInterval = setInterval(tryTriggerMonsterAttack, 20000); // Tenta ataque de monstro a cada 20 segundos
    gameState.dayAdvanceInterval = setInterval(advanceDay, 60000); // Avança um dia a cada 60 segundos

    logMessage("A escuridão caiu sobre a Terra. Sobreviva!", "game-event");
    updateUI();
}

function gameTick() {
    // Atualiza a UI a cada tick para manter os status visíveis
    updateUI();
}

function advanceDay() {
    gameState.gameDay++;
    logMessage(`O ${gameState.gameDay}º dia começa. As criaturas ficam mais perigosas!`, "game-event");
    // Aumenta a saúde dos monstros para o próximo ataque, para escalar a dificuldade
    gameState.monsterHealthPool += 10;
    // Aumenta levemente a chance de ataque
    gameState.monsterSpawnChance = Math.min(0.5, gameState.monsterSpawnChance + 0.01); // Limita a 50%
    updateUI();
}

function mineMetal() {
    if (gameState.gameOver) return;

    const minedAmount = gameState.mineAmount.metal + Math.floor(Math.random() * 3); // 5 a 7 metal
    gameState.resources.metal += minedAmount;
    logMessage(`Você minerou ${minedAmount} de Metal. Total: ${gameState.resources.metal}.`, "success");

    // Chance de ataque de monstro após mineração
    if (Math.random() < gameState.monsterSpawnChance) {
        logMessage("Mutantes surgiram do subterrâneo e estão atacando!", "warning");
        handleMonsterAttack();
    }
    updateUI();
}

function collectFuel() {
    if (gameState.gameOver) return;

    const collectedAmount = gameState.mineAmount.fuel + Math.floor(Math.random() * 1); // 1 a 2 combustível
    gameState.resources.fuel += collectedAmount;
    logMessage(`Você coletou ${collectedAmount} de Combustível. Total: ${gameState.resources.fuel}.`, "success");

    // Chance de ataque de monstro após coleta de combustível
    if (Math.random() < gameState.monsterSpawnChance) {
        logMessage("Um grupo de criaturas perigosas atacou enquanto você coletava combustível!", "warning");
        handleMonsterAttack();
    }
    updateUI();
}

function consumePower() {
    if (gameState.gameOver) return;

    let totalConsumption = gameState.generatorFuelConsumptionRate; // Consumo base
    if (gameState.domeLevel > 0) totalConsumption += 0.5; // Cúpula aumenta consumo
    totalConsumption += gameState.weapons.length * 0.2; // Armas aumentam consumo

    // Arredondar para evitar frações em combustível
    totalConsumption = Math.ceil(totalConsumption); 

    if (gameState.resources.fuel >= totalConsumption) {
        gameState.resources.fuel -= totalConsumption;
        // Regenera um pouco de energia para simular o gerador funcionando bem
        gameState.generatorPower = Math.min(100, gameState.generatorPower + (totalConsumption * 2));
    } else {
        // Se não tiver combustível suficiente, perde energia drasticamente
        gameState.generatorPower -= (totalConsumption * 10); // Perde mais energia
        if (gameState.generatorPower <= 0) {
            gameState.generatorPower = 0;
            takeDamage('generator', 15); // Sofre dano direto se ficar sem energia
            logMessage("O gerador está sem energia e sofrendo dano crítico!", "error");
        } else if (gameState.generatorPower < 30) {
            logMessage("A energia do gerador está perigosamente baixa! Abasteça-o imediatamente.", "warning");
        }
    }
    updateUI();
}

function fuelGenerator() {
    if (gameState.gameOver) return;

    const fuelToUse = 1;
    if (gameState.resources.fuel >= fuelToUse && gameState.generatorPower < 100) {
        gameState.resources.fuel -= fuelToUse;
        gameState.generatorPower = Math.min(100, gameState.generatorPower + gameState.powerRestoredPerFuel);
        logMessage(`Gerador abastecido com ${fuelToUse} de Combustível! Energia: ${gameState.generatorPower}%`, "info");
    } else if (gameState.generatorPower >= 100) {
        logMessage("O gerador já está com energia máxima.", "info");
    } else {
        logMessage("Combustível insuficiente.", "warning");
    }
    updateUI();
}

function tryTriggerMonsterAttack() {
    if (gameState.gameOver) return;
    // Ataque periódico, ligeiramente mais provável que o ataque por mineração
    if (Math.random() < (gameState.monsterSpawnChance * 1.5)) { 
        logMessage("Um enxame de mutantes se aproxima rapidamente da base!", "game-event");
        handleMonsterAttack();
    }
}

function handleMonsterAttack() {
    let currentMonsterHealth = gameState.monsterHealthPool; // Saúde dos monstros para este ataque
    let damageTaken = 0; // Dano que o gerador pode receber

    // Dano das armas ativas
    let totalWeaponDamage = 0;
    let activeWeapons = gameState.weapons.filter(w => !w.broken);
    activeWeapons.forEach(weapon => {
        totalWeaponDamage += gameState.weaponDamage;
        // Chance de quebra
        if (Math.random() < gameState.weaponBreakChance) {
            weapon.broken = true;
            logMessage(`Uma de suas armas (Arma ${weapon.id}) quebrou!`, "warning");
        }
    });

    currentMonsterHealth -= totalWeaponDamage;
    logMessage(`Suas ${activeWeapons.length} armas ativas causaram ${totalWeaponDamage} de dano aos mutantes!`, "info");

    if (currentMonsterHealth <= 0) {
        logMessage("Os mutantes foram eliminados! A base está segura... por enquanto.", "success");
        return; // Monstros derrotados
    }

    // Se os monstros não foram derrotados, o gerador leva dano
    damageTaken = gameState.monsterBaseDamage;

    // Aplicar proteção da cúpula
    if (gameState.domeLevel > 0) {
        damageTaken *= (1 - gameState.domeProtectionMultiplier);
        logMessage(`A cúpula absorveu parte do impacto!`, "info");
    }

    takeDamage('generator', Math.round(damageTaken));
}

function upgradeDome() {
    const cost = gameState.costs.buildDome;
    if (gameState.resources.metal >= cost.metal && gameState.domeLevel === 0) {
        gameState.resources.metal -= cost.metal;
        gameState.domeLevel = 1;
        logMessage("Cúpula de proteção construída! O gerador está muito mais seguro.", "success");
    } else if (gameState.domeLevel > 0) {
        logMessage("Você já possui uma cúpula. Não pode construir outra.", "info");
    } else {
        logMessage(`Recursos insuficientes (precisa de ${cost.metal} Metal).`, "error");
    }
    updateUI();
}

function repairDome() {
    const cost = gameState.costs.repairDome;
    if (gameState.domeLevel > 0 && gameState.resources.metal >= cost.metal) {
        // Por simplicidade, assumimos que reparar a cúpula "restaura" sua funcionalidade.
        // Em um jogo mais complexo, a cúpula teria saúde própria.
        gameState.resources.metal -= cost.metal;
        logMessage("Cúpula reparada e restaurada.", "success");
    } else if (gameState.domeLevel === 0) {
        logMessage("Você não possui uma cúpula para reparar.", "warning");
    } else {
        logMessage(`Recursos insuficientes (precisa de ${cost.metal} Metal).`, "error");
    }
    updateUI();
}

let nextWeaponId = 1;
function addWeapon() {
    const cost = gameState.costs.addWeapon;
    if (gameState.resources.metal >= cost.metal) {
        gameState.resources.metal -= cost.metal;
        gameState.weapons.push({ id: nextWeaponId++, broken: false });
        logMessage(`Nova Arma ${nextWeaponId - 1} adicionada à defesa da base!`, "success");
    } else {
        logMessage(`Recursos insuficientes (precisa de ${cost.metal} Metal).`, "error");
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
        logMessage(`Recursos insuficientes para reparar todas as armas (precisa de ${totalCost} Metal).`, "error");
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
            ${weapon.broken ? '<p class="status-broken">QUEBRADA</p>' : '<p class="status-ok">OK</p>'}
        `;
        weaponsContainer.appendChild(weaponDiv);
    });
}

// --- Event Listeners ---
mineButton.addEventListener('click', mineMetal);
collectFuelButton.addEventListener('click', collectFuel);
upgradeDomeButton.addEventListener('click', upgradeDome);
addWeaponButton.addEventListener('click', addWeapon);
repairDomeButton.addEventListener('click', repairDome);
repairWeaponsButton.addEventListener('click', repairWeapons);
fuelGeneratorButton.addEventListener('click', fuelGenerator);
restartButton.addEventListener('click', startGame);


// --- Inicialização do Jogo ---
startGame();
