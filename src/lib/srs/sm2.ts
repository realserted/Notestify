/**
 * SM-2 Spaced Repetition Algorithm
 * Quality scale:
 *   0 = complete blackout
 *   1 = incorrect; correct one remembered
 *   2 = incorrect; correct one seemed easy
 *   3 = correct; serious difficulty
 *   4 = correct; some hesitation
 *   5 = perfect recall
 */

export interface SRSState {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
}

export interface SRSResult extends SRSState {
  due_date: Date;
}

const MIN_EASE = 1.3;

export const calculateNextReview = (state: SRSState, quality: number): SRSResult => {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  let { ease_factor, interval_days, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval_days = 1;
    else if (repetitions === 2) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
  }

  ease_factor = Math.max(
    MIN_EASE,
    ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const due_date = new Date();
  due_date.setDate(due_date.getDate() + interval_days);

  return {
    ease_factor: Number(ease_factor.toFixed(2)),
    interval_days,
    repetitions,
    due_date,
  };
};
