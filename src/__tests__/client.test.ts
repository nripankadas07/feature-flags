import { FeatureFlagClient } from "../client";
import type { FlagDefinition } from "../types";

function makeFlag(overrides: Partial<FlagDefinition> = {}): FlagDefinition {
  return {
    key: "test-flag",
    enabled: true,
    defaultValue: false,
    ...overrides,
  };
}

describe("FeatureFlagClient", () => {
  describe("construction", () => {
    it("creates with no options", () => {
      const client = new FeatureFlagClient();
      expect(client.getAllFlags()).toHaveLength(0);
    });

    it("creates with pre-loaded flags", () => {
      const client = new FeatureFlagClient({
        flags: [makeFlag({ key: "a" }), makeFlag({ key: "b" })],
      });
      expect(client.getAllFlags()).toHaveLength(2);
    });
  });

  describe("flag management", () => {
    it("adds and retrieves flags", () => {
      const client = new FeatureFlagClient();
      client.addFlag(makeFlag({ key: "f1" }));
      expect(client.getFlag("f1")).toBeDefined();
      expect(client.hasFlag("f1")).toBe(true);
    });

    it("removes flags", () => {
      const client = new FeatureFlagClient();
      client.addFlag(makeFlag({ key: "f1" }));
      expect(client.removeFlag("f1")).toBe(true);
      expect(client.hasFlag("f1")).toBe(false);
    });

    it("loads flags in bulk", () => {
      const client = new FeatureFlagClient();
      client.addFlag(makeFlag({ key: "old" }));
      client.loadFlags([makeFlag({ key: "new" })]);
      expect(client.hasFlag("old")).toBe(false);
      expect(client.hasFlag("new")).toBe(true);
    });
  });

  describe("evaluation", () => {
    it("returns not_found for missing flags", () => {
      const client = new FeatureFlagClient();
      const result = client.evaluate("nope");
      expect(result.reason).toBe("not_found");
      expect(result.value).toBe(false);
    });

    it("evaluates a simple boolean flag", () => {
      const client = new FeatureFlagClient({
        flags: [makeFlag({ key: "dark-mode", defaultValue: true })],
      });
      expect(client.isEnabled("dark-mode")).toBe(true);
    });

    it("evaluates with targeting rules", () => {
      const client = new FeatureFlagClient({
        flags: [
          makeFlag({
            key: "beta",
            rules: [
              {
                conditions: [{ attribute: "plan", operator: "eq", value: "pro" }],
                value: true,
              },
            ],
          }),
        ],
      });
      expect(client.isEnabled("beta", { plan: "pro" })).toBe(true);
      expect(client.isEnabled("beta", { plan: "free" })).toBe(false);
    });

    it("evaluates with rollout", () => {
      const client = new FeatureFlagClient({
        flags: [
          makeFlag({
            key: "experiment",
            rollout: {
              percentage: 100,
              valueOn: true,
              valueOff: false,
            },
          }),
        ],
      });
      expect(client.isEnabled("experiment", { id: "user-1" })).toBe(true);
    });
  });

  describe("getValue and getVariant", () => {
    it("returns typed values", () => {
      const client = new FeatureFlagClient({
        flags: [makeFlag({ key: "theme", defaultValue: "light" })],
      });
      expect(client.getValue<string>("theme")).toBe("light");
      expect(client.getVariant("theme")).toBe("light");
    });

    it("returns fallback for missing flags", () => {
      const client = new FeatureFlagClient();
      expect(client.getValue("nope", {}, "fallback")).toBe("fallback");
      expect(client.getVariant("bnope", {}, "default")).toBe("default");
    });
  });

  describe("onChange", () => {
    it("fires when flags are added", () => {
      const client = new FeatureFlagClient();
      const events: string[] = [];
      client.onChange((key) => events.push(key));
      client.addFlag(makeFlag({ key: "f1" }));
      expect(events).toContain("f1");
    });

    it("fires when flags are removed", () => {
      const client = new FeatureFlagClient({
        flags: [makeFlag({ key: "f1" })],
      });
      const events: string[] = [];
      client.onChange((key) => events.push(key));
      client.removeFlag("f1");
      expect(events).toContain("f1");
    });

    it("unsubscribes correctly", () => {
      const client = new FeatureFlagClient();
      const events: string[] = [];
      const unsub = client.onChange((key) => events.push(key));
      client.addFlag(makeFlag({ key: "f1" }));
      unsub();
      client.addFlag(makeFlag({ key: "f2" }));
      expect(events).toEqual(["f1"]);
    });
  });
});
