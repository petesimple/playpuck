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
      scores: { [playerId]: 0 }
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

onValue(matchRef, snapshot => {
  const data = snapshot.val();
  if (!data) return;

  currentPlayer = data.currentPlayer;

  if (data.state === "started" && !hasStarted) {
    hasStarted = true;
    log("Game started!");

    if (data.currentPlayer === playerId && hasStarted) {
  if (playerHand.length < 3) {
    drawCard(playerId);
  }
}    
    if (!deck.length) {
      deck = data.deck;
      discardPile = data.discardPile || [];
      if (data.hands && data.hands[playerId]) {
        playerHand = data.hands[playerId];
        renderHand("player-hand", playerHand);
      }
    }
  }

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

    if (playerScore >= 7) {
      log("🏁 Game Over — You Win!");
      return;
    }

    passTurn(true);
  } else {
    log("No goal. Turn passes.");
    passTurn();
  }
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
    if (hand.length >= 3) return;

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

function passTurn() {
  get(matchRef).then(snapshot => {
    const data = snapshot.val();
    const opponentId = Object.keys(data.players).find(id => id !== playerId);
    const nextPlayer = currentPlayer === playerId ? opponentId : playerId;

    update(matchRef, {
      currentPlayer: nextPlayer
    }).then(() => {
      // Draw card for next player AFTER turn has been set
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

document.getElementById("start-button")?.addEventListener("click", () => {
  if (isHost) {
    startGame();
  } else {
    log("Only the host can start the game.");
  }
});
