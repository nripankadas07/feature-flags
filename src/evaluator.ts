/**
 * Flag evaluation engine.
 *
 * Given a flag definition and an evaluation context (user attributes),
 * determines the final value by walking through:
 *   1. Enabled check â returns defaultValue if disabled
 *   2. Targeting rules â first matching rule wins
 *   3. Percentage rollout â deterministic hash bucket
 *   4. Default value fallback
 */

import type {
  FlagDefinition,
  EvaluationContext,
  EvaluationResult,
  FlagValue,
  TargetingRule,
  TargetingCondition,
} from "./types";
import { hashToBucket } from "./hash";

// ââ Public API âââââââââââââââââââââââââââââââââââââââââââââââââ

export function evaluate(
  flag: FlagDefinition,
  context: EvaluationContext = {}
): EvaluationResult {
  // 1. Disabled flags always return defaultValue
  if (!flag.enabled) {
    return result(flag.key, flag.defaultValue, "disabled");
  }

  // 2. Walk targeting rules (first match wins)
  if (flag.rules) {
    for (let i = 0; i < flag.rules.length; i++) {
      if (matchesRule(flag.rules[i], context)) {
        return result(flag.key, flag.rules[i].value, "rule_match", i);
      }
    }
  }

  // 3. Percentage rollout
  if (flag.rollout) {
    const hashKey = flag.rollout.hashKey ?? "id";
    const userKey = String(context[hashKey] ?? "");
    if (userKey) {
      const bucket = hashToBucket(flag.key, userKey);
      const value =
        bucket < flag.rollout.percentage
          ? flag.rollout.valueOn
          : flag.rollout.valueOff;
      return result(flag.key, value, "rollout");
    }
  }

  // 4. Default
  return result(flag.key, flag.defaultValue, "default");
}

// ââ Rule matching ââââââââââââââââââââââââââââââââââââââââââââââ

function matchesRule(rule: TargetingRule, ctx: EvaluationContext): boolean {
  return rule.conditions.every((c) => matchesCondition(c, ctx));
}

function matchesCondition(
  cond: TargetingCondition,
  ctx: EvaluationContext
): boolean {
  const actual = ctx[cond.attribute];
  if (actual === undefined) return false;

  const expected = cond.value;

  switch (cond.operator) {
    case "eq":
      return actual === expected;

    case "neq":
      return actual !== expected;

    case "in":
      return Array.isArray(expected) && expected.includes(actual as never);

    case "not_in":
      return Array.isArray(expected) && !expected.includes(actual as never);

    case "gt":
      return typeof actual === "number" && typeof expected === "number" && actual > expected;

    case "gte":
      return typeof actual === "number" && typeof expected === "number" && actual >= expected;

    case "lt":
      return typeof actual === "number" && typeof expected === "number" && actual < expected;

    case "lte":
      return typeof actual === "number" && typeof expected === "number" && actual <= expected;

    case "contains":
      return typeof actual === "string" && typeof expected === "string" && actual.includes(expected);

    case "starts_with":
      return (
        typeof actual === "string" &&
        typeof expected === "string" &&
        actual.startsWith(expected)
      );

    case "ends_with":
      return (
        typeof actual === "string" &&
        typeof expected === "string" &&
        actual.endsWith(expected)
      );

    default:
      return false;
  }
}

// ââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââ

function result(
  flagKey: string,
  value: FlagValue,
  reason: EvaluationResult["reason"],
  ruleIndex?: number
): EvaluationResult {
  const r: EvaluationResult = { flagKey, value, reason };
  if (ruleIndex !== undefined) r.ruleIndex = ruleIndex;
  return r;
}
