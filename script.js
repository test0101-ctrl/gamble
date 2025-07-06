// --- Variáveis de Jogo (The Vault: Diários da Sobrevivência) ---
const gameState = {
    gameDay: 1,
    gameOver: false,

    // Recursos
    resources: {
        food: 50,
        water: 50,
        scrap: 0, // Sucata: recurso principal de construção
        energy: 0 // Produzida pelo gerador
    },
    
    // Abrigo
    population: 3, // Começa com 3 sobreviventes
    maxPopulation: 5, // Limite inicial do abrigo
    shelterMoral: 100, // Moral da população (0-100)
    generatorHealth: 100, // Saúde do gerador
    generatorLevel: 1, // Nível do gerador, afeta produção de energia

    // Sobreviventes
    survivors: [], // Array de objetos { id: 1, name: 'Nome', skill: 'Minerador', status: 'Livre'/'Explorando'/'Doente' }
    nextSurvivorId: 1,

    // Expedições
    expedition: {
        active: false,
        survivorId: null,
        daysRemaining: 0,
        currentLocation: 'Ruínas Próximas'
    },

    // Produção
    baseFoodConsumption: 2, // Comida por sobrevivente por dia
    baseWaterConsumption: 2, // Água por sobrevivente por dia
    foodProduction: 0, // Produção por hortas
    waterProduction: 0, // Produção por purificadores
    energyProductionPerLevel: 5, // Energia base por nível de gerador

    // Custos e Efeitos
    costs: {
        expandShelter: { scrap: 100, populationIncrease: 2 },
        buildFarm: { scrap: 50, foodIncrease: 5 },
        buildWaterPurifier: { scrap: 50, waterIncrease: 5 },
        upgradeGenerator: { scrap: 75, energyIncrease: 5 },
        repairGenerator: { scrap: 20, healthRestore: 20 }
    },

    // Eventos e Dificuldade
    eventChance: 0.1, // Chance de um evento aleatório no final do dia
    expeditionRisk: 0.3, // Risco base de um evento ruim na expedição
    attackChance: 0.05 // Chance de ataque direto ao gerador
};

// --- Referências do DOM ---
const gameDaySpan = document.getElementById('gameDay');
const populationSpan = document.getElementById('population');
const maxPopulationSpan = document.getElementById('maxPopulation');
const shelterMoralSpan = document.getElementById('shelterMoral');
const generatorHealthSpan = document.getElementById('generatorHealth');
const generatorHealthBar = document.getElementById('generatorHealthBar');

const foodResourcesSpan = document.getElementById('foodResources');
const waterResourcesSpan = document.getElementById('waterResources');
const scrapResourcesSpan = document.getElementById('scrapResources');
const energyResourcesSpan = document.getElementById('energyResources');

const survivorsListDiv = document.getElementById('survivorsList');
const currentSurvivorsCountSpan = document.getElementById('currentSurvivorsCount');

const expandShelterButton = document.getElementById('expandShelterButton');
const buildFarmButton = document.getElementById('buildFarmButton');
const buildWaterPurifierButton = document.getElementById('buildWaterPurifierButton');
const upgradeGeneratorButton = document.getElementById('upgradeGeneratorButton');
const repairGeneratorButton = document.getElementById('repairGeneratorButton');

const sendExpeditionButton = document.getElementById('sendExpeditionButton');
const expeditionStatusDiv = document.getElementById('expeditionStatus');
const eventLog = document.getElementById('eventLog');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');


