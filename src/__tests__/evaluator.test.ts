import { evaluate } from "../evaluator";
import type { FlagDefinition, EvaluationContext } from "../types";

// ââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââ

function flag(overrides: Partial<FlagDefinition> = {}): FlagDefinition {
  return {
    key: "test-flag",
    enabled: true,
    defaultValue: false,
    ...overrides,
  };
}

// ââ Tests ââââââââââââââââââââââââââââââââââââââââââââââââââââ

describe("evaluate", () => {
  describe("disabled flags", () => {
    it("returns defaultValue with reason=disabled", () => {
      const f = flag({ enabled: false, defaultValue: "off" });
      const result = evaluate(f);
      expect(result.value).toBe("off");
      expect(result.reason).toBe("disabled");
    });

    it("ignores rules when disabled", () => {
      const f = flag({
        enabled: false,
        defaultValue: false,
        rules: [
          {
            conditions: [{ attribute: "plan", operator: "eq", value: "pro" }],
            value: true,
          },
        ],
      });
      const result = evaluate(f, { plan: "pro" });
      expect(result.value).toBe(false);
      expect(result.reason).toBe("disabled");
    });
  });

  describe("targeting rules", () => {
    it("matches eq operator", () => {
      const f = flag({
        rules: [
          {
            conditions: [{ attribute: "plan", operator: "eq", value: "pro" }],
            value: true,
          },
        ],
      });
      expect(evaluate(f, { plan: "pro" }).value).toBe(true);
      expect(evaluate(f, { plan: "free" }).value).toBe(false);
    });

    it("matches neq operator", () => {
      const f = flag({
        rules: [
          {
            conditions: [{ attribute: "role", operator: "neq", value: "admin" }],
            value: true,
          },
        ],
      });
      expect(evaluate(f, { role: "user" }).value).toBe(true);
      expect(evaluate(f, { role: "admin" }).value).toBe(false);
    });

    it("matches in operator", () => {
      const f = flag({
        rules: [
          {
            conditions: [
              { attribute: "country", operator: "in", value: ["US", "CA", "UK"] },
            ],
            value: true,
          },
        ],
      });
      expect(evaluate(f, { country: "US" }).value).toBe(true);
      expect(evaluate(f, { country: "JP" }).value).toBe(false);
    });

    it("matches not_in operator", () => {
      const f = flag({
        rules: [
          {
            conditions: [
              { attribute: "country", operator: "not_in", value: ["CN", "RU"] },
            ],
            value: true,
          },
        ],
      });
      expect(evaluate(f, { country: "US" }).value).toBe(true);
      expect(evaluate(f, { country: "CN" }).value).toBe(false);
    });

    it("matches numeric operators", () => {
      const f = flag({
        rules: [
          {
            conditions: [{ attribute: "age", operator: "gte", value: 18 }],
            value: "adult",
          },
        ],
        defaultValue: "minor",
      });
      expect(evaluate(f, { age: 21 }).value).toBe("adult");
      expect(evaluate(f, { age: 15 }).value).toBe("minor");
    });

    it("matches gt and lt operators", () => {
      const f = flag({
        rules: [
          {
            conditions: [
              { attribute: "score", operator: "gt", value: 90 },
            ],
            value: "excellent",
          },
          {
            conditions: [
              { attribute: "score", operator: "lt", value: 50 },
            ],
            value: "poor",
          },
        ],
        defaultValue: "average",
      });
      expect(evaluate(f, { score: 95 }).value).toBe("excellent");
      expect(evaluate(f, { score: 30 }).value).toBe("poor");
      expect(evaluate(f, { score: 70 }).value).toBe("average");
    });

    it("matches string operators", () => {
      const f = flag({
        rules: [
          {
            conditions: [
              { attribute: "email", operator: "ends_with", value: "@company.com" },
            ],
            value: true,
          },
        ],
      });
      expect(evaluate(f, { email: "alice@company.com" }).value).toBe(true);
      expect(evaluate(f, { email: "bob@gmail.com" }).value).toBe(false);
    });

    it("matches contains operator", () => {
      const f = flag({
        rules: [
          {
            conditions: [
              { attribute: "name", operator: "contains", value: "admin" },
            ],
            value: true,
          },
        ],
      });
      expect(evaluate(f, { name: "super-admin-1" }).value).toBe(true);
      expect(evaluate(f, { name: "regular-user" }).value).toBe(false);
    });

    it("matches starts_with operator", () => {
      const f = flag({
        rules: [
          {
            conditions: [
              { attribute: "path", operator: "starts_with", value: "/api/" },
            ],
            value: true,
          },
        ],
      });
      expect(evaluate(f, { path: "/api/users" }).value).toBe(true);
      expect(evaluate(f, { path: "/web/home" }).value).toBe(false);
    });

    it("uses first matching rule (priority order)", () => {
      const f = flag({
        rules: [
          {
            conditions: [{ attribute: "plan", operator: "eq", value: "enterprise" }],
            value: "vip",
          },
          {
            conditions: [{ attribute: "plan", operator: "eq", value: "pro" }],
            value: "premium",
          },
        ],
        defaultValue: "basic",
      });
      const result = evaluate(f, { plan: "enterprise" });
      expect(result.value).toBe("vip");
      expect(result.ruleIndex).toBe(0);
    });

    it("requires all conditions to match (AND logic)", () => {
      const f = flag({
        rules: [
          {
            conditions: [
              { attribute: "plan", operator: "eq", value: "pro" },
              { attribute: "country", operator: "eq", value: "US" },
            ],
            value: true,
          },
        ],
      });
      expect(evaluate(f, { plan: "pro", country: "US" }).value).toBe(true);
      expect(evaluate(f, { plan: "pro", country: "UK" }).value).toBe(false);
    });

    it("returns false for missing attributes", () => {
      const f = flag({
        rules: [
          {
            conditions: [{ attribute: "plan", operator: "eq", value: "pro" }],
            value: true,
          },
        ],
      });
      expect(evaluate(f, {}).value).toBe(false);
    });
  });

  describe("percentage rollout", () => {
    it("assigns users deterministically", () => {
      const f = flag({
        rollout: {
          percentage: 50,
          valueOn: true,
          valueOff: false,
        },
      });
      const result1 = evaluate(f, { id: "user-1" });
      const result2 = evaluate(f, { id: "user-1" });
      expect(result1.value).toBe(result2.value);
    });

    it("respects percentage distribution", () => {
      const f = flag({
        rollout: {
          percentage: 50,
          valueOn: true,
          valueOff: false,
        },
      });
      let onCount = 0;
      const n = 1000;
      for (let i = 0; i < n; i++) {
        if (evaluate(f, { id: `user-${i}` }).value === true) {
          onCount++;
        }
      }
      // Should be roughly 50% Â± 10%
      expect(onCount / n).toBeGreaterThan(0.35);
      expect(onCount / n).toBeLessThan(0.65);
    });

    it("returns reason=rollout", () => {
      const f = flag({
        rollout: {
          percentage: 100,
          valueOn: true,
          valueOff: false,
        },
      });
      const result = evaluate(f, { id: "user-1" });
      expect(result.reason).toBe("rollout");
    });

    it("falls back to default when no id present", () => {
      const f = flag({
        rollout: {
          percentage: 50,
          valueOn: true,
          valueOff: false,
        },
      });
      const result = evaluate(f, {});
      expect(result.reason).toBe("default");
    });

    it("supports custom hash key", () => {
      const f = flag({
        rollout: {
          percentage: 100,
          valueOn: true,
          valueOff: false,
          hashKey: "orgId",
        },
      });
      const result = evaluate(f, { orgId: "org-1" });
      expect(result.value).toBe(true);
      expect(result.reason).toBe("rollout");
    });
  });

  describe("evaluation order", () => {
    it("rules take priority over rollout", () => {
      const f = flag({
        rules: [
          {
            conditions: [{ attribute: "beta", operator: "eq", value: true }],
            value: "beta-value",
          },
        ],
        rollout: {
          percentage: 0,
          valueOn: "rollout-on",
          valueOff: "rollout-off",
        },
        defaultValue: "default",
      });
      const result = evaluate(f, { id: "user-1", beta: true });
      expect(result.value).toBe("beta-value");
      expect(result.reason).toBe("rule_match");
    });
  });
});
