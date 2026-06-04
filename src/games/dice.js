export function playDice(betAmount) {
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const sum = dice1 + dice2;
  const total = dice1 + dice2;

  let multiplier = 0;
  if (total === 2 || total === 12) multiplier = 10;
  else if (total === 3 || total === 11) multiplier = 5;
  else if (total === 4 || total === 10) multiplier = 3;
  else if (total === 5 || total === 9) multiplier = 2;
  else if (total === 6 || total === 8) multiplier = 1.5;
  else if (total === 7) multiplier = 1.2;

  const payout = betAmount * multiplier;
  return {
    dice: [dice1, dice2],
    sum,
    multiplier,
    payout: Math.round(payout * 100) / 100,
    win: multiplier >= 1,
  };
}

export function playDicePrediction(betAmount, prediction) {
  const result = playDice(betAmount);
  let multiplier = 0;
  if (prediction === 'under7' && result.sum < 7) multiplier = 2;
  else if (prediction === 'over7' && result.sum > 7) multiplier = 2;
  else if (prediction === 'exact7' && result.sum === 7) multiplier = 5;
  else if (prediction === 'double' && result.dice[0] === result.dice[1]) multiplier = 8;

  const payout = betAmount * multiplier;
  return {
    ...result,
    prediction,
    multiplier,
    payout: Math.round(payout * 100) / 100,
    win: multiplier > 0,
  };
}
