/**
 * In-memory flag store with change notification.
 *
 * Keeps all flag definitions in a Map keyed by flag key.
 * Fires change listeners whenever a flag is added, updated, or deleted.
 */

import type { FlagDefinition, FlagStore, FlagChangeListener, FlagValue } from "./types";

export class InMemoryStore implements FlagStore {
  private flags = new Map<string, FlagDefinition>();
  private listeners: FlagChangeListener[] = [];

  // ââ CRUD âââââââââââââââââââââââââââââââââââââââââââââââââââ

  get(key: string): FlagDefinition | undefined {
    return this.flags.get(key);
  }

  getAll(): FlagDefinition[] {
    return Array.from(this.flags.values());
  }

  set(flag: FlagDefinition): void {
    const old = this.flags.get(flag.key);
    this.flags.set(flag.key, flag);
    this.notify(flag.key, old?.defaultValue, flag.defaultValue);
  }

  delete(key: string): boolean {
    const old = this.flags.get(key);
    const deleted = this.flags.delete(key);
    if (deleted) {
      this.notify(key, old?.defaultValue, undefined);
    }
    return deleted;
  }

  has(key: string): boolean {
    return this.flags.has(key);
  }

  // ââ Bulk operations ââââââââââââââââââââââââââââââââââââââââ

  /**
   * Replace all flags at once (useful for initial load or sync).
   * Fires change events for every flag that differs.
   */
  setAll(flags: FlagDefinition[]): void {
    const oldKeys = new Set(this.flags.keys());
    const newMap = new Map<string, FlagDefinition>();

    for (const flag of flags) {
      newMap.set(flag.key, flag);
      const old = this.flags.get(flag.key);
      if (!old || old.defaultValue !== flag.defaultValue || old.enabled !== flag.enabled) {
        this.notify(flag.key, old?.defaultValue, flag.defaultValue);
      }
      oldKeys.delete(flag.key);
    }

    // Flags that were removed
    for (const removedKey of oldKeys) {
      const old = this.flags.get(removedKey);
      this.notify(removedKey, old?.defaultValue, undefined);
    }

    this.flags = newMap;
  }

  // ââ Listeners ââââââââââââââââââââââââââââââââââââââââââââââ

  onChange(listener: FlagChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(
    key: string,
    oldValue: FlagValue | undefined,
    newValue: FlagValue | undefined
  ): void {
    for (const listener of this.listeners) {
      try {
        listener(key, oldValue, newValue);
      } catch {
        // Listener errors must not break the store
      }
    }
  }
}
