// === Card Wars Enhanced Engine with Images ===
// Adds: HP system, deck system, basic card abilities, win/lose conditions, placeholder art

let playerHP = 20;
let opponentHP = 20;

const hpDisplay = document.createElement("div");
hpDisplay.id = "hp-display";
document.body.prepend(hpDisplay);

function updateHPDisplay() {
  hpDisplay.innerHTML = `
    <div class="hp-bar">
      <strong>You:</strong> ${playerHP} HP
    </div>
    <div class="hp-bar">
      <strong>Opponent:</strong> ${opponentHP} HP
    </div>
  `;
}

// Enhanced sample deck with image placeholders
const sampleDeck = [
  { name: "Cool Dog", power: 3, ability: null, img: "https://i.imgur.com/Hz3Qt3R.png" },
  { name: "Pig", power: 2, ability: null, img: "https://i.imgur.com/MNT1Y3P.png" },
  { name: "Corn Knight", power: 4, ability: "doubleDamage", img: "https://i.imgur.com/vR8z7qG.png" },
  { name: "Husker Knight", power: 3, ability: null, img: "https://i.imgur.com/FyufHgr.png" },
  { name: "Wall of Sand", power: 1, ability: "block", img: "https://i.imgur.com/7tYxZgD.png" },
  { name: "Elbow Princess", power: 5, ability: "pierce", img: "https://i.imgur.com/E4NTuQv.png" },
  { name: "Magic Fist", power: 0, ability: "spell", img: "https://i.imgur.com/UrZ3oLN.png", effect: () => opponentHP -= 2 },
];

function drawDeckCard() {
  const card = sampleDeck[Math.floor(Math.random() * sampleDeck.length)];
  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.innerHTML = `
    <img src="${card.img}" alt="${card.name}" class="card-img" />
    <div><strong>${card.name}</strong></div>
    <div>Power: ${card.power}</div>
    ${card.ability ? `<div><em>${card.ability}</em></div>` : ''}
  `;
  cardEl.dataset.power = card.power;
  cardEl.dataset.name = card.name;
  cardEl.dataset.ability = card.ability || "";
  cardEl.addEventListener("click", () => playCard(cardEl));
  return cardEl;
}

function drawHand(n = 3) {
  hand.innerHTML = "";
  for (let i = 0; i < n; i++) hand.appendChild(drawDeckCard());
}

function opponentPlay() {
  const lanes = opponentLanes.children;
  for (let lane of lanes) {
    if (!lane.hasChildNodes()) {
      lane.appendChild(drawDeckCard());
    }
  }
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
      const pAbility = pCard.dataset.ability;
      const oAbility = oCard.dataset.ability;

      let adjustedPPower = pPower;
      if (pAbility === "doubleDamage") adjustedPPower *= 2;
      if (pAbility === "pierce") oLanes[i].removeChild(oCard);

      if (adjustedPPower > oPower) {
        oLanes[i].removeChild(oCard);
        log(`${pCard.dataset.name} defeated ${oCard.dataset.name}`);
      } else if (oPower > adjustedPPower) {
        pLanes[i].removeChild(pCard);
        log(`${oCard.dataset.name} defeated ${pCard.dataset.name}`);
      } else {
        pLanes[i].removeChild(pCard);
        oLanes[i].removeChild(oCard);
        log(`${pCard.dataset.name} and ${oCard.dataset.name} destroyed each other`);
      }
    } else if (pCard && !oCard) {
      let damage = parseInt(pCard.dataset.power);
      if (pCard.dataset.ability === "doubleDamage") damage *= 2;
      opponentHP -= damage;
      log(`${pCard.dataset.name} hits opponent directly for ${damage} damage!`);
    } else if (!pCard && oCard) {
      let damage = parseInt(oCard.dataset.power);
      playerHP -= damage;
      log(`${oCard.dataset.name} hits you for ${damage} damage!`);
    }
  }

  updateHPDisplay();
  checkGameOver();
}

function checkGameOver() {
  if (playerHP <= 0) {
    alert("You lost the game! 😵");
    location.reload();
  } else if (opponentHP <= 0) {
    alert("You won the game! 🎉");
    location.reload();
  }
}

// Initial load
updateHPDisplay();
