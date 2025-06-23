// Play Puck App Logic

let deck = [];
let discardPile = [];
let playerHand = [];
let opponentHand = [];

// Load card data from JSON
fetch('cards.json')
  .then(res => res.json())
  .then(data => {
    deck = shuffle([...data]);
    playerHand = deck.splice(0, 3);
    opponentHand = deck.splice(0, 3);
    renderHand('player-hand', playerHand);
    // opponent-hand remains hidden
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
  const card = playerHand.splice(index, 1)[0];
  discardPile.push(card);
  log(`Played: ${card.name} — ${card.effect}`);
  renderHand('player-hand', playerHand);
  drawCard();
}

function drawCard() {
  if (deck.length === 0) {
    deck = shuffle([...discardPile]);
    discardPile = [];
    log('Deck reshuffled.');
  }
  if (deck.length > 0) {
    playerHand.push(deck.shift());
    renderHand('player-hand', playerHand);
  }
}

function log(message) {
  const logEl = document.getElementById('log');
  const entry = document.createElement('div');
  entry.textContent = message;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

// Hook up draw button
document.getElementById('draw-button').addEventListener('click', drawCard);
