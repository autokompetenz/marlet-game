const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ suit, rank });
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(rank) {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank);
}

function handValue(hand) {
  let value = hand.reduce((sum, c) => sum + cardValue(c.rank), 0);
  let aces = hand.filter(c => c.rank === 'A').length;
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return value;
}

export function playBlackjack(betAmount) {
  const deck = shuffle(createDeck());
  const player = [deck.pop(), deck.pop()];
  const dealer = [deck.pop(), deck.pop()];

  const pScore = handValue(player);
  const dScore = handValue(dealer);

  let result, multiplier;

  if (pScore === 21 && dScore === 21) {
    result = 'push';
    multiplier = 1;
  } else if (pScore === 21) {
    result = 'blackjack';
    multiplier = 2.5;
  } else if (dScore === 21) {
    result = 'lose';
    multiplier = 0;
  } else {
    const dealerCards = [...dealer];
    while (handValue(dealerCards) < 17) dealerCards.push(deck.pop());
    const finalDealer = handValue(dealerCards);
    const finalPlayer = handValue(player);

    if (finalPlayer > 21) { result = 'bust'; multiplier = 0; }
    else if (finalDealer > 21) { result = 'win'; multiplier = 2; }
    else if (finalPlayer > finalDealer) { result = 'win'; multiplier = 2; }
    else if (finalPlayer < finalDealer) { result = 'lose'; multiplier = 0; }
    else { result = 'push'; multiplier = 1; }

    dealer.push(...dealerCards.slice(2));
  }

  const payout = betAmount * multiplier;
  return {
    player: player.map(c => `${c.rank}${c.suit}`),
    dealer: dealer.map(c => `${c.rank}${c.suit}`),
    playerScore: handValue(player),
    result,
    multiplier,
    payout: Math.round(payout * 100) / 100,
    win: multiplier >= 1,
  };
}
