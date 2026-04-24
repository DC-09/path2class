/**
 * Tiny typed localStorage wrapper. Each key is namespaced `p2c.*` and
 * read/writes silently no-op when storage is unavailable (private mode
 * on some browsers, SSR, etc.).
 */
import type { Language } from '../stores/useSessionStore';

export interface RecentDestination {
  nodeId: string;
  label: string;
  meta: string;
  visitedAt: number;
}

const KEY = {
  LANG: 'p2c.lang',
  A11Y: 'p2c.a11y',
  RECENT: 'p2c.recent',
} as const;

const MAX_RECENTS = 5;
const LANGUAGES: readonly Language[] = ['it', 'en', 'pt'] as const;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore — QuotaExceeded / SecurityError on private mode */
  }
}

export const storageService = {
  getLanguage(): Language | null {
    const raw = safeGet(KEY.LANG);
    return LANGUAGES.includes(raw as Language) ? (raw as Language) : null;
  },
  setLanguage(lang: Language): void {
    safeSet(KEY.LANG, lang);
  },

  getAccessibility(): boolean {
    return safeGet(KEY.A11Y) === '1';
  },
  setAccessibility(value: boolean): void {
    safeSet(KEY.A11Y, value ? '1' : '0');
  },

  getRecents(): RecentDestination[] {
    const raw = safeGet(KEY.RECENT);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(isRecentDestination)
        .slice(0, MAX_RECENTS);
    } catch {
      return [];
    }
  },
  /** Prepend a destination, dedupe by nodeId, cap at MAX_RECENTS. */
  pushRecent(entry: Omit<RecentDestination, 'visitedAt'>): RecentDestination[] {
    const current = storageService.getRecents();
    const next: RecentDestination[] = [
      { ...entry, visitedAt: Date.now() },
      ...current.filter((r) => r.nodeId !== entry.nodeId),
    ].slice(0, MAX_RECENTS);
    safeSet(KEY.RECENT, JSON.stringify(next));
    return next;
  },
};

function isRecentDestination(value: unknown): value is RecentDestination {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.nodeId === 'string' &&
    typeof v.label === 'string' &&
    typeof v.meta === 'string' &&
    typeof v.visitedAt === 'number'
  );
}
