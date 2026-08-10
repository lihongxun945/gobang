import gomocup2026 from './sources/gomocup-2026-15x15.json';
import rapfiNatural from './sources/rapfi-natural-freestyle-15x15.json';
import rapfiVerified from './sources/rapfi-verified-freestyle-15x15.json';
import { normalizeOpeningSource } from './source';

export const balancedOpeningBookSources = [normalizeOpeningSource(gomocup2026)];
export const strengthOpeningBookSources = [
  normalizeOpeningSource(rapfiNatural),
  normalizeOpeningSource(rapfiVerified),
];

export const openingBookSourcesByMode = {
  balanced: balancedOpeningBookSources,
  strength: strengthOpeningBookSources,
};

export const openingBookSources = strengthOpeningBookSources;

export { gomocup2026, rapfiNatural, rapfiVerified };