// --- Funções de Utilitário e UI ---
function updateUI() {
    gameDaySpan.textContent = gameState.gameDay;
    populationSpan.textContent = gameState.population;
    maxPopulationSpan.textContent = gameState.maxPopulation;
    
    // Moral
    shelterMoralSpan.textContent = `${gameState.shelterMoral}%`;
    if (gameState.shelterMoral <= 25) { shelterMoralSpan.style.color = var('--accent-negative'); }
    else if (gameState.shelterMoral <= 60) { shelterMoralSpan.style.color = var('--accent-warning'); }
    else { shelterMoralSpan.style.color = var('--accent-positive'); }

    // Gerador Saúde
    generatorHealthSpan.textContent = `${gameState.generatorHealth}%`;
    generatorHealthBar.style.width = `${gameState.generatorHealth}%`;
    if (gameState.generatorHealth <= 25) { generatorHealthBar.style.backgroundColor = 'var(--accent-negative)'; }
    else if (gameState.generatorHealth <= 60) { generatorHealthBar.style.backgroundColor = 'var(--accent-warning)'; }
    else { generatorHealthBar.style.backgroundColor = 'var(--accent-positive)'; }

    // Recursos
    foodResourcesSpan.textContent = gameState.resources.food;
    waterResourcesSpan.textContent = gameState.resources.water;
    scrapResourcesSpan.textContent = gameState.resources.scrap;
    energyResourcesSpan.textContent = gameState.resources.energy;

    // Botões de Construção
    expandShelterButton.disabled = gameState.gameOver || gameState.resources.scrap < gameState.costs.expandShelter.scrap;
    buildFarmButton.disabled = gameState.gameOver || gameState.resources.scrap < gameState.costs.buildFarm.scrap;
    buildWaterPurifierButton.disabled = gameState.gameOver || gameState.resources.scrap < gameState.costs.buildWaterPurifier.scrap;
    upgradeGeneratorButton.disabled = gameState.gameOver || gameState.resources.scrap < gameState.costs.upgradeGenerator.scrap;
    repairGeneratorButton.disabled = gameState.gameOver || gameState.resources.scrap < gameState.costs.repairGenerator.scrap || gameState.generatorHealth === 100;

    // Botão de Expedição
    sendExpeditionButton.disabled = gameState.gameOver || gameState.expedition.active || gameState.survivors.filter(s => s.status === 'Livre').length === 0;

    // Atualizar status da Expedição
    if (gameState.expedition.active) {
        expeditionStatusDiv.textContent = `Expedição para ${gameState.expedition.currentLocation} ativa. Retorna em ${gameState.expedition.daysRemaining} dias.`;
        expeditionStatusDiv.classList.add('active');
    } else {
        expeditionStatusDiv.textContent = 'Nenhuma expedição ativa.';
        expeditionStatusDiv.classList.remove('active');
    }

    renderSurvivors(); // Renderiza os cards de sobreviventes
}

function logEvent(message, type = 'log-info') {
    const li = document.createElement('li');
    li.textContent = `[Dia ${gameState.gameDay}] ${message}`;
    li.classList.add(type);
    eventLog.prepend(li); // Adiciona no topo
    if (eventLog.children.length > 30) {
        eventLog.removeChild(eventLog.lastChild);
    }
}

function gameOver() {
    gameState.gameOver = true;
    clearInterval(gameState.gameLoopInterval);
    gameOverScreen.style.display = 'flex';
    logEvent("GAME OVER! Seu abrigo não sobreviveu. O desespero tomou conta.", "log-error");
}

function takeDamage(amount) {
    if (gameState.gameOver) return;
    gameState.generatorHealth -= amount;
    if (gameState.generatorHealth <= 0) {
        gameState.generatorHealth = 0;
        gameOver();
    }
    logEvent(`O Gerador sofreu ${amount} de dano! Saúde: ${gameState.generatorHealth}%`, "log-error");
    updateUI();
}

// --- Funções de Gerenciamento do Abrigo ---

function startGame() {
    // Resetar estado do jogo
    gameState.gameDay = 1;
    gameState.gameOver = false;
    gameState.resources = { food: 50, water: 50, scrap: 0, energy: 0 };
    gameState.population = 3;
    gameState.maxPopulation = 5;
    gameState.shelterMoral = 100;
    gameState.generatorHealth = 100;
    gameState.generatorLevel = 1;
    gameState.survivors = [];
    gameState.nextSurvivorId = 1;
    gameState.expedition = { active: false, survivorId: null, daysRemaining: 0, currentLocation: '' };
    gameState.foodProduction = 0;
    gameState.waterProduction = 0;

    // Custos voltam ao padrão (se tivessem escalado)
    gameState.costs.expandShelter.scrap = 100;
    gameState.costs.buildFarm.scrap = 50;
    gameState.costs.buildWaterPurifier.scrap = 50;
    gameState.costs.upgradeGenerator.scrap = 75;
    gameState.costs.repairGenerator.scrap = 20;

    gameOverScreen.style.display = 'none';
    eventLog.innerHTML = ''; // Limpa o log

    clearInterval(gameState.gameLoopInterval);
    gameState.gameLoopInterval = setInterval(dayCycle, 5000); // Um dia a cada 5 segundos

    // Adicionar sobreviventes iniciais
    addSurvivor('Maria', 'Coleto');
    addSurvivor('João', 'Construtor');
    addSurvivor('Ana', 'Médica');

    logEvent("Bem-vindo(a) ao Vault. Mantenha a esperança viva!", "log-game-event");
    updateUI();
}

