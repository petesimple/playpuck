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

    if (playerScore >= 7 || opponentScore >= 7) {
      log(`Game Over — ${playerScore >= 7 ? "You Win!" : "Opponent Wins!"}`);
      currentPlayer = null;
      return;
    }

    switchTurn(true); // goal scored = give puck to opponent
  } else {
    log("No goal. Turn passes.");
    switchTurn();
  }
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
