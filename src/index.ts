/**
 * feature-flags â lightweight, type-safe feature flag SDK for TypeScript.
 *
 * @example
 * ```ts
 * import { FeatureFlagClient } from "feature-flags";
 *
 * const ff = new FeatureFlagClient({
 *   flags: [
 *     { key: "dark-mode", enabled: true, defaultValue: false,
 *       rollout: { percentage: 50, valueOn: true, valueOff: false } },
 *   ],
 * });
 *
 * if (ff.isEnabled("dark-mode", { id: "user-123" })) {
 *   enableDarkMode();
 * }
 * ```
 */

export { FeatureFlagClient } from "./client";
export type { FeatureFlagClientOptions } from "./client";
export { InMemoryStore } from "./store";
export { evaluate } from "./evaluator";
export { hashToBucket } from "./hash";
export type {
  FlagValue,
  Operator,
  TargetingCondition,
  TargetingRule,
  PercentageRollout,
  FlagDefinition,
  EvaluationContext,
  EvaluationResult,
  FlagChangeListener,
  FlagStore,
} from "./types";