function dayCycle() {
    if (gameState.gameOver) return;

    gameState.gameDay++;
    logEvent(`--- Início do Dia ${gameState.gameDay} ---`, "log-game-event");

    // 1. Consumo de Recursos
    const foodConsumed = gameState.population * gameState.baseFoodConsumption;
    const waterConsumed = gameState.population * gameState.baseWaterConsumption;

    gameState.resources.food -= foodConsumed;
    gameState.resources.water -= waterConsumed;

    // Penalidades por falta de recursos
    if (gameState.resources.food < 0) {
        gameState.resources.food = 0;
        gameState.shelterMoral = Math.max(0, gameState.shelterMoral - 10);
        logEvent("Falta de comida! A moral está caindo.", "log-warning");
    }
    if (gameState.resources.water < 0) {
        gameState.resources.water = 0;
        gameState.shelterMoral = Math.max(0, gameState.shelterMoral - 10);
        logEvent("Falta de água! A moral está caindo.", "log-warning");
    }

    // 2. Produção de Recursos (Hortas, Purificadores, Gerador)
    gameState.resources.food += gameState.foodProduction;
    gameState.resources.water += gameState.waterProduction;
    gameState.resources.energy += gameState.generatorLevel * gameState.energyProductionPerLevel;

    // 3. Gerenciamento do Gerador (Consumo de Energia)
    // O gerador consome energia para manter o abrigo.
    const energyConsumption = gameState.population * 2; // Ex: 2 energia por pessoa
    gameState.resources.energy -= energyConsumption;
    if (gameState.resources.energy < 0) {
        gameState.resources.energy = 0;
        takeDamage(Math.ceil(energyConsumption / 5)); // Dano proporcional à falta de energia
        logEvent("Gerador sem energia suficiente! Sofrendo sobrecarga.", "log-error");
        gameState.shelterMoral = Math.max(0, gameState.shelterMoral - 5);
    }

    // 4. Checar Expedição
    if (gameState.expedition.active) {
        gameState.expedition.daysRemaining--;
        if (gameState.expedition.daysRemaining <= 0) {
            resolveExpedition();
        }
    }

    // 5. Eventos Aleatórios
    if (Math.random() < gameState.eventChance) {
        triggerRandomEvent();
    }
    
    // 6. Impacto da Moral
    if (gameState.shelterMoral <= 20 && Math.random() < 0.1) {
        if (gameState.population > 1) {
            removeRandomSurvivor("Deserção por baixa moral.");
        } else {
            gameOver(); // Se for o último e moral muito baixa, é o fim
        }
    } else if (gameState.shelterMoral >= 80 && gameState.population < gameState.maxPopulation && Math.random() < 0.05) {
        // Chance de um novo sobrevivente aparecer se a moral estiver alta
        addNewSurvivor();
    }

    updateUI();

    // Condição de Game Over adicional: Sem sobreviventes
    if (gameState.population <= 0) {
        gameOver();
    }
}

function addSurvivor(name, skill) {
    if (gameState.population >= gameState.maxPopulation) {
        logEvent("Abrigo lotado! Não há espaço para mais sobreviventes.", "log-warning");
        return;
    }
    const newSurvivor = {
        id: gameState.nextSurvivorId++,
        name: name,
        skill: skill, // Ex: 'Construtor', 'Minerador', 'Médico', 'Combate'
        status: 'Livre',
        hunger: 0, // 0-10, 10 é faminto
        thirst: 0 // 0-10, 10 é desidratado
    };
    gameState.survivors.push(newSurvivor);
    gameState.population++;
    logEvent(`${newSurvivor.name} (${newSurvivor.skill}) juntou-se ao abrigo!`, "log-success");
    updateUI();
}

