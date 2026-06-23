### Task 4: affiliate-config — validation & URL logic

**Files:**
- Create: `src/lib/affiliate-config.test.ts`

**Interfaces:**
- Tests: `affiliateConfig`, `ALLOWED_DOMAINS`, `isValidStoreId`, `isValidGameSlug`

- [ ] **Step 1: Write test file**

```ts
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_DOMAINS,
  affiliateConfig,
  isValidGameSlug,
  isValidStoreId,
} from './affiliate-config';

describe('affiliateConfig', () => {
  it('has 17 stores', () => {
    expect(Object.keys(affiliateConfig)).toHaveLength(17);
  });

  it('every config has a valid baseUrl', () => {
    Object.values(affiliateConfig).forEach((c) => {
      expect(() => new URL(c.baseUrl)).not.toThrow();
    });
  });
});

describe('ALLOWED_DOMAINS', () => {
  it('includes steam', () => {
    expect(ALLOWED_DOMAINS.has('store.steampowered.com')).toBe(true);
  });

  it('matches each config entry', () => {
    Object.values(affiliateConfig).forEach((c) => {
      const hostname = new URL(c.baseUrl).hostname;
      expect(ALLOWED_DOMAINS.has(hostname)).toBe(true);
    });
  });
});

describe('isValidStoreId', () => {
  it('returns true for valid numeric IDs', () => {
    expect(isValidStoreId('1')).toBe(true);
    expect(isValidStoreId('7')).toBe(true);
    expect(isValidStoreId('104')).toBe(true);
  });

  it('returns false for unknown store IDs', () => {
    expect(isValidStoreId('999')).toBe(false);
    expect(isValidStoreId('0')).toBe(false);
  });

  it('returns false for non-numeric input', () => {
    expect(isValidStoreId('abc')).toBe(false);
    expect(isValidStoreId('')).toBe(false);
    expect(isValidStoreId('12a')).toBe(false);
  });
});

describe('isValidGameSlug', () => {
  it('returns true for valid slugs', () => {
    expect(isValidGameSlug('half-life-2')).toBe(true);
    expect(isValidGameSlug('cyberpunk_2077')).toBe(true);
    expect(isValidGameSlug('a')).toBe(true);
  });

  it('returns false for empty slug', () => {
    expect(isValidGameSlug('')).toBe(false);
  });

  it('returns false for slug over 100 chars', () => {
    expect(isValidGameSlug('a'.repeat(101))).toBe(false);
  });

  it('returns false for slugs with special chars', () => {
    expect(isValidGameSlug('../etc/passwd')).toBe(false);
    expect(isValidGameSlug('game<script>')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test**

Run: `pnpm vitest run src/lib/affiliate-config.test.ts`
Expected: 12 passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add src/lib/affiliate-config.test.ts
git commit -m "test(lib): affiliate-config validation and URL logic"
```

---

