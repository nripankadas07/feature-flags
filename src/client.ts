/**
 * Feature flag client â the main entry point for consumers.
 *
 * Wraps a flag store and evaluator into a clean API:
 *
 *   const ff = new FeatureFlagClient();
 *   ff.addFlag({ key: "dark-mode", enabled: true, defaultValue: false });
 *   if (ff.isEnabled("dark-mode", { id: "user-42", plan: "pro" })) { ... }
 */

import type {
  FlagDefinition,
  EvaluationContext,
  EvaluationResult,
  FlagValue,
  FlagChangeListener,
} from "./types";
import { InMemoryStore } from "./store";
import { evaluate } from "./evaluator";

export interface FeatureFlagClientOptions {
  /** Pre-load flags on construction. */
  flags?: FlagDefinition[];
}

export class FeatureFlagClient {
  private store: InMemoryStore;

  constructor(options: FeatureFlagClientOptions = {}) {
    this.store = new InMemoryStore();
    if (options.flags) {
      this.store.setAll(options.flags);
    }
  }

  // ââ Flag management ââââââââââââââââââââââââââââââââââââââââ

  addFlag(flag: FlagDefinition): void {
    this.store.set(flag);
  }

  removeFlag(key: string): boolean {
    return this.store.delete(key);
  }

  getFlag(key: string): FlagDefinition | undefined {
    return this.store.get(key);
  }

  getAllFlags(): FlagDefinition[] {
    return this.store.getAll();
  }

  hasFlag(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * Replace all flags at once.
   * Useful for syncing from a remote config service.
   */
  loadFlags(flags: FlagDefinition[]): void {
    this.store.setAll(flags);
  }

  // ââ Evaluation âââââââââââââââââââââââââââââââââââââââââââââ

  /**
   * Evaluate a flag and return the full result with reason.
   */
  evaluate(key: string, context?: EvaluationContext): EvaluationResult {
    const flag = this.store.get(key);
    if (!flag) {
      return {
        flagKey: key,
        value: false,
        reason: "not_found",
      };
    }
    return evaluate(flag, context);
  }

  /**
   * Get the resolved value of a flag.
   */
  getValue<T extends FlagValue = FlagValue>(
    key: string,
    context?: EvaluationContext,
    fallback?: T
  ): T {
    const flag = this.store.get(key);
    if (!flag) return (fallback ?? false) as T;
    return evaluate(flag, context).value as T;
  }

  /**
   * Shorthand for boolean flags.
   */
  isEnabled(key: string, context?: EvaluationContext): boolean {
    return this.getValue<boolean>(key, context, false);
  }

  /**
   * Get the string variant of a flag.
   */
  getVariant(
    key: string,
    context?: EvaluationContext,
    fallback: string = ""
  ): string {
    return this.getValue<string>(key, context, fallback);
  }

  // ââ Events âââââââââââââââââââââââââââââââââââââââââââââââââ

  /**
   * Subscribe to flag changes. Returns an unsubscribe function.
   */
  onChange(listener: FlagChangeListener): () => void {
    return this.store.onChange(listener);
  }
}
