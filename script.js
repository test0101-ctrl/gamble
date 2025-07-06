// --- Variáveis de Jogo (Atualizadas para mais recursos e mecânicas) ---
const gameState = {
    generatorHealth: 100,
    generatorPower: 100,
    resources: { // Múltiplos recursos
        metal: 0,
        components: 0,
        fuel: 0
    },
    gameDay: 1, // Novo: Contador de dias
    isDay: true, // Novo: Para ciclo dia/noite
    domeLevel: 0, // 0 = sem cúpula, 1 = cúpula básica
    weapons: [], // Array de objetos de arma: { id: 1, type: 'basic', health: 100, broken: false }
    
    // Intervalos de jogo
    gameTickInterval: null,
    powerConsumptionInterval: null,
    monsterAttackInterval: null,
    dayNightCycleInterval: null,

    gameOver: false,

    // Dificuldade e mecânicas
    baseMineAmount: { metal: 1, components: 1, fuel: 1 },
    mineVariance: 3, // Recursos = base + random(0 a variance)
    monsterSpawnChance: 0.15, // Chance base de ataque a cada "tick" de tempo
    monsterBaseDamage: 10,
    monsterHealthPool: 50, // Saúde total dos monstros em um ataque
    domeProtectionMultiplier: [0, 0.4], // 0% para nível 0, 40% de redução para nível 1
    weaponBaseDamage: 15,
    weaponBreakChance: 0.25, // 25% de chance de uma arma quebrar por ataque
    generatorFuelConsumption: 1, // Consumo de combustível por tick
    powerFromFuel: 20, // Energia restaurada por 1 unidade de combustível
    resourceCosts: {
        domeUpgrade: { metal: 100, components: 50 },
        addWeapon: { metal: 50, components: 20 },
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
const componentsResourcesSpan = document.getElementById('componentsResources');
const fuelResourcesSpan = document.getElementById('fuelResources');
const gameDaySpan = document.getElementById('gameDay');

const mineMetalButton = document.getElementById('mineMetalButton');
const mineComponentsButton = document.getElementById('mineComponentsButton');
const mineFuelButton = document.getElementById('mineFuelButton');

const repairDomeButton = document.getElementById('repairDomeButton');
const repairWeaponsButton = document.getElementById('repairWeaponsButton');
const upgradeDomeButton = document.getElementById('upgradeDomeButton');
const addWeaponButton = document.getElementById('addWeaponButton');
const fuelGeneratorButton = document.getElementById('fuelGeneratorButton');
const researchButton = document.getElementById('researchButton'); // Botão futuro

const messageLog = document.getElementById('messageLog');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
const weaponsContainer = document.getElementById('weaponsContainer');
const generatorImage = document.getElementById('generatorImage');
const domeImage = document.getElementById('domeImage');
const generatorStatus = document.getElementById('generatorStatus');
const domeStatus = document.getElementById('domeStatus');
const skyElement = document.querySelector('.sky');


// --- Funções de Utilitário ---
function updateUI() {
    // Atualizar barras de saúde e energia
    generatorHealthSpan.textContent = `${gameState.generatorHealth}%`;
    generatorHealthBar.style.width = `${gameState.generatorHealth}%`;
    generatorPowerSpan.textContent = `${gameState.generatorPower}%`;
    generatorPowerBar.style.width = `${gameState.generatorPower}%`;

    // Mudar cor da barra do gerador
    if (gameState.generatorHealth < 30) {
        generatorHealthBar.style.backgroundColor = 'var(--accent-red)';
        generatorStatus.textContent = 'Crítico!';
        generatorStatus.style.color = 'var(--accent-red)';
        generatorImage.src = 'images/generator_critical.png';
    } else if (gameState.generatorHealth < 60) {
        generatorHealthBar.style.backgroundColor = 'var(--accent-orange)';
        generatorStatus.textContent = 'Danos Leves';
        generatorStatus.style.color = 'var(--accent-orange)';
        generatorImage.src = 'images/generator_damaged.png';
    } else {
        generatorHealthBar.style.backgroundColor = 'var(--accent-green)';
        generatorStatus.textContent = 'Normal';
        generatorStatus.style.color = 'var(--accent-green)';
        generatorImage.src = 'images/generator_ok.png';
    }

    // Mudar cor da barra de energia
    if (gameState.generatorPower < 20) {
        generatorPowerBar.style.backgroundColor = 'var(--accent-red)';
    } else if (gameState.generatorPower < 50) {
        generatorPowerBar.style.backgroundColor = 'var(--accent-orange)';
    } else {
        generatorPowerBar.style.backgroundColor = 'var(--accent-green)';
    }

    // Atualizar recursos
    metalResourcesSpan.textContent = gameState.resources.metal;
    componentsResourcesSpan.textContent = gameState.resources.components;
    fuelResourcesSpan.textContent = gameState.resources.fuel;
    gameDaySpan.textContent = gameState.gameDay;

    // Habilitar/Desabilitar botões de ações
    mineMetalButton.disabled = gameState.gameOver;
    mineComponentsButton.disabled = gameState.gameOver;
    mineFuelButton.disabled = gameState.gameOver;

    upgradeDomeButton.disabled = gameState.gameOver || gameState.domeLevel > 0 ||
                                 gameState.resources.metal < gameState.resourceCosts.domeUpgrade.metal ||
                                 gameState.resources.components < gameState.resourceCosts.domeUpgrade.components;

    addWeaponButton.disabled = gameState.gameOver ||
                               gameState.resources.metal < gameState.resourceCosts.addWeapon.metal ||
                               gameState.resources.components < gameState.resourceCosts.addWeapon.components;

    repairDomeButton.disabled = gameState.gameOver || gameState.domeLevel === 0 ||
                                 gameState.resources.metal < gameState.resourceCosts.repairDome.metal; // Supondo que a cúpula precisa de reparos visuais ou lógicos

    const brokenWeapons = gameState.weapons.filter(w => w.broken).length;
    repairWeaponsButton.disabled = gameState.gameOver || brokenWeapons === 0 ||
                                    gameState.resources.metal < (brokenWeapons * gameState.resourceCosts.repairWeapon.metal);

    fuelGeneratorButton.disabled = gameState.gameOver || gameState.resources.fuel < 1 || gameState.generatorPower >= 100;

    // Atualizar visual da cúpula
    if (gameState.domeLevel === 0) {
        domeImage.src = 'images/dome_lvl0.png';
        domeStatus.textContent = 'Nenhuma';
        domeStatus.style.color = 'var(--accent-red)';
    } else if (gameState.domeLevel === 1) {
        domeImage.src = 'images/dome_lvl1.png';
        domeStatus.textContent = 'Operacional';
        domeStatus.style.color = 'var(--accent-green)';
    }

    renderWeapons();
}

function logMessage(message, type = 'info') {
    const li = document.createElement('li');
    li.textContent = `[Dia ${gameState.gameDay}] ${message}`;
    li.classList.add(`message-${type}`);
    messageLog.prepend(li);
    if (messageLog.children.length > 30) { // Limita o número de mensagens para não sobrecarregar
        messageLog.removeChild(messageLog.lastChild);
    }
}

function gameOver() {
    gameState.gameOver = true;
    clearInterval(gameState.gameTickInterval);
    clearInterval(gameState.powerConsumptionInterval);
    clearInterval(gameState.monsterAttackInterval);
    clearInterval(gameState.dayNightCycleInterval);
    gameOverScreen.style.display = 'flex';
    logMessage("GAME OVER! Seu gerador foi destruído pelos mutantes. A Terra não perdoa.", "error");
    // Adicionar um som de game over
    // playSound('gameover.mp3');
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
        // playSound('damage.mp3');
    }
    updateUI();
}

// --- Funções de Lógica do Jogo ---

function startGame() {
    // Resetar estado do jogo
    gameState.generatorHealth = 100;
    gameState.generatorPower = 100;
    gameState.resources = { metal: 0, components: 0, fuel: 0 };
    gameState.gameDay = 1;
    gameState.isDay = true;
    gameState.domeLevel = 0;
    gameState.weapons = [];
    gameState.gameOver = false;
    gameState.monsterHealthPool = 50; // Resetar saúde dos monstros por ataque
    gameOverScreen.style.display = 'none';

    // Limpar intervalos antigos se existirem
    clearInterval(gameState.gameTickInterval);
    clearInterval(gameState.powerConsumptionInterval);
    clearInterval(gameState.monsterAttackInterval);
    clearInterval(gameState.dayNightCycleInterval);

    // Iniciar intervalos
    gameState.gameTickInterval = setInterval(gameTick, 1000); // Principal tick do jogo (1 segundo)
    gameState.powerConsumptionInterval = setInterval(consumePower, 5000); // Consome energia a cada 5 segundos
    gameState.monsterAttackInterval = setInterval(tryTriggerMonsterAttack, 20000); // Tenta ataque de monstro a cada 20s
    gameState.dayNightCycleInterval = setInterval(advanceDay, 60000); // A cada 60 segundos (1 minuto) um novo dia

    // Define o estado inicial do céu
    skyElement.classList.remove('night');
    skyElement.classList.add('day'); // apenas para garantir a classe inicial

    logMessage("Bem-vindo de volta à Terra Despedaçada. Sobreviva!", "game-event");
    // playSound('start_game.mp3');
    updateUI();
}

function gameTick() {
    // Lógica que ocorre a cada segundo
    // Aumenta a dificuldade com o tempo
    if (gameState.gameDay > 5 && gameState.monsterSpawnChance < 0.3) {
        gameState.monsterSpawnChance += 0.001; // Aumenta levemente a chance de ataque
    }
    if (gameState.gameDay > 10 && gameState.monsterBaseDamage < 20) {
        gameState.monsterBaseDamage += 0.005; // Aumenta levemente o dano do monstro
    }
    // Lógica para dia/noite (apenas visual, a lógica de dia é por 'advanceDay')
    // A cada 30 segundos alternamos entre dia e noite visualmente para o "molho"
    const secondsInMinute = 60; // Duração de um dia no jogo
    const currentSecondOfDay = gameState.gameTickInterval % secondsInMinute; // Isso não é exato, precisaria de um contador de segundos dentro do dia

    // Melhorar a simulação do dia/noite
    const totalSecondsInDay = 60; // 1 minuto de jogo equivale a 1 dia
    const currentSecond = (Date.now() / 1000) % totalSecondsInDay; // Aproximação de tempo

    if (currentSecond > totalSecondsInDay * 0.75) { // Últimos 25% do dia -> Noite
        skyElement.classList.add('night');
        gameState.isDay = false;
    } else {
        skyElement.classList.remove('night');
        gameState.isDay = true;
    }

    updateUI();
}

function advanceDay() {
    gameState.gameDay++;
    logMessage(`O ${gameState.gameDay}º dia começa. As criaturas ficam mais perigosas!`, "game-event");
    // A saúde dos monstros para o próximo ataque pode aumentar com os dias
    gameState.monsterHealthPool += 5; // Monstros mais fortes a cada dia
    updateUI();
    // playSound('new_day.mp3');
}

function mineResource(type) {
    if (gameState.gameOver) return;

    let minedAmount = gameState.baseMineAmount[type] + Math.floor(Math.random() * gameState.mineVariance);
    gameState.resources[type] += minedAmount;
    logMessage(`Você minerou ${minedAmount} ${type}. Total: ${gameState.resources[type]}.`, "success");
    // playSound('mining_success.mp3');

    // Chance de ataque de monstro (agora independente para cada ação de mineração)
    if (Math.random() < gameState.monsterSpawnChance) {
        logMessage("Criaturas mutantes apareceram e estão atacando o gerador!", "warning");
        handleMonsterAttack();
    }
    updateUI();
}

function consumePower() {
    if (gameState.gameOver) return;

    let consumption = gameState.generatorFuelConsumption; // Consumo base de combustível/energia
    if (gameState.domeLevel > 0) consumption += 0.5; // Cúpula consome mais
    consumption += gameState.weapons.length * 0.2; // Armas consomem mais

    if (gameState.resources.fuel >= consumption) {
        gameState.resources.fuel = Math.max(0, gameState.resources.fuel - consumption); // Garante que não vá abaixo de zero
        gameState.generatorPower = Math.min(100, gameState.generatorPower + (consumption * 2)); // Combustível gera energia
    } else {
        // Se não tiver combustível, o gerador perde energia
        gameState.generatorPower -= (consumption * 5); // Perde mais energia sem combustível
        if (gameState.generatorPower <= 0) {
            gameState.generatorPower = 0;
            takeDamage('generator', 10); // Gerador começa a sofrer dano se sem energia
            logMessage("O gerador está sem energia e sofrendo dano grave!", "error");
            // playSound('generator_warning.mp3');
        } else if (gameState.generatorPower < 30) {
            logMessage("A energia do gerador está criticamente baixa! Abasteça-o.", "warning");
        }
    }
    updateUI();
}

function fuelGenerator() {
    const fuelNeeded = 1; // Unidades de combustível por abastecimento
    if (gameState.resources.fuel >= fuelNeeded && gameState.generatorPower < 100) {
        gameState.resources.fuel -= fuelNeeded;
        gameState.generatorPower = Math.min(100, gameState.generatorPower + gameState.powerFromFuel);
        logMessage(`Gerador abastecido! Energia: ${gameState.generatorPower}%`, "info");
        // playSound('fuel_up.mp3');
    } else if (gameState.generatorPower >= 100) {
        logMessage("A energia do gerador já está no máximo.", "info");
    } else {
        logMessage("Não há combustível suficiente para abastecer o gerador.", "error");
    }
    updateUI();
}


function tryTriggerMonsterAttack() {
    if (gameState.gameOver) return;
    // Esta função é para ataques periódicos, independentes da mineração
    if (Math.random() < (gameState.monsterSpawnChance * 1.5)) { // Maior chance para ataques periódicos
        logMessage("Um enxame de mutantes está se aproximando da sua base!", "game-event");
        handleMonsterAttack();
    }
}

function handleMonsterAttack() {
    let currentMonsterHealth = gameState.monsterHealthPool; // Saúde dos monstros para este ataque
    let damageToGenerator = gameState.monsterBaseDamage;

    // Defesa da cúpula
    if (gameState.domeLevel > 0) {
        damageToGenerator *= (1 - gameState.domeProtectionMultiplier[gameState.domeLevel]);
        logMessage(`A cúpula absorveu ${Math.round(gameState.monsterBaseDamage * gameState.domeProtectionMultiplier[gameState.domeLevel])} de dano!`, "info");
    }

    // Ataque das armas
    let totalWeaponDamage = 0;
    let activeWeapons = gameState.weapons.filter(w => !w.broken);
    activeWeapons.forEach(weapon => {
        totalWeaponDamage += gameState.weaponBaseDamage;
        // Chance da arma quebrar
        if (Math.random() < gameState.weaponBreakChance) {
            weapon.broken = true;
            logMessage(`Uma de suas armas (Arma ${weapon.id}) quebrou e precisa de reparos!`, "warning");
            // playSound('weapon_break.mp3');
        }
    });

    currentMonsterHealth -= totalWeaponDamage;
    logMessage(`Suas armas causaram ${totalWeaponDamage} de dano aos mutantes!`, "info");

    if (currentMonsterHealth <= 0) {
        logMessage("Os mutantes foram derrotados com sucesso! A base está segura.", "success");
        // playSound('monsters_defeated.mp3');
        // Resetar a saúde dos monstros para o próximo ataque, mas pode aumentar com a dificuldade
        gameState.monsterHealthPool = 50 + (gameState.gameDay * 5); // Fica mais difícil
        return; // Monstros derrotados, sem dano ao gerador
    }

    // Se os monstros não foram derrotados, o gerador leva dano
    takeDamage('generator', Math.round(damageToGenerator));
    logMessage("Os mutantes conseguiram causar dano ao gerador!", "error");
    // playSound('monster_hit_generator.mp3');
}

function upgradeDome() {
    const cost = gameState.resourceCosts.domeUpgrade;
    if (gameState.resources.metal >= cost.metal && gameState.resources.components >= cost.components && gameState.domeLevel === 0) {
        gameState.resources.metal -= cost.metal;
        gameState.resources.components -= cost.components;
        gameState.domeLevel = 1;
        logMessage("Cúpula de proteção construída! O gerador está mais seguro.", "success");
        // playSound('build_dome.mp3');
    } else if (gameState.domeLevel > 0) {
        logMessage("Você já possui uma cúpula. Considere melhorias futuras.", "info");
    } else {
        logMessage(`Recursos insuficientes para construir a cúpula. Precisa de ${cost.metal} Metal e ${cost.components} Componentes.`, "error");
        // playSound('error_sound.mp3');
    }
    updateUI();
}

function repairDome() {
    const cost = gameState.resourceCosts.repairDome;
    // Em um jogo real, a cúpula teria saúde e você repararia ela.
    // Aqui, vamos apenas adicionar uma condição de que "a cúpula precisa de reparos"
    // e o botão só habilita se você tiver uma cúpula e recursos.
    if (gameState.domeLevel > 0 && gameState.resources.metal >= cost.metal) {
        gameState.resources.metal -= cost.metal;
        logMessage("Cúpula reparada e funcionando perfeitamente. Sua integridade foi restaurada.", "success");
        // playSound('repair_sound.mp3');
    } else if (gameState.domeLevel === 0) {
        logMessage("Você não possui uma cúpula para reparar.", "warning");
    } else {
        logMessage(`Recursos insuficientes para reparar a cúpula (precisa de ${cost.metal} Metal).`, "error");
    }
    updateUI();
}

let nextWeaponId = 1;
function addWeapon() {
    const cost = gameState.resourceCosts.addWeapon;
    if (gameState.resources.metal >= cost.metal && gameState.resources.components >= cost.components) {
        gameState.resources.metal -= cost.metal;
        gameState.resources.components -= cost.components;
        gameState.weapons.push({ id: nextWeaponId++, type: 'basic', health: 100, broken: false });
        logMessage(`Nova arma automática (Arma ${nextWeaponId - 1}) adicionada à defesa da base!`, "success");
        // playSound('build_weapon.mp3');
    } else {
        logMessage(`Recursos insuficientes para adicionar uma arma. Precisa de ${cost.metal} Metal e ${cost.components} Componentes.`, "error");
        // playSound('error_sound.mp3');
    }
    updateUI();
}

function repairWeapons() {
    const brokenWeapons = gameState.weapons.filter(w => w.broken);
    if (brokenWeapons.length === 0) {
        logMessage("Nenhuma arma quebrada para reparar.", "info");
        return;
    }

    const totalCost = brokenWeapons.length * gameState.resourceCosts.repairWeapon.metal;
    if (gameState.resources.metal >= totalCost) {
        gameState.resources.metal -= totalCost;
        brokenWeapons.forEach(w => w.broken = false);
        logMessage(`Todas as ${brokenWeapons.length} armas quebradas foram reparadas!`, "success");
        // playSound('repair_sound.mp3');
    } else {
        logMessage(`Recursos insuficientes para reparar todas as armas (precisa de ${totalCost} Metal).`, "error");
        // playSound('error_sound.mp3');
    }
    updateUI();
}

function renderWeapons() {
    weaponsContainer.innerHTML = ''; // Limpa as armas existentes
    gameState.weapons.forEach(weapon => {
        const weaponDiv = document.createElement('div');
        weaponDiv.classList.add('weapon');
        if (weapon.broken) {
            weaponDiv.
