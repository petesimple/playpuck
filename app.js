// Play Puck Multiplayer App using Firebase (Fixed Edition)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-97nwZNJphsmhGEq_Idg7gsxuYXfAlh0",
  authDomain: "play-puck.firebaseapp.com",
  databaseURL: "https://play-puck-default-rtdb.firebaseio.com",
  projectId: "play-puck",
  storageBucket: "play-puck.firebasestorage.app",
  messagingSenderId: "173028734286",
  appId: "1:173028734286:web:c341cbf3e4274c733b1a1f",
  measurementId: "G-M85TY7H4LB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let deck = [];
let discardPile = [];
let playerHand = [];
let opponentHand = [];
let playerScore = 0;
let opponentScore = 0;
let currentPlayer = null;
let hasStarted = false;
let drawCooldown = false;

const playerId = Math.random().toString(36).substring(2, 10);
const matchId = prompt("Enter match ID to join or create:");
const matchRef = ref(db, `matches/${matchId}`);
let isHost = false;

get(matchRef).then(snapshot => {
  const data = snapshot.val();

  if (!data) {
    isHost = true;
    set(matchRef, {
      players: { [playerId]: true },
      state: "waiting",
      currentPlayer: playerId,
      deck: [],
      discardPile: [],
      scores: { [playerId]: 0 },
      createdAt: { ".sv": "timestamp" }
    });
    log("Waiting for opponent...");
  } else if (data.players && Object.keys(data.players).length < 2) {
    update(ref(db, `matches/${matchId}/players`), { [playerId]: true });
    update(ref(db, `matches/${matchId}/scores`), { [playerId]: 0 });
    log("Joined match. Waiting for host to start...");
  } else {
    alert("Match full!");
  }
});

function safeDraw(playerId) {
  if (drawCooldown) return;
  drawCooldown = true;
  setTimeout(() => (drawCooldown = false), 300);
  drawCard(playerId);
}

onValue(matchRef, snapshot => {
  const data = snapshot.val();
  if (!data) return;

  currentPlayer = data.currentPlayer;

  // Always keep deck + discard in sync
  deck = data.deck || [];
  discardPile = data.discardPile || [];

  // Always update hand if changed
  if (data.hands && data.hands[playerId]) {
    const newHand = data.hands[playerId];
    if (JSON.stringify(newHand) !== JSON.stringify(playerHand)) {
      playerHand = newHand;
      renderHand("player-hand", playerHand);
    }
  }

  if (data.state === "started") {
    if (!hasStarted) {
      hasStarted = true;
      log("Game started!");
    }

    // Check and draw only on your turn
    if (data.currentPlayer === playerId && playerHand.length < 3) {
      safeDraw(playerId);
    }
  }

  // Score update
  if (data.scores) {
    const opponentId = Object.keys(data.players).find(id => id !== playerId);
    playerScore = data.scores[playerId] || 0;
    opponentScore = data.scores[opponentId] || 0;
    document.getElementById("player-score").textContent = `Score: ${playerScore}`;
    document.getElementById("opponent-score").textContent = `Score: ${opponentScore}`;
  }
});

function startGame() {
  fetch("cards.json")
    .then(res => res.json())
    .then(cards => {
      const shuffled = shuffle([...cards]);
      const p1 = shuffled.splice(0, 3);
      const p2 = shuffled.splice(0, 3);

      const hands = {};
      hands[playerId] = p1;

      get(matchRef).then(snap => {
        const data = snap.val();
        const opponentId = Object.keys(data.players).find(id => id !== playerId);
        if (opponentId) {
          hands[opponentId] = p2;
        }

        set(matchRef, {
          players: data.players,
          state: "started",
          currentPlayer: playerId,
          deck: shuffled,
          discardPile: [],
          hands,
          scores: {
            [playerId]: 0,
            [opponentId]: 0
          }
        });

        playerHand = p1;
        renderHand("player-hand", playerHand);
      });
    });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function renderHand(containerId, hand) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  hand.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.textContent = card.name;
    cardEl.onclick = () => playCard(index);
    container.appendChild(cardEl);
  });
}

function playCard(index) {
  if (!hasStarted || currentPlayer !== playerId) {
    log("It's not your turn.");
    return;
  }

  const card = playerHand.splice(index, 1)[0];
  discardPile.push(card);
  log(`You played: ${card.name} — ${card.effect}`);
  renderHand("player-hand", playerHand);

  update(matchRef, {
    discardPile,
    [`hands/${playerId}`]: playerHand
  });

  const roll = rollDice();
  resolvePlay(card, roll);
}

function rollDice() {
  const roll = Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
  document.getElementById("dice-result").textContent = roll;
  return roll;
}

