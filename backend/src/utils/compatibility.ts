import { IUser, ILifestyle } from '../models/User';
import { IMatchFactor } from '../models/MatchRequest';

export interface CompatibilityResult {
  score: number;
  factors: IMatchFactor[];
  sharedInterests: string[];
}

const LIFESTYLE_LABELS: Record<string, string> = {
  early_bird: 'Early bird (up by 6am)',
  flexible: 'Flexible schedule',
  night_owl: 'Night owl (sleeps after 1am)',
  very_tidy: 'Very tidy, cleans daily',
  tidy: 'Tidy, weekly deep clean',
  relaxed: 'Relaxed about mess',
  homebody: 'Homebody',
  balanced: 'Balanced social life',
  very_social: 'Very social, loves hosting',
  vegetarian: 'Vegetarian kitchen',
  eggetarian: 'Eggetarian',
  non_vegetarian: 'Non-vegetarian',
  jain: 'Jain food',
  no: 'Non-smoker',
  occasionally: 'Smokes occasionally',
  yes: 'Smoker',
  rarely: 'Guests rarely',
  sometimes: 'Guests sometimes',
  often: 'Guests often',
  headphones: 'Headphones mostly',
  low_speaker: 'Low speaker volume',
  loud: 'Loud music',
  gym_daily: 'Gym every morning',
  not_really: 'Not into fitness',
  true: 'Yes',
  false: 'No',
};

function formatLabel(val: unknown): string {
  const str = String(val);
  return LIFESTYLE_LABELS[str] || str;
}

/**
 * Calculates a deterministic compatibility score and 6 factor breakdowns
 * between two users based on their existing profile & lifestyle fields.
 */
