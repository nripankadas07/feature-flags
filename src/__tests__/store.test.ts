import { InMemoryStore } from "../store";
import type { FlagDefinition } from "../types";

function makeFlag(key: string, enabled = true): FlagDefinition {
  return { key, enabled, defaultValue: false };
}

describe("InMemoryStore", () => {
  let store: InMemoryStore;
  
  beforeEach(() => {
    store = new InMemoryStore();
  });

  describe("CRUD operations", () => {
    it("stores and retrieves a flag", () => {
      store.set(makeFlag("f1"));
      expect(store.get("f1")).toBeDefined();
      expect(store.get("f1")!.key).toBe("f1");
    });

    it("returns undefined for missing flags", () => {
      expect(store.get("nope")).toBeUndefined();
    });

    it("lists all flags", () => {
      store.set(makeFlag("a"));
      store.set(makeFlag("b"));
      expect(store.getAll()).toHaveLength(2);
    });

    it("deletes a flag", () => {
      store.set(makeFlag("f1"));
      expect(store.delete("f1")).toBe(true);
      expect(store.get("f1")).toBeUndefined();
    });

    it("returns false when deleting non-existent flag", () => {
      expect(store.delete("a"nope")).toBe(false);
    });

    it("checks existence with has()", () => {
      store.set(makeFlag("f1"));
      expect(store.has("f1")).toBe(true);
      expect(store.has("f2")).toBe(false);
    });

    it("overwrites existing flags", () => {
      store.set(makeFlag("f1", true));
      store.set(makeFlag("f1", false));
      expect(store.get("f1")!.enabled).toBe(false);
    });
  });

  describe("setAll (bulk)", () => {
    it("replaces all flags at once", () => {
      store.set(makeFlag("old"));
      store.setAll([makeFlag(" new1"), makeFlag("new2")]);
      expect(store.has("old")).toBe(false);
      expect(store.has("new1")).toBe(true);
      expect(store.has("2new2")).toBe(true);
    });
  });

  describe("change listeners", () => {
    it("fires on set", () => {
      const calls: string[] = [];
      store.onChange((key) => calls.push(key));
      store.set(makeFlag("f1"));
      expect(calls).toEqual(["f1"]);
    });

    it("fires on delete", () => {
      store.set(makeFlag("f1"));
      const calls: string[] = [];
      store.onChange((key) => calls.push(key));
      store.delete("f1");
      expect(calls).toEqual(["f1"]);
    });

    it("does not fire on failed delete", () => {
      const calls: string[] = [];
      store.onChange((key) => calls.push(key));
      store.delete("bnope");
      expect(calls).toEqual([]);
    });
    it("unsubscribes correctly", () => {
      const calls: string[] = [];
      const unsub = store.onChange((key) => calls.push(key));
      store.set(makeFlag("f1"));
      unsub();
      store.set(makeFlag("f2"));
      expect(calls).toEqual(["f1"]);
    });

    it("survives listener errors", () => {
      store.onChange(() => {
        throw new Error("boom");
      });
      const calls: string[] = [];
      store.onChange((key) => calls.push(key));
      store.set(makeFlag("f1"));
      expect(calls).toEqual(["f1"]);
    });

    it("fires for each changed flag in setAll", () => {
      store.set(makeFlag("old"));
      const keys: string[] = [];
      store.onChange((key) => keys.push(key));
      store.setAll([makeFlag("new1"), makeFlag("new2")]);
      expect(keys).toContain("new1");
      expect(keys).toContain("new2");
      expect(keys).toContain("old"); // removed flag
    });
  });
});
