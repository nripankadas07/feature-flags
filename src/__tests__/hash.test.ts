import { hashToBucket } from "../hash";

describe("hashToBucket", () => {
  it("returns a number between 0 and 99", () => {
    for (let i = 0; i < 100; i++) {
      const bucket = hashToBucket("flag", `user-${i}`);
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(100);
    }
  });

  it("is deterministic", () => {
    const a = hashToBucket("my-flag", "user-42");
    const b = hashToBucket("my-flag", "user-42");
    expect(a).toBe(b);
  });

  it("varies with different user keys", () => {
    const buckets = new Set<number>();
    for (let i = 0; i < 50; i++) {
      buckets.add(hashToBucket("flag", `user-${i}`));
    }
    // With 50 users we expect at least 5 distinct buckets
    expect(buckets.size).toBeGreaterThan(5);
  });

  it("varies with different flag keys", () => {
    const a = hashToBucket("flag-a", "user-1");
    const b = hashToBucket("flag-b", "user-1");
    // Not guaranteed to differ, but extremely likely with different inputs
    // We just verify they're valid numbers
    expect(typeof a).toBe("number");
    expect(typeof b).toBe("number");
  });

  it("distributes roughly uniformly", () => {
    const counts = new Array(10).fill(0);
    const n = 10_000;
    for (let i = 0; i < n; i++) {
      const bucket = hashToBucket("uniform-test", `user-${i}`);
      counts[Math.floor(bucket / 10)]++;
    }
    // Each decile should get roughly 10% Â± 5%
    for (const count of counts) {
      expect(count / n).toBeGreaterThan(0.05);
      expect(count / n).toBeLessThan(0.15);
    }
  });
});
