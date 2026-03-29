/**
 * Core type definitions for the feature flag SDK.
 *
 * Flags support boolean toggles, string/number variants, percentage rollouts,
 * and user-targeting rules â all fully typed.
 */

// ââ Flag value types âââââââââââââââââââââââââââââââââââââââââââ

export type FlagValue = boolean | string | number;

// ââ Targeting âââââââââââââââââââââââââââââââââââââââââââââââââââ

export type Operator =
  | "eq"
  | "neq"
  | "in"
  | "not_in"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "starts_with"
  | "ends_with";

export interface TargetingCondition {
  attribute: string;
  operator: Operator;
  value: string | number | boolean | (string | number | boolean)[];
}

export interface TargetingRule {
  /** All conditions must match (AND logic). */
  conditions: TargetingCondition[];
  /** Value to return when this rule matches. */
  value: FlagValue;
}

// ââ Rollout ââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface PercentageRollout {
  /** Percentage of users who see the "on" value (0â100). */
  percentage: number;
  /** Value returned for users inside the rollout. */
  valueOn: FlagValue;
  /** Value returned for users outside the rollout. */
  valueOff: FlagValue;
  /** Attribute used as the hash key (default: "id"). */
  hashKey?: string;
}

// ââ Flag definition ââââââââââââââââââââââââââââââââââââââââââââ

export interface FlagDefinition {
  key: string;
  /** Human-readable description. */
  description?: string;
  /** Whether the flag is active at all. */
  enabled: boolean;
  /** Default value when no rules or rollout match. */
  defaultValue: FlagValue;
  /** Ordered targeting rules â first match wins. */
  rules?: TargetingRule[];
  /** Percentage-based rollout (evaluated after rules). */
  rollout?: PercentageRollout;
  /** Arbitrary metadata (owner, ticket, etc.). */
  tags?: Record<string, string>;
}

// ââ Evaluation context âââââââââââââââââââââââââââââââââââââââââ

export interface EvaluationContext {
  /** Unique user/entity identifier used for rollout hashing. */
  id?: string;
  /** Arbitrary attributes for rule targeting. */
  Jcey: string]: string | number | boolean | undefined;
}

// ââ Evaluation result ââââââââââââââââââââââââââââââââââââââââââ

export interface EvaluationResult<T extends FlagValue = FlagValue> {
  flagKey: string;
  value: T;
  /** Why this value was chosen. */
  reason: "disabled" | "default" | "rule_match" | "rollout" | "not_found";
  /** Index of the matched rule, if any. */
  ruleIndex?: number;
}

// ââ Event hooks ââââââââââââââââââââââââââââââââââââââââââââââââ

export type FlagChangeListener = (
  flagKey: string,
  oldValue: FlagValue | undefined,
  newValue: FlagValue | undefined
) => void;

// ââ Store interface ââââââââââââââââââââââââââââââââââââââââââââ

export interface FlagStore {
  get(key: string): FlagDefinition | undefined;
  getAll(): FlagDefinition[];
  set(flag: FlagDefinition): void;
  delete(key: string): boolean;
  has(key: string): boolean;
}
