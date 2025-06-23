// Play Puck App Logic

let deck = [];
let discardPile = [];
let playerHand = [];
let opponentHand = [];
let currentPlayer = "player"; // player starts
let playerScore = 0;
let opponentScore = 0;

// Load card data from JSON
fetch('cards.json')
  .then(res => res.json())
  .then(data => {
    deck = shuffle([...data]);
    playerHand = deck.splice(0, 3);
    opponentHand = deck.splice(0, 3);
    renderHand('player-hand', playerHand);
    // opponent-hand remains hidden
    log("Game start! You go first.");
  });

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
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.textContent = card.name;
    cardEl.onclick = () => playCard(index);
    container.appendChild(cardEl);
  });
}

function playCard(index) {
  if (currentPlayer !== "player") return;

  const card = playerHand.splice(index, 1)[0];
  discardPile.push(card);
  log(`You played: ${card.name} — ${card.effect}`);
  renderHand('player-hand', playerHand);
  const roll = rollDice();
  resolvePlay(card, roll);
}

function drawCard(hand) {
  if (deck.length === 0) {
    deck = shuffle([...discardPile]);
    discardPile = [];
    log('Deck reshuffled.');
  }
  if (deck.length > 0) {
    hand.push(deck.shift());
    if (hand === playerHand) {
      renderHand('player-hand', playerHand);
    }
  }
}

function rollDice() {
  const roll = Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
  document.getElementById('dice-result').textContent = roll;
  return roll;
}

function resolvePlay(card, roll) {
  if (card.base === "miss" || roll > 12) {
    log("Shot went out of bounds!");
    switchTurn();
    return;
  }

  if (roll >= 3) {
    log("GOAL!");
    if (currentPlayer === "player") {
      playerScore++;
      document.getElementById("player-score").textContent = `Score: ${playerScore}`;
    } else {
      opponentScore++;
      document.getElementById("opponent-score").textContent = `Score: ${opponentScore}`;
    }

    // ✅ End game check
    if (playerScore >= 7 || opponentScore >= 7) {
      const winner = playerScore >= 7 ? "🎉 You Win!" : "😵 Opponent Wins!";
      log(`🏁 Game Over — ${winner}`);
      currentPlayer = null;
      disablePlayerControls();

      document.getElementById("restart-button").style.display = "inline-block";
      
      return;
    }

    switchTurn(true); // goal scored = give puck to opponent
  } else {
    log("No goal. Turn passes.");
    switchTurn();
  }
}

function disablePlayerControls() {
  document.getElementById('draw-button').disabled = true;

  const handContainer = document.getElementById('player-hand');
  const cards = handContainer.querySelectorAll('.card');
  cards.forEach(card => {
    card.onclick = null;
    card.style.cursor = "not-allowed";
    card.style.opacity = 0.5;
  });
}

function switchTurn(goalScored = false) {
  currentPlayer = currentPlayer === "player" ? "opponent" : "player";
  log(`Turn: ${currentPlayer.toUpperCase()}`);

  if (currentPlayer === "opponent") {
    setTimeout(opponentTurn, 1000);
  }
}

function opponentTurn() {
  const card = opponentHand.shift();
  discardPile.push(card);
  log(`Opponent played: ${card.name} — ${card.effect}`);
  drawCard(opponentHand);
  const roll = rollDice();
  resolvePlay(card, roll);
}

function log(message) {
  const logEl = document.getElementById('log');
  const entry = document.createElement('div');
  entry.textContent = message;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

document.getElementById('draw-button').addEventListener('click', () => {
  if (currentPlayer === "player") {
    drawCard(playerHand);
  }
});

document.getElementById('restart-button').addEventListener('click', () => {
  // Reset all game state
  playerScore = 0;
  opponentScore = 0;
  deck = [];
  discardPile = [];
  playerHand = [];
  opponentHand = [];
  currentPlayer = "player";

  // Reset UI
  document.getElementById("player-score").textContent = "Score: 0";
  document.getElementById("opponent-score").textContent = "Score: 0";
  document.getElementById("draw-button").disabled = false;
  document.getElementById("log").innerHTML = "";
  document.getElementById("dice-result").textContent = "--";
  document.getElementById("restart-button").style.display = "none";

  // Reload deck and deal new hands
  fetch('cards.json')
    .then(res => res.json())
    .then(data => {
      deck = shuffle([...data]);
      playerHand = deck.splice(0, 3);
      opponentHand = deck.splice(0, 3);
      renderHand('player-hand', playerHand);
      log("New game started! You go first.");
    });
});

