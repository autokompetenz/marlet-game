const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐'];
const PAYTABLE = {
  '🍒🍒🍒': 3, '🍋🍋🍋': 4, '🍊🍊🍊': 5,
  '🍇🍇🍇': 8, '💎💎💎': 15, '7️⃣7️⃣7️⃣': 50, '⭐⭐⭐': 100,
  '🍒🍒': 1.5, '🍋🍋': 2, '🍊🍊': 2, '🍇🍇': 3, '💎💎': 5, '7️⃣7️⃣': 10, '⭐⭐': 20,
};

function spin() {
  return [
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
  ];
}

function calcMultiplier(reels) {
  const key = reels.join('');
  if (PAYTABLE[key]) return PAYTABLE[key];
  const firstTwo = reels.slice(0, 2).join('');
  if (PAYTABLE[firstTwo]) return PAYTABLE[firstTwo];
  return 0;
}

export function playSlots(betAmount) {
  const reels = spin();
  const multiplier = calcMultiplier(reels);
  const payout = betAmount * multiplier;
  return {
    reels,
    multiplier,
    payout: Math.round(payout * 100) / 100,
    win: multiplier > 0,
  };
}
