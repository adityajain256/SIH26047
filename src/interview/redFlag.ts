export type RedFlag = { severity: "critical"; message: string };

const patterns = [
  /difficulty breathing|shortness of breath|cannot breathe|can't breathe|saans.*(nahi|problem|takleef)/i,
  /severe chest pain|unconscious|heavy bleeding|stroke symptoms/i,
];

export function detectRedFlag(answer: string): RedFlag | null {
  return patterns.some((pattern) => pattern.test(answer))
    ? { severity: "critical", message: "Possible emergency symptom reported. Please alert clinical staff immediately." }
    : null;
}
