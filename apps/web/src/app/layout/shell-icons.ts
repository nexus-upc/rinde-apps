/** Trazos de 24 px de los íconos del marco; se dibujan con stroke, sin relleno. */
export const SHELL_ICONS = {
  home: 'M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  trips:
    'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16',
  expenses: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  fleet:
    'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  settlements: 'M7 3h8l4 4v14H7zM15 3v4h4M10 14l2 2 4-4',
  incidents: 'M12 4 2.5 20h19zM12 10v4M12 17v.01',
  users:
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-5-6.7',
  subscription: 'M3 6h18v12H3zM3 10h18M7 15h4',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17v.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.01',
  signOut: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
  palette:
    'M12 3a9 9 0 1 0 9 9c0-1.1-.9-2-2-2h-2.5a2 2 0 0 1-1.4-3.4A2 2 0 0 0 13.6 3H12zM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01',
  company: 'M4 21V7l8-4 8 4v14M9 21v-5h6v5M8 10h.01M12 10h.01M16 10h.01',
  close: 'M6 6l12 12M18 6 6 18',
  chevronsUpDown: 'm8 9 4-4 4 4M8 15l4 4 4-4',
  chevronUp: 'm8 15 4-4 4 4',
} as const;

export type ShellIcon = keyof typeof SHELL_ICONS;

/** Iniciales para el disco del usuario: dos letras del nombre o la primera del correo. */
export function initialsOf(name: string | undefined, email: string | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length)
    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  return (email ?? '?').charAt(0).toUpperCase();
}
