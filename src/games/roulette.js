const NUMBERS = Array.from({ length: 37 }, (_, i) => i);

function spinWheel() {
  return NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
}

function isRed(n) {
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return reds.includes(n);
}

function isBlack(n) {
  if (n === 0) return false;
  return !isRed(n);
}

export function playRoulette(betAmount, bets) {
  const result = spinWheel();
  const color = result === 0 ? 'green' : isRed(result) ? 'red' : 'black';
  let totalPayout = 0;
  const results = [];

  for (const bet of bets) {
    let multiplier = 0;
    if (bet.type === 'number' && bet.value === result) multiplier = 35;
    else if (bet.type === 'red' && color === 'red') multiplier = 2;
    else if (bet.type === 'black' && color === 'black') multiplier = 2;
    else if (bet.type === 'even' && result !== 0 && result % 2 === 0) multiplier = 2;
    else if (bet.type === 'odd' && result % 2 === 1) multiplier = 2;
    else if (bet.type === 'low' && result >= 1 && result <= 18) multiplier = 2;
    else if (bet.type === 'high' && result >= 19 && result <= 36) multiplier = 2;
    else if (bet.type === 'dozen1' && result >= 1 && result <= 12) multiplier = 3;
    else if (bet.type === 'dozen2' && result >= 13 && result <= 24) multiplier = 3;
    else if (bet.type === 'dozen3' && result >= 25 && result <= 36) multiplier = 3;

    const payout = (bet.amount || betAmount) * multiplier;
    totalPayout += payout;
    results.push({ ...bet, multiplier, payout: Math.round(payout * 100) / 100, win: multiplier > 0 });
  }

  return {
    result,
    color,
    results,
    totalPayout: Math.round(totalPayout * 100) / 100,
  };
}