function resolvePlay(card, roll) {
  get(matchRef).then(snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const opponentId = Object.keys(data.players).find(id => id !== playerId);

    // Timeout card: end turn, draw 1 extra card
    if (card.effect === "End your turn and draw 1 extra card") {
      log("Timeout! You rest and draw a card.");
      drawCard(playerId);
      passTurn();
      return;
    }

    // Disarm opponent — block their defense cards for next turn
    if (card.effect === "Opponent cannot play defense card this turn") {
      log("You disarmed your opponent — they can't block your next shot!");
      update(matchRef, {
        disarmedPlayer: opponentId
      });
      passTurn();
      return;
    }

    // Steal effect
    if (card.effect === "Gain puck control immediately") {
      log("You stole the puck! It's your turn again.");
      update(matchRef, { currentPlayer: playerId }).then(() => {
        drawCard(playerId);
      });
      return;
    }

    // Check for opponent defense card unless disarmed
    const isDisarmed = data.disarmedPlayer === opponentId;
    if (card.type === "shot" && !isDisarmed) {
      const opponentHand = data.hands?.[opponentId] || [];
      const interceptIndex = opponentHand.findIndex(c => c.base === "intercept");

      if (interceptIndex !== -1) {
        const [interceptCard] = opponentHand.splice(interceptIndex, 1);
        discardPile.push(interceptCard);
        log(`Intercepted! Opponent used '${interceptCard.name}' to block your shot.`);

        update(matchRef, {
          [`hands/${opponentId}`]: opponentHand,
          discardPile,
          disarmedPlayer: null
        });

        passTurn();
        return;
      }
    }

    // Clear disarmed status (if it applied for this turn)
    if (data.disarmedPlayer) {
      update(matchRef, { disarmedPlayer: null });
    }

    if (card.base === "miss" || roll > 12) {
      log("Shot went out of bounds!");
      passTurn();
      return;
    }

    if (roll >= 3) {
      log("GOAL!");
      playerScore++;
      update(matchRef, {
        [`scores/${playerId}`]: playerScore
      });

// Time Delay effect — limit opponent's draws next turn
if (card.effect === "Opponent draws 1 less card next turn") {
  log("You slowed them down! Opponent will draw 1 less card next turn.");
  update(matchRef, {
    delayedPlayer: opponentId
  });
  passTurn();
  return;
}
      
      if (playerScore >= 7) {
        log("🏁 Game Over — You Win!");
        return;
      }

      passTurn(true);
    } else {
      log("No goal. Turn passes.");
      passTurn();
    }
  });
}

function drawCard(targetPlayerId) {
  get(matchRef).then(snapshot => {
    const data = snapshot.val();
    if (!data) return;

    let currentDeck = [...(data.deck || [])];
    let currentDiscard = [...(data.discardPile || [])];
    const hands = { ...data.hands };
    const hand = hands[targetPlayerId] || [];

    // ⛔ Enforce max hand size
    // Allow draw up to 3 normally, or only 2 if player is delayed
const isDelayed = data.delayedPlayer === targetPlayerId;
const maxHandSize = isDelayed ? 2 : 3;

if (hand.length >= maxHandSize) return;

if (isDelayed) {
  update(matchRef, { delayedPlayer: null });
}
    
    // ♻️ If deck is empty, reshuffle discard pile
    if (currentDeck.length === 0 && currentDiscard.length > 0) {
      currentDeck = shuffle(currentDiscard);
      currentDiscard = [];
    }

    if (currentDeck.length > 0) {
      const drawnCard = currentDeck.shift();
      const newHand = [...hand, drawnCard];
      hands[targetPlayerId] = newHand;

      update(matchRef, {
        deck: currentDeck,
        discardPile: currentDiscard,
        hands: hands
      });

      if (targetPlayerId === playerId) {
        playerHand = newHand;
        renderHand("player-hand", playerHand);
      }
    }
  });
}

function getOpponentId() {
  return Object.keys(data.players).find(id => id !== playerId);
}

function passTurn() {
  get(matchRef).then(snapshot => {
    const data = snapshot.val();
    const opponentId = getOpponentId();
    const nextPlayer = currentPlayer === playerId ? opponentId : playerId;

    const updates = {
      currentPlayer: nextPlayer,
      disarmedPlayer: null // reset disarm
    };

    update(matchRef, updates).then(() => {
      drawCard(nextPlayer);
    });
  });
}

function log(message) {
  const logEl = document.getElementById("log");
  const entry = document.createElement("div");
  entry.textContent = message;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

document.getElementById("draw-button").addEventListener("click", () => {
  log("Draw manually disabled in multiplayer mode.");
});

document.getElementById("start-button").addEventListener("click", () => {
  if (isHost) {
    startGame();
  } else {
    log("Only the host can start the game.");
  }
});
