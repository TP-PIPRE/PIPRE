const STORAGE_PREFIX = "pipre_";

export class LocalStorageRepository {
  protected get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  protected set<T>(key: string, value: T): void {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  }

  protected remove(key: string): void {
    localStorage.removeItem(STORAGE_PREFIX + key);
  }
}
