// === Card Wars: Clean, Replayable Version with Animations ===

// Game State
let hand = document.getElementById("hand");
let playerLanes = document.getElementById("player-lanes");
let opponentLanes = document.getElementById("opponent-lanes");
let logEl = document.getElementById("log");

const sampleDeck = [
  { name: "Cool Dog", power: 3, img: "https://i.imgur.com/Hz3Qt3R.png" },
  { name: "Pig", power: 2, img: "https://i.imgur.com/MNT1Y3P.png" },
  { name: "Corn Knight", power: 4, img: "https://i.imgur.com/vR8z7qG.png" },
  { name: "Husker Knight", power: 3, img: "https://i.imgur.com/FyufHgr.png" },
  { name: "Elbow Princess", power: 5, img: "https://i.imgur.com/E4NTuQv.png" },
];

function log(msg) {
  const line = document.createElement("div");
  line.textContent = msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function drawCard() {
  const card = sampleDeck[Math.floor(Math.random() * sampleDeck.length)];
  const el = document.createElement("div");
  el.className = "card fade-in";
  el.innerHTML = `
    <img src="${card.img}" class="card-img" alt="${card.name}"/>
    <div><strong>${card.name}</strong></div>
    <div>Power: ${card.power}</div>
  `;
  el.dataset.power = card.power;
  el.dataset.name = card.name;
  el.draggable = true;
  el.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", JSON.stringify(card)));
  return el;
}

function drawHand(n = 3) {
  hand.innerHTML = "";
  for (let i = 0; i < n; i++) hand.appendChild(drawCard());
}

function setupLanes() {
  [playerLanes, opponentLanes].forEach(row => {
    row.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const slot = document.createElement("div");
      slot.className = "card-slot";
      slot.addEventListener("dragover", (e) => e.preventDefault());
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!slot.hasChildNodes()) {
          const card = JSON.parse(e.dataTransfer.getData("text/plain"));
          const el = drawCard();
          el.classList.add("slide-in");
          slot.appendChild(el);
          el.draggable = false;
          drawHand(1);
        }
      });
      row.appendChild(slot);
    }
  });
}

function opponentPlay() {
  const lanes = opponentLanes.children;
  for (let lane of lanes) {
    if (!lane.hasChildNodes()) {
      const card = drawCard();
      card.classList.add("slide-in-opponent");
      lane.appendChild(card);
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
    }
  }
  opponentPlay();
}

// Init
drawHand(3);
setupLanes();
opponentPlay();
