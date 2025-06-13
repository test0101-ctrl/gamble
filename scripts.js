// Game State Constants
const INITIAL_HP = 20;
const INITIAL_HAND_SIZE = 5;
const MAX_HAND_SIZE = 8;
const ACTIONS_PER_TURN = 2;

// Card Definitions (simplified for this example)
const creatureCards = [
    { id: 'cornfield_pig', name: 'Cornfield Pig', atk: 1, def: 4, cost: 1, floop: 'Heal 2 HP', type: 'Creature', landscape: 'Cornfield' },
    { id: 'cool_dog', name: 'Cool Dog', atk: 2, def: 2, cost: 2, floop: 'Draw 1 card', type: 'Creature', landscape: 'Blue Plains' },
    { id: 'pig_wizard', name: 'Pig Wizard', atk: 2, def: 3, cost: 2, floop: 'Deal 1 damage to opponent', type: 'Creature', landscape: 'Useless Swamp' },
    { id: 'walking_gloop', name: 'Walking Gloop', atk: 0, def: 5, cost: 1, floop: 'Next attack deals +1 damage', type: 'Creature', landscape: 'Useless Swamp' },
    { id: 'ancient_scholar', name: 'Ancient Scholar', atk: 1, def: 1, cost: 1, floop: 'Gain 1 Action', type: 'Creature', landscape: 'SandyLands' },
    { id: 'worm_king', name: 'Worm King', atk: 3, def: 3, cost: 3, floop: 'Target creature gains +1 ATK', type: 'Creature', landscape: 'Cornfield' },
    { id: 'hot_dog_knight', name: 'Hot Dog Knight', atk: 2, def: 1, cost: 1, floop: 'Deal 1 damage to an opposing creature', type: 'Creature', landscape: 'Blue Plains' },
    { id: 'ice_king_blob', name: 'Ice King Blob', atk: 1, def: 3, cost: 2, floop: 'Freeze (prevent next attack)', type: 'Creature', landscape: 'Icy Lands' },
];

