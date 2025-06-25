# 🏒 Play Puck

**Play Puck** is a two-player online card-and-dice game inspired by the strategy and flair of competitive air hockey. Each player takes turns attempting to score goals using action cards, dice rolls, and sneaky maneuvers — while managing a limited hand of powerful shot types.

This app uses **Firebase Realtime Database** for real-time multiplayer support. It's designed to be played in-browser with minimal setup.

---

## 📦 Features

- Real-time 1v1 multiplayer (Firebase)
- Card-based action system
- Dice-based scoring mechanic
- Turn-by-turn puck control
- Compact, arcade-style design
- Local game log + scoring display

---

## 🎮 How to Play

### 🎯 Objective

Be the first to score **7 goals** by playing your best shot cards and executing successful attacks!

---

### 🧠 Setup

1. Two players enter the **same match ID** when prompted.
2. The first player becomes the **host** and can click **Start Game**.
3. Each player is dealt 3 cards from the shared deck.

---

### 🔁 Turn Structure

On your turn:
1. **Play a card** from your hand.
2. The card determines the type of shot or action you attempt.
3. **Roll two 6-sided dice** (automatically done).
4. Based on the roll and card type:
   - Score a goal
   - Miss
   - Trigger a special effect
5. Turn passes to the opponent.

After playing a card, you **automatically draw back up to 3 cards**, if available.

---

### 🎲 Dice Rolls

- Cards resolve based on a dice roll total (2–12).
- Most shots require a roll of **3 or higher** to succeed.
- A roll of **13+ (impossible)** or specific card effects may result in a **miss**.

---

### 🃏 Card Types

Cards are drawn from a shared deck and include:

- **Base Shots**: straight shots, bank shots, etc.
- **Deceptive Plays**: fakes, delays, misdirects
- **Specials**: defensive counters, momentum shifts
- **Wild Cards**: mimic or modify other effects

Each card has a `name`, a `base` type (shot/miss/special), and a description.

---

### ⚠️ Rules

- Max hand size: **3 cards**
- Only **one card** may be played per turn.
- Discarded cards are reshuffled into the deck when it runs out.
- Draws are **automatic** at the start of your turn (up to 3).
- First to **7 goals** wins!

---

## 🚀 How to Run

1. Open `index.html` in a browser or deploy via GitHub Pages.
2. When prompted, **enter a match ID** — share this with your opponent.
3. One player hits **Start Game** once both are connected.
4. Play begins — enjoy the match!

---

## 🛠 Tech Stack

- HTML, CSS, JavaScript
- Firebase Realtime Database
- Firebase Hosting or local dev

---

## 🖼 Logo

A compact logo (`playpucklogo.png`) is used in the board interface.

---

## 📜 License

MIT — Play, fork, remix freely. Just don't blame us if you get wrecked.

---

## 🧼 Cleanup Tip

Old match data remains in Firebase until cleared manually or via TTL (Time-to-Live). You can:
- Use Firebase CLI to configure TTL
- Add an admin cleanup script for inactive matches

---