export function calcCompatibility(userA: IUser, userB: IUser): CompatibilityResult {
  const lifeA: Partial<ILifestyle> = userA.lifestyle || {};
  const lifeB: Partial<ILifestyle> = userB.lifestyle || {};

  // ── 1. Sleep Schedule ─────────────────────────────────────────────────────
  // exact: 96, otherwise: 80, opposite (early_bird vs night_owl): 62
  let sleepScore = 80;
  let sleepNote = 'Compatible sleep rhythms with slight offset.';
  if (lifeA.sleep === lifeB.sleep) {
    sleepScore = 96;
    sleepNote = 'You keep the same hours, so late-night trips will not disturb anyone.';
  } else if (
    (lifeA.sleep === 'early_bird' && lifeB.sleep === 'night_owl') ||
    (lifeA.sleep === 'night_owl' && lifeB.sleep === 'early_bird')
  ) {
    sleepScore = 62;
    sleepNote = 'Different hours — worth agreeing on quiet times after 11pm.';
  }

  const sleepFactor: IMatchFactor = {
    label: 'Sleep schedule',
    score: sleepScore,
    you: formatLabel(lifeA.sleep),
    them: formatLabel(lifeB.sleep),
    note: sleepNote,
  };

  // ── 2. Cleanliness ────────────────────────────────────────────────────────
  // exact: 94, otherwise compatible: 78, clash (very_tidy vs relaxed): 60
  let cleanScore = 78;
  let cleanNote = 'Reasonably compatible cleaning expectations.';
  if (lifeA.cleanliness === lifeB.cleanliness) {
    cleanScore = 94;
    cleanNote = 'Same standard for common areas, so chores rarely become an argument.';
  } else if (
    (lifeA.cleanliness === 'very_tidy' && lifeB.cleanliness === 'relaxed') ||
    (lifeA.cleanliness === 'relaxed' && lifeB.cleanliness === 'very_tidy')
  ) {
    cleanScore = 60;
    cleanNote = 'Slightly different standards — a written chore rota helps here.';
  }

  const cleanFactor: IMatchFactor = {
    label: 'Cleanliness',
    score: cleanScore,
    you: formatLabel(lifeA.cleanliness),
    them: formatLabel(lifeB.cleanliness),
    note: cleanNote,
  };

  // ── 3. Food & Kitchen ─────────────────────────────────────────────────────
  // exact: 92, compatible: 80, restriction clash (jain/veg vs non_veg): 65
  let foodScore = 80;
  let foodNote = 'Compatible kitchen setups with shared or separate storage.';
  if (lifeA.food === lifeB.food) {
    foodScore = 92;
    foodNote = 'Same kitchen preference, so shared groceries and utensils are simple.';
  } else if (
    (lifeA.food === 'jain' && lifeB.food === 'non_vegetarian') ||
    (lifeA.food === 'non_vegetarian' && lifeB.food === 'jain')
  ) {
    foodScore = 65;
    foodNote = 'Different dietary habits — separate cookware and shelf segregation recommended.';
  }

  const foodFactor: IMatchFactor = {
    label: 'Food & kitchen',
    score: foodScore,
    you: formatLabel(lifeA.food),
    them: formatLabel(lifeB.food),
    note: foodNote,
  };

  // ── 4. Social Energy (social + guests) ────────────────────────────────────
  // aligned: 90, compatible: 76, clash: 62
  const sameSocial = lifeA.social === lifeB.social;
  const sameGuests = lifeA.guests === lifeB.guests;
  let socialScore = 76;
  let socialNote = 'Balanced social dynamics with manageable guest preferences.';
  if (sameSocial && sameGuests) {
    socialScore = 90;
    socialNote = 'Similar appetite for house dinners, quiet weekends, and guests.';
  } else if (
    (lifeA.social === 'homebody' && lifeB.social === 'very_social') ||
    (lifeA.social === 'very_social' && lifeB.social === 'homebody') ||
    (lifeA.guests === 'rarely' && lifeB.guests === 'often') ||
    (lifeA.guests === 'often' && lifeB.guests === 'rarely')
  ) {
    socialScore = 62;
    socialNote = 'One of you hosts more — agree on notice before guests arrive.';
  }

  const socialFactor: IMatchFactor = {
    label: 'Social energy',
    score: socialScore,
    you: `${formatLabel(lifeA.social)} · guests ${formatLabel(lifeA.guests)}`,
    them: `${formatLabel(lifeB.social)} · guests ${formatLabel(lifeB.guests)}`,
    note: socialNote,
  };

  // ── 5. Habits & Pets (smoking + pets) ─────────────────────────────────────
  // both align: 88, one clash: 70, both clash: 55
  const sameSmoking = lifeA.smoking === lifeB.smoking;
  const samePets = lifeA.pets === lifeB.pets;
  let habitsScore = 70;
  let habitsNote = 'One habit difference — easy to navigate with ground rules.';
  if (sameSmoking && samePets) {
    habitsScore = 88;
    habitsNote = 'Matching habits around smoking and pets inside the flat.';
  } else if (!sameSmoking && !samePets) {
    habitsScore = 55;
    habitsNote = 'Opposite smoking and pet preferences — clear balcony rules needed.';
  }

  const habitsFactor: IMatchFactor = {
    label: 'Habits & pets',
    score: habitsScore,
    you: `${formatLabel(lifeA.smoking)} · pets ${lifeA.pets ? 'yes' : 'no'}`,
    them: `${formatLabel(lifeB.smoking)} · pets ${lifeB.pets ? 'yes' : 'no'}`,
    note: habitsNote,
  };

  // ── 6. Budget & Locality ──────────────────────────────────────────────────
  // diff <= 5k -> high (90), <= 10k -> medium (75), else -> 60. Locality bonus +5
  const budgetA = userA.budget || 20000;
  const budgetB = userB.budget || 20000;
  const budgetDiff = Math.abs(budgetA - budgetB);

  let budgetScore = 60;
  if (budgetDiff <= 5000) {
    budgetScore = 90;
  } else if (budgetDiff <= 10000) {
    budgetScore = 75;
  }

  const localityA = (userA.locality || '').trim().toLowerCase();
  const localityB = (userB.locality || '').trim().toLowerCase();
  const localityMatch = localityA && localityB && (localityA === localityB || localityA.includes(localityB) || localityB.includes(localityA));
  if (localityMatch) {
    budgetScore = Math.min(98, budgetScore + 6);
  }

  const budgetFactor: IMatchFactor = {
    label: 'Budget & locality',
    score: budgetScore,
    you: `₹${budgetA.toLocaleString('en-IN')} · ${userA.locality || userA.city}`,
    them: `₹${budgetB.toLocaleString('en-IN')} · ${userB.locality || userB.city}`,
    note: localityMatch
      ? 'Overlapping budget band and preferred neighbourhood.'
      : 'Comfortable budget range alignment across search localities.',
  };

  // ── Shared Interests ──────────────────────────────────────────────────────
  const interestsA = Array.isArray(userA.interests) ? userA.interests : [];
  const interestsB = Array.isArray(userB.interests) ? userB.interests : [];
  const sharedInterests = interestsA.filter((i) =>
    interestsB.some((j) => j.toLowerCase() === i.toLowerCase())
  );

  // Interest bonus (up to +4 to overall score)
  const interestBonus = Math.min(4, sharedInterests.length * 1.5);

  // Overall Score Calculation (weighted average of the 6 factors + interest bonus)
  const rawScore =
    (sleepFactor.score * 0.18 +
      cleanFactor.score * 0.20 +
      foodFactor.score * 0.16 +
      socialFactor.score * 0.18 +
      habitsFactor.score * 0.14 +
      budgetFactor.score * 0.14) +
    interestBonus;

  const score = Math.min(98, Math.max(50, Math.round(rawScore)));

  return {
    score,
    factors: [
      sleepFactor,
      cleanFactor,
      foodFactor,
      socialFactor,
      habitsFactor,
      budgetFactor,
    ],
    sharedInterests,
  };
}
