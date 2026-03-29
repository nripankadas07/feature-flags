# feature-flags

Lightweight, type-safe feature flag SDK for TypeScript. Local rule evaluation, percentage rollouts, user targeting, and real-time change listeners âââð with zero runtime dependencies.

## Why This Exists

Most feature flag services are SaaS products with vendor lock-in and network latency on every check. This SDK evaluates flags locally in-process, so you get sub-microsecond decisions with zero network calls. Bring your own flag source (API, file, database) and this library handles the evaluation logic.

## Quick Start

```typescript
import { FeatureFlagClient } from "feature-flags";

const ff = new FeatureFlagClient({
  flags: [
    {
      key: "dark-mode",
      enabled: true,
      defaultValue: false,
      rollout: { percentage: 50, valueOn: true, valueOff: false },
    },
  ],
});

// Simple boolean check
if (ff.isEnabled("dark-mode", { id: "user-123" })) {
  enableDarkMode();
}

// String variant
const theme = ff.getVariant("theme", { id: "user-123" }, "default");

// Full evaluation result with reason
const result = ff.evaluate("dark-mode", { id: "user-123" });
console.log(result.reason); // "rollout" | "rule_match" | "default" | "disabled"
```

## Targeting Rules

Rules use AND logic within a rule and first-match-wins across rules:

```typescript
const ff = new FeatureFlagClient({
  flags: [
    { key: "beta-feature", enabled: true, defaultValue: false, rules: [
      {
        conditions: [
          { attribute: "plan", operator: "eq", value: "enterprise" },
          { attribute: "country", operator: "in", value: ["US", "CA"] },
        ],
        value: true,
      },
    ] },
  ],
});

ff.isEnabled("beta-feature", { plan: "enterprise", country: "USA" }); // true
ff.isEnabled("beta-feature", { plan: "free", country: "USA" }); // false
```

### Supported Operators

| Operator | Type | Description |
|----------|------|-------------|
| `eq` | any | Strict equality |
| `neq` | any | Not equal |
| `in` | array | Value is in the list |
| `not_in` | array | Value is not in the list |
| `gt` | number | Greater than |
| `gte` | number | Greater than or equal |
| `lt` | number | Less than |
| `lte` | number | Less than or equal |
| `contains` | string | Substring match |
| `starts_with` | string | Prefix match |
| `ends_with` | string | Suffix match |

## Percentage Rollouts

Deterministic hashing ensures the same user always gets the same value:

```typescript
{
  key: "new-checkout",
  enabled: true,
  defaultValue: false,
  rollout: {
    percentage: 25,      // 25% of users
    valueOn: true,
    valueOff: false,
    hashKey: "orgId",    // optional: hash on org instead of user
  },
}
```

## Real-time Updates

Subscribe to flag changes and sync from any source:

```typescript
// Listen for changes
ff.onChange((flagKey, oldValue, newValue) => {
  console.log(`${flagKey}: ${oldValue} â ${newValue}`);
});

// Bulk-replace flags (e.g., from an API poll)
ff.loadFlags(newFlagDefinitions);
```

## Architecture

```
src/
âââ types.ts       # Core type definitions (flags, rules, operators, contexts)
âââ hash.ts        # Deterministic djb2 hashing for rollout bucketing
âââ evaluator.ts   # Pure-function    evaluation: disabled â rules â rollout â default
âââ store.ts       # In-memory flag store with change notification
âââ client.ts      # Public API: manage flags + evaluate + subscribe
âââ index.ts       # Barrel exports
```

Evaluation follows a strict priority chain: disabled check â targeting rules (first match) â percentage rollout â default value. The evaluator is a pure function with no side effects, making it trivially testable.

## Testing

```bash
npm install
npm test
```

## License

MIT
