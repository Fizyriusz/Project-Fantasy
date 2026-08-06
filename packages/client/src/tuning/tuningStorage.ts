import { DEFAULT_TUNING, type TuningValues } from './tuningValues';

const ENDPOINT = '/__tuning';

/** Enough to stop a slider drag writing the file sixty times a second. */
const SAVE_DELAY_MS = 200;

/**
 * What actually lands on disk. Every entry carries the value in force *and*
 * the value it started as, so reading the file answers "what did you change,
 * and from what" without anyone having to remember.
 */
interface StoredEntry {
  readonly teraz: number | boolean;
  readonly domyslnie: number | boolean;
}

interface StoredFile {
  readonly zapisano: string;
  readonly wartosci: Record<string, StoredEntry>;
}

function isTuningKey(key: string): key is keyof TuningValues {
  return key in DEFAULT_TUNING;
}

/**
 * Reads back whatever was left on disk, so a page reload does not throw away
 * a session of careful adjustment. Anything missing or malformed falls back to
 * the default rather than failing.
 */
export async function loadTuning(): Promise<TuningValues> {
  const values: TuningValues = { ...DEFAULT_TUNING };

  try {
    const response = await fetch(ENDPOINT);
    if (!response.ok) {
      return values;
    }

    const stored = (await response.json()) as Partial<StoredFile>;
    for (const [key, entry] of Object.entries(stored.wartosci ?? {})) {
      if (!isTuningKey(key)) {
        continue;
      }
      if (key === 'interpolation') {
        if (typeof entry.teraz === 'boolean') {
          values.interpolation = entry.teraz;
        }
      } else if (typeof entry.teraz === 'number') {
        values[key] = entry.teraz;
      }
    }
  } catch {
    // No dev server, or it does not speak this. Defaults are a fine answer.
  }

  return values;
}

export function createTuningSaver(): (values: TuningValues) => void {
  let pending: ReturnType<typeof setTimeout> | undefined;

  return (values: TuningValues) => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      const wartosci: Record<string, StoredEntry> = {};
      for (const key of Object.keys(DEFAULT_TUNING)) {
        if (isTuningKey(key)) {
          wartosci[key] = { teraz: values[key], domyslnie: DEFAULT_TUNING[key] };
        }
      }

      const file: StoredFile = { zapisano: new Date().toISOString(), wartosci };

      void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file, null, 2),
      }).catch(() => {
        // Saving is a convenience; losing it must never interrupt playing.
      });
    }, SAVE_DELAY_MS);
  };
}