// Main Game Object
const CardWarsGame = {
    players: [],
    activePlayerIndex: 0,
    selectedCard: null,
    selectedPlayerHandElement: null, // DOM element for visual selection

    // DOM Elements (cached on init)
    dom: {
        player1HP_El: null, player1Actions_El: null, player1Hand_El: null, player1Board_El: null,
        player2HP_El: null, player2Actions_El: null, player2Hand_El: null, player2Board_El: null,
        endTurnBtn: null, restartGameBtn: null,
        messageBox: null, messageText: null, messageOkBtn: null,
    },

    // --- Initialization ---
    init() {
        this.cacheDOMElements();
        this.addEventListeners();
        this.resetGame();
    },

    cacheDOMElements() {
        this.dom.player1HP_El = document.getElementById('player1-hp');
        this.dom.player1Actions_El = document.getElementById('player1-actions');
        this.dom.player1Hand_El = document.getElementById('player1-hand');
        this.dom.player1Board_El = document.getElementById('player1-board');

        this.dom.player2HP_El = document.getElementById('player2-hp');
        this.dom.player2Actions_El = document.getElementById('player2-actions');
        this.dom.player2Hand_El = document.getElementById('player2-hand');
        this.dom.player2Board_El = document.getElementById('player2-board');

        this.dom.endTurnBtn = document.getElementById('end-turn-btn');
        this.dom.restartGameBtn = document.getElementById('restart-game-btn');
        this.dom.messageBox = document.getElementById('message-box');
        this.dom.messageText = document.getElementById('message-text');
        this.dom.messageOkBtn = document.getElementById('message-ok-btn');
    },

    addEventListeners() {
        this.dom.endTurnBtn.addEventListener('click', () => this.endTurn());
        this.dom.restartGameBtn.addEventListener('click', () => {
            this.showMessage("Are you sure you want to restart the game?", () => this.resetGame());
        });

        // Drag and Drop listeners
        document.addEventListener('dragstart', (e) => this.handleDragStart(e));
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));

        // Click-to-play listeners (for mobile / simpler interaction)
        document.addEventListener('click', (e) => this.handleClickToPlay(e));
    },

    // --- Game Loop Management ---
    resetGame() {
        this.players = [
            { id: 0, name: 'Player 1', hp: INITIAL_HP, actions: 0, deck: [], hand: [], board: [null, null, null, null] },
            { id: 1, name: 'Player 2', hp: INITIAL_HP, actions: 0, deck: [], hand: [], board: [null, null, null, null] }
        ];

        this.activePlayerIndex = 0;
        this.selectedCard = null;
        this.selectedPlayerHandElement = null;

        this.players.forEach(player => {
            player.deck = this.createDeck();
            for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
                this.drawCard(player);
            }
        });

        this.updateUI();
        this.showMessage(`Welcome to Card Wars! Player 1, it's your turn.`, () => {
            this.startTurn();
        });
    },

    startTurn() {
        const activePlayer = this.players[this.activePlayerIndex];

        // Ready all creatures
        activePlayer.board.forEach(card => {
            if (card) {
                card.exhausted = false; // All ready
                // Reset temporary ATK buffs
                if (card.id === 'walking_gloop') { // Example for specific temporary buff reset
                    card.currentAtk = card.atk;
                }
            }
        });

        this.drawCard(activePlayer); // Draw card at start of new turn
        activePlayer.actions = ACTIONS_PER_TURN; // Reset actions

        this.updateUI();
        this.showMessage(`${activePlayer.name}, it's your turn!`);
    },

    endTurn() {
        this.showMessage("Turn Ending! Resolving Combat...", () => {
            this.resolveCombat(); // Combat happens at the end of the active player's turn
            if (this.checkGameOver()) return; // Check for game over after combat

            // Switch to next player
            this.activePlayerIndex = 1 - this.activePlayerIndex;
            this.startTurn(); // Start the next player's turn
        });
    },

    checkGameOver() {
        if (this.players[0].hp <= 0) {
            this.showMessage("Player 2 wins! Player 1's HP is 0.", () => this.resetGame());
            return true;
        }
        if (this.players[1].hp <= 0) {
            this.showMessage("Player 1 wins! Player 2's HP is 0.", () => this.resetGame());
            return true;
        }
        return false;
    },

    // --- Game Actions ---
    drawCard(player) {
        if (player.deck.length > 0 && player.hand.length < MAX_HAND_SIZE) {
            const card = player.deck.shift();
            // Assign a unique instance ID to the card
            card.instanceId = Date.now() + Math.random();
            card.currentAtk = card.atk; // Initialize current stats for modifications
            card.currentDef = card.def;
            card.exhausted = false; // All new cards are ready
            player.hand.push(card);
        } else if (player.deck.length === 0) {
            // No more cards to draw, player takes damage (Burn Out)
            player.hp = Math.max(0, player.hp - 1); // Lose 1 HP for burn out
            this.showMessage(`${player.name} is out of cards and takes 1 damage!`);
        } else if (player.hand.length >= MAX_HAND_SIZE) {
            this.showMessage(`${player.name}'s hand is full!`);
        }
    },

    handleCardPlay(card, handIndex, laneIndex) {
        const activePlayer = this.players[this.activePlayerIndex];

        if (activePlayer.actions < card.cost) {
            this.showMessage(`Not enough actions to play ${card.name}! Costs ${card.cost}, you have ${activePlayer.actions}.`);
            return;
        }
        if (activePlayer.board[laneIndex] !== null) {
            this.showMessage(`Lane ${laneIndex + 1} is already occupied!`);
            return;
        }

        activePlayer.hand.splice(handIndex, 1); // Remove from hand
        activePlayer.board[laneIndex] = card; // Place on board
        activePlayer.actions -= card.cost; // Deduct actions

        this.updateUI();
        this.selectedCard = null; // Deselect card after playing
        if (this.selectedPlayerHandElement) {
            this.selectedPlayerHandElement.classList.remove('border-4', 'border-green-500');
            this.selectedPlayerHandElement = null;
        }
    },

    handleCardFloop(card, laneIndex) {
        const activePlayer = this.players[this.activePlayerIndex];
        const opponentPlayer = this.players[1 - this.activePlayerIndex];

        if (card.exhausted) {
            this.showMessage(`${card.name} is already exhausted!`);
            return;
        }
        if (activePlayer.actions < 1) { // Flooping usually costs 1 action
            this.showMessage(`Not enough actions to Floop ${card.name}!`);
            return;
        }

        card.exhausted = true; // Mark as exhausted
        activePlayer.actions -= 1; // Deduct action for flooping

        // Apply Floop effect
        switch (card.id) {
            case 'cornfield_pig':
                activePlayer.hp = Math.min(INITIAL_HP, activePlayer.hp + 2);
                this.showMessage(`${card.name} flooped! ${activePlayer.name} heals 2 HP.`);
                break;
            case 'cool_dog':
                this.drawCard(activePlayer);
                this.showMessage(`${card.name} flooped! ${activePlayer.name} draws 1 card.`);
                break;
            case 'pig_wizard':
                opponentPlayer.hp = Math.max(0, opponentPlayer.hp - 1);
                this.showMessage(`${card.name} flooped! ${opponentPlayer.name} takes 1 damage.`);
                break;
            case 'walking_gloop':
                card.currentAtk += 1; // Temporary buff for next combat
                this.showMessage(`${card.name} flooped! Next attack for this creature deals +1 damage.`);
                break;
            case 'ancient_scholar':
                activePlayer.actions += 1;
                this.showMessage(`${card.name} flooped! ${activePlayer.name} gains 1 Action.`);
                break;
            case 'worm_king': // Target creature gains +1 ATK (randomly pick one of your creatures)
                const targetCreatures = activePlayer.board.filter(c => c && !c.exhausted);
                if (targetCreatures.length > 0) {
                    const target = targetCreatures[Math.floor(Math.random() * targetCreatures.length)];
                    target.currentAtk += 1;
                    this.showMessage(`${card.name} flooped! ${target.name} gains +1 ATK.`);
                } else {
                    this.showMessage(`${card.name} flooped! No ready creatures to buff.`);
                }
                break;
            case 'hot_dog_knight': // Deal 1 damage to an opposing creature (randomly pick one)
                const opponentCreatures = opponentPlayer.board.filter(c => c);
                if (opponentCreatures.length > 0) {
                    const target = opponentCreatures[Math.floor(Math.random() * opponentCreatures.length)];
                    target.currentDef -= 1; // Direct damage to defense
                    if (target.currentDef <= 0) {
                        const index = opponentPlayer.board.indexOf(target);
                        opponentPlayer.board[index] = null;
                        this.showMessage(`${card.name} flooped! ${target.name} defeated!`);
                    } else {
                        this.showMessage(`${card.name} flooped! ${target.name} takes 1 damage.`);
                    }
                } else {
                    this.showMessage(`${card.name} flooped! No opposing creatures to damage.`);
                }
                break;
            case 'ice_king_blob': // Freeze (prevent next attack) - simple implementation: skips next fight phase for this lane
                card.frozen = true;
                this.showMessage(`${card.name} flooped! Opponent's creature in this lane will be frozen next turn.`);
                break;
            default:
                this.showMessage(`${card.name} flooped! (No specific effect implemented)`);
                break;
        }
        this.updateUI();
    },

    resolveCombat() {
        const activePlayer = this.players[this.activePlayerIndex];
        const opponentPlayer = this.players[1 - this.activePlayerIndex];
        let combatLog = [];

        for (let i = 0; i < 4; i++) {
            const attackingCreature = activePlayer.board[i];
            const defendingCreature = opponentPlayer.board[i];

            if (attackingCreature && !attackingCreature.exhausted && !attackingCreature.frozen) {
                if (defendingCreature) {
                    // Creature vs Creature combat
                    defendingCreature.currentDef -= attackingCreature.currentAtk;
                    attackingCreature.currentDef -= defendingCreature.atk; // Attacking creature takes damage back

                    let laneLog = `${attackingCreature.name} (P${activePlayer.id + 1}) attacks ${defendingCreature.name} (P${opponentPlayer.id + 1}). `;

                    if (defendingCreature.currentDef <= 0) {
                        opponentPlayer.board[i] = null;
                        laneLog += `${defendingCreature.name} defeated! `;
                    }
                    if (attackingCreature.currentDef <= 0) {
                        activePlayer.board[i] = null;
                        laneLog += `${attackingCreature.name} defeated! `;
                    }
                    combatLog.push(laneLog);
                } else {
                    // Direct attack to opponent's HP
                    opponentPlayer.hp = Math.max(0, opponentPlayer.hp - attackingCreature.currentAtk);
                    combatLog.push(`${attackingCreature.name} (P${activePlayer.id + 1}) attacks ${opponentPlayer.name} directly for ${attackingCreature.currentAtk} damage!`);
                }
            }
            // Reset frozen status on creatures that were frozen
            if (attackingCreature && attackingCreature.frozen) {
                attackingCreature.frozen = false;
            }
        }
        if (combatLog.length > 0) {
            this.showMessage("Combat Results:\n" + combatLog.join('\n'));
        } else {
            this.showMessage("No combat this turn.");
        }
        this.updateUI();
    },

    // --- UI Rendering ---
    updateUI() {
        const p1 = this.players[0];
        const p2 = this.players[1];

        this.dom.player1HP_El.textContent = p1.hp;
        this.dom.player1Actions_El.textContent = p1.actions;
        this.dom.player2HP_El.textContent = p2.hp;
        this.dom.player2Actions_El.textContent = p2.actions;

        // Highlight active player's hand border
        if (this.activePlayerIndex === 0) {
            this.dom.player1Hand_El.classList.add('border-2', 'border-yellow-500');
            this.dom.player2Hand_El.classList.remove('border-2', 'border-yellow-500');
        } else {
            this.dom.player2Hand_El.classList.add('border-2', 'border-yellow-500');
            this.dom.player1Hand_El.classList.remove('border-2', 'border-yellow-500');
        }

        this.renderHand(p1);
        this.renderHand(p2);
        this.renderBoard(p1);
        this.renderBoard(p2);

        // Disable end turn button if no actions left or during opponent's turn (simplified)
        this.dom.endTurnBtn.disabled = (this.players[this.activePlayerIndex].actions <= 0 && this.players[this.activePlayerIndex].hand.length === 0);
    },

    createCardElement(card, isHandCard = false) {
        const cardEl = document.createElement('div');
        cardEl.classList.add('card');
        if (isHandCard) {
            cardEl.classList.add('card-in-hand');
            cardEl.draggable = true; // Make cards in hand draggable
        } else if (card.exhausted) {
            cardEl.classList.add('exhausted'); // Apply exhausted style if card is exhausted
        }

        const nameEl = document.createElement('div');
        nameEl.classList.add('font-bold', 'text-gray-800', 'text-sm');
        nameEl.textContent = card.name;
        cardEl.appendChild(nameEl);

        const iconEl = document.createElement('div');
        iconEl.classList.add('text-2xl', 'my-1');
        switch (card.landscape) {
            case 'Cornfield': iconEl.textContent = '🌽'; break;
            case 'Blue Plains': iconEl.textContent = '💧'; break;
            case 'Useless Swamp': iconEl.textContent = '🐸'; break;
            case 'SandyLands': iconEl.textContent = '🏜️'; break;
            case 'Icy Lands': iconEl.textContent = '❄️'; break;
            default: iconEl.textContent = '✨'; break;
        }
        cardEl.appendChild(iconEl);

        const statsEl = document.createElement('div');
        statsEl.classList.add('card-stats');
        statsEl.innerHTML = `<span class="text-red-500">🗡️${card.currentAtk || card.atk}</span> <span class="text-blue-500">🛡️${card.currentDef || card.def}</span>`;
        cardEl.appendChild(statsEl);

        if (card.floop) {
            const floopEl = document.createElement('div');
            floopEl.classList.add('card-floop');
            floopEl.innerHTML = `**Floop:** ${card.floop}`;
            cardEl.appendChild(floopEl);
        }

        cardEl.dataset.cardId = card.id;
        cardEl.dataset.cardInstanceId = card.instanceId;

        return cardEl;
    },

    renderHand(player) {
        const handEl = player.id === 0 ? this.dom.player1Hand_El : this.dom.player2Hand_El;
        handEl.innerHTML = '';

        player.hand.forEach((card, index) => {
            const cardEl = this.createCardElement(card, true);
            cardEl.dataset.cardIndex = index; // Store index for easier removal
            handEl.appendChild(cardEl);
        });
    },

    renderBoard(player) {
        const boardEl = player.id === 0 ? this.dom.player1Board_El : this.dom.player2Board_El;
        const slots = boardEl.querySelectorAll('.landscape-slot');

        player.board.forEach((card, index) => {
            const slotEl = slots[index];
            slotEl.innerHTML = '';

            if (card) {
                const cardEl = this.createCardElement(card, false);
                slotEl.appendChild(cardEl);

                // Add click listener for Flooping if it's the active player's turn
                if (player.id === this.activePlayerIndex) {
                    cardEl.onclick = () => this.handleCardFloop(card, index);
                }
            }
        });
    },

    showMessage(msg, callback = null) {
        this.dom.messageText.textContent = msg;
        this.dom.messageBox.classList.remove('hidden');
        this.dom.messageOkBtn.onclick = () => {
            this.dom.messageBox.classList.add('hidden');
            if (callback) callback();
        };
    },

    // --- Helper Functions ---
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    createDeck() {
        const deck = [];
        // Create a balanced deck for demonstration
        for (let i = 0; i < 4; i++) deck.push(JSON.parse(JSON.stringify(creatureCards[0])));
        for (let i = 0; i < 4; i++) deck.push(JSON.parse(JSON.stringify(creatureCards[1])));
        for (let i = 0; i < 3; i++) deck.push(JSON.parse(JSON.stringify(creatureCards[2])));
        for (let i = 0; i < 3; i++) deck.push(JSON.parse(JSON.stringify(creatureCards[3])));
        for (let i = 0; i < 2; i++) deck.push(JSON.parse(JSON.stringify(creatureCards[4])));
        for (let i = 0; i < 2; i++) deck.push(JSON.parse(JSON.stringify(creatureCards[5])));
        for (let i = 0; i < 2; i++) deck.push(JSON.parse(JSON.stringify(creatureCards[6])));
        for (let i = 0; i < 2; i++) deck.push(JSON.parse(JSON.stringify(creatureCards[7])));
        this.shuffle(deck);
        return deck;
    },

    // --- Drag and Drop Handlers ---
    handleDragStart(e) {
        if (e.target.classList.contains('card-in-hand') && e.target.closest('.player-hand').id === `player${this.activePlayerIndex + 1}-hand`) {
            this.selectedCard = this.pla