function removeSurvivor(survivorId, reason) {
    const index = gameState.survivors.findIndex(s => s.id === survivorId);
    if (index > -1) {
        const removed = gameState.survivors.splice(index, 1);
        gameState.population--;
        logEvent(`${removed[0].name} ${reason}`, "log-error");
        updateUI();
        if (gameState.population <= 0) {
            gameOver();
        }
    }
}

function addNewSurvivor() {
    const names = ['Ethan', 'Sophia', 'Liam', 'Olivia', 'Noah', 'Ava'];
    const skills = ['Coleto', 'Construtor', 'Médico', 'Combate', 'Engenheiro'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomSkill = skills[Math.floor(Math.random() * skills.length)];
    addSurvivor(randomName, randomSkill);
    logEvent(`Um novo sobrevivente, ${randomName}, apareceu nas portas do abrigo!`, "log-game-event");
}

function renderSurvivors() {
    survivorsListDiv.innerHTML = '';
    currentSurvivorsCountSpan.textContent = gameState.survivors.length; // Atualiza contador real
    gameState.survivors.forEach(s => {
        const survivorCard = document.createElement('div');
        survivorCard.classList.add('survivor-card');
        if (s.status === 'Explorando') survivorCard.classList.add('on-expedition');
        // Adicionar classes para fome/sede se implementado
        
        survivorCard.innerHTML = `
            <img src="images/survivor_default.png" alt="${s.name}">
            <p><strong>${s.name}</strong></p>
            <p class="skill">${s.skill}</p>
            <p class="status-text">Status: ${s.status}</p>
        `;
        survivorsListDiv.appendChild(survivorCard);
    });
}

// --- Funções de Construção ---
function expandShelter() {
    const cost = gameState.costs.expandShelter.scrap;
    if (gameState.resources.scrap >= cost) {
        gameState.resources.scrap -= cost;
        gameState.maxPopulation += gameState.costs.expandShelter.populationIncrease;
        gameState.costs.expandShelter.scrap = Math.floor(cost * 1.5); // Custo aumenta
        expandShelterButton.textContent = `Expandir Abrigo (${gameState.costs.expandShelter.scrap} Sucata)`;
        logEvent(`Abrigo expandido! Capacidade máxima: ${gameState.maxPopulation} pessoas.`, "log-success");
    } else {
        logEvent(`Não há sucata suficiente para expandir o abrigo (precisa de ${cost}).`, "log-warning");
    }
    updateUI();
}

function buildFarm() {
    const cost = gameState.costs.buildFarm.scrap;
    if (gameState.resources.scrap >= cost) {
        gameState.resources.scrap -= cost;
        gameState.foodProduction += gameState.costs.buildFarm.foodIncrease;
        gameState.costs.buildFarm.scrap = Math.floor(cost * 1.3);
        buildFarmButton.textContent = `Construir Horta (${gameState.costs.buildFarm.scrap} Sucata)`;
        logEvent(`Horta construída! Produção de comida aumentou para ${gameState.foodProduction}/dia.`, "log-success");
    } else {
        logEvent(`Não há sucata suficiente para construir uma horta (precisa de ${cost}).`, "log-warning");
    }
    updateUI();
}

function buildWaterPurifier() {
    const cost = gameState.costs.buildWaterPurifier.scrap;
    if (gameState.resources.scrap >= cost) {
        gameState.resources.scrap -= cost;
        gameState.waterProduction += gameState.costs.buildWaterPurifier.waterIncrease;
        gameState.costs.buildWaterPurifier.scrap = Math.floor(cost * 1.3);
        buildWaterPurifierButton.textContent = `Construir Purificador (${gameState.costs.buildWaterPurifier.scrap} Sucata)`;
        logEvent(`Purificador de água construído! Produção de água aumentou para ${gameState.waterProduction}/dia.`, "log-success");
    } else {
        logEvent(`Não há sucata suficiente para construir um purificador (precisa de ${cost}).`, "log-warning");
    }
    updateUI();
}

function upgradeGenerator() {
    const cost = gameState.costs.upgradeGenerator.scrap;
    if (gameState.resources.scrap >= cost) {
        gameState.resources.scrap -= cost;
        gameState.generatorLevel++;
        gameState.costs.upgradeGenerator.scrap = Math.floor(cost * 1.8); // Aumenta bem o custo
        upgradeGeneratorButton.textContent = `Melhorar Gerador (${gameState.costs.upgradeGenerator.scrap} Sucata)`;
        logEvent(`Gerador melhorado para Nível ${gameState.generatorLevel}! Produção de energia aumentada.`, "log-success");
    } else {
        logEvent(`Não há sucata suficiente para melhorar o gerador (precisa de ${cost}).`, "log-warning");
    }
    updateUI();
}

function repairGenerator() {
    const cost = gameState.costs.repairGenerator.scrap;
    if (gameState.resources.scrap >= cost && gameState.generatorHealth < 100) {
        gameState.resources.scrap -= cost;
        gameState.generatorHealth = Math.min(100, gameState.generatorHealth + gameState.costs.repairGenerator.healthRestore);
        logEvent(`Gerador reparado! Saúde: ${gameState.generatorHealth}%`, "log-success");
    } else if (gameState.generatorHealth === 100) {
        logEvent("Gerador já está com saúde máxima.", "log-info");
    } else {
        logEvent(`Não há sucata suficiente para reparar o gerador (precisa de ${cost}).`, "log-warning");
    }
    updateUI();
}

// --- Funções de Expedição ---
function sendExpedition() {
    if (gameState.expedition.active) {
        logEvent("Já há uma expedição em andamento.", "log-warning");
        return;
    }

    const availableSurvivors = gameState.survivors.filter(s => s.status === 'Livre');
    if (availableSurvivors.length === 0) {
        logEvent("Nenhum sobrevivente disponível para expedição.", "log-warning");
        return;
    }

    // Escolhe um sobrevivente aleatório para a expedição
    const chosenSurvivor = availableSurvivors[Math.floor(Math.random() * availableSurvivors.length)];
    chosenSurvivor.status = 'Explorando';

    const expeditionDuration = Math.floor(Math.random() * 3) + 2; // 2 a 4 dias
    const locations = ['Ruínas da Cidade', 'Floresta Contaminada', 'Subterrâneos Desconhecidos'];
    const chosenLocation = locations[Math.floor(Math.random() * locations.length)];

    gameState.expedition = {
        active: true,
        survivorId: chosenSurvivor.id,
        daysRemaining: expeditionDuration,
        currentLocation: chosenLocation
    };
    logEvent(`${chosenSurvivor.name} partiu em expedição para ${chosenLocation}. Retornará em ${expeditionDuration} dias.`, "log-info");
    updateUI();
}

function resolveExpedition() {
    const survivor = gameState.survivors.find(s => s.id === gameState.expedition.survivorId);
    if (!survivor) { // Em caso de erro, só para garantir
        logEvent("Erro: Sobrevivente da expedição não encontrado.", "log-error");
        gameState.expedition.active = false;
        updateUI();
        return;
    }

    survivor.status = 'Livre'; // Sobrevivente retorna ao abrigo

    // Eventos da expedição
    const diceRoll = Math.random();
    let foundScrap = Math.floor(Math.random() * 20) + 10; // 10-30 de sucata
    let foundFood = Math.floor(Math.random() * 15) + 5; // 5-20 de comida
    let foundWater = Math.floor(Math.random() * 15) + 5; // 5-20 de água

    if (diceRoll < gameState.expeditionRisk) { // Evento ruim
        const badEvents = [
            () => { // Perde recursos
                const lostScrap = Math.min(foundScrap, Math.floor(Math.random() * 10));
                foundScrap -= lostScrap;
                gameState.shelterMoral = Math.max(0, gameState.shelterMoral - 5);
                logEvent(`${survivor.name} encontrou mutantes na expedição e perdeu ${lostScrap} Sucata.`, "log-warning");
            },
            () => { // Sobrevivente ferido
                logEvent(`${survivor.name} foi ferido na expedição e agora está doente!`, "log-error");
                // TODO: Implementar estado 'doente' para sobreviventes
                gameState.shelterMoral = Math.max(0, gameState.shelterMoral - 10);
            },
            () => { // Ataque ao gerador (expedição atraiu atenção)
                const damage = Math.floor(Math.random() * 10) + 5;
       
