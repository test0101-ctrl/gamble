const hand = document.getElementById("card-hand");
const playerLanes = document.getElementById("player-lanes");
const opponentLanes = document.getElementById("opponent-lanes");
const endTurnButton = document.getElementById("end-turn");
const logDiv = document.getElementById("log");

const playerCards = [];
const opponentCards = [];

const sampleDeck = [
  { name: "Cool Dog", power: 3 },
  { name: "Pig", power: 2 },
  { name: "Corn Knight", power: 4 },
  { name: "Husker Knight", power: 3 },
  { name: "Wall of Sand", power: 1 },
  { name: "Elbow Princess", power: 5 }
];

function initLanes() {
  playerLanes.innerHTML = "";
  opponentLanes.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const playerLane = document.createElement("div");
    const opponentLane = document.createElement("div");
    playerLane.className = "lane player-lane";
    opponentLane.className = "lane opponent-lane";
    playerLanes.appendChild(playerLane);
    opponentLanes.appendChild(opponentLane);
  }
}

function drawCard() {
  const card = sampleDeck[Math.floor(Math.random() * sampleDeck.length)];
  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.innerHTML = `<strong>${card.name}</strong><br>Power: ${card.power}`;
  cardEl.dataset.power = card.power;
  cardEl.dataset.name = card.name;
  cardEl.addEventListener("click", () => playCard(cardEl));
  hand.appendChild(cardEl);
}

function drawHand(n = 3) {
  hand.innerHTML = "";
  for (let i = 0; i < n; i++) drawCard();
}

function playCard(cardEl) {
  const lanes = playerLanes.children;
  for (let lane of lanes) {
    if (!lane.hasChildNodes()) {
      lane.appendChild(cardEl);
      return;
    }
  }
  alert("All lanes are full!");
}

function opponentPlay() {
  const lanes = opponentLanes.children;
  for (let lane of lanes) {
    if (!lane.hasChildNodes()) {
      const card = sampleDeck[Math.floor(Math.random() * sampleDeck.length)];
      const cardEl = document.createElement("div");
      cardEl.className = "card";
      cardEl.innerHTML = `<strong>${card.name}</strong><br>Power: ${card.power}`;
      cardEl.dataset.power = card.power;
      cardEl.dataset.name = card.name;
      lane.appendChild(cardEl);
    }
  }
}

function log(message) {
  logDiv.innerHTML += `<div>${message}</div>`;
  logDiv.scrollTop = logDiv.scrollHeight;
}

function resolveTurn() {
  const pLanes = playerLanes.children;
  const oLanes = opponentLanes.children;

  for (let i = 0; i < 4; i++) {
    const pCard = pLanes[i].firstChild;
    const oCard = oLanes[i].firstChild;

    if (pCard && oCard) {
      const pPower = parseInt(pCard.dataset.power);
      const oPower = parseInt(oCard.dataset.power);

      if (pPower > oPower) {
        oLanes[i].removeChild(oCard);
        log(`${pCard.dataset.name} defeated ${oCard.dataset.name}`);
      } else if (oPower > pPower) {
        pLanes[i].removeChild(pCard);
        log(`${oCard.dataset.name} defeated ${pCard.dataset.name}`);
      } else {
        pLanes[i].removeChild(pCard);
        oLanes[i].removeChild(oCard);
        log(`${pCard.dataset.name} and ${oCard.dataset.name} destroyed each other`);
      }
    } else if (pCard && !oCard) {
      log(`${pCard.dataset.name} hits opponent directly!`);
    } else if (!pCard && oCard) {
      log(`${oCard.dataset.name} hits you directly!`);
    }
  }
}

endTurnButton.addEventListener("click", () => {
  resolveTurn();
  drawHand();
  opponentPlay();
});

initLanes();
drawHand();
opponentPlay();
