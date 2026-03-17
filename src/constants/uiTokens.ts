export const FONT_TOKENS = {
  familyBase: "'Montserrat', 'Noto Sans JP', sans-serif",
  weightThin: 100,
  weightRegular: 400,
} as const;

export const ICON_TOKENS = {
  nodeStateSize: 24,
  nodeStateStroke: 1.8,
  modalStateSize: 20,
  modalStateStroke: 1.8,
  modalClearedStroke: 2,
  modalCloseSize: 16,
  modalCloseStroke: 2,
  modalExternalSize: 14,
  modalExternalStroke: 1.9,
} as const;

export const ICON_COLOR_TOKENS = {
  locked: 'var(--color-accent-red)',
  active: 'var(--color-accent-green)',
  cleared: 'var(--color-accent-yellow)',
} as const;
