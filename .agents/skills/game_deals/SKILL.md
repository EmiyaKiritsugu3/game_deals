```markdown
# game_deals Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns, coding conventions, and workflows used in the `game_deals` TypeScript codebase. You'll learn how to structure files, write imports/exports, follow commit conventions, and run tests as practiced in this repository.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `gameDealsFetcher.ts`, `priceTracker.test.ts`

### Import Style
- Mixed import styles are used.
  - Default imports:
    ```typescript
    import fetchDeals from './fetchDeals';
    ```
  - Named imports:
    ```typescript
    import { getPrice } from './priceUtils';
    ```

### Export Style
- Use **default exports** for modules.
  - Example:
    ```typescript
    const fetchDeals = () => { /* ... */ };
    export default fetchDeals;
    ```

### Commit Messages
- Follow **Conventional Commits**.
- Use the `perf` prefix for performance-related changes.
  - Example:  
    ```
    perf: optimize deal fetching for faster response time
    ```
- Average commit message length: ~64 characters.

## Workflows

### Commit Changes
**Trigger:** When you make a code change that needs to be committed.
**Command:** `/commit-changes`

1. Stage your changes:
    ```
    git add .
    ```
2. Write a conventional commit message, using the appropriate prefix (e.g., `perf`):
    ```
    git commit -m "perf: improve deal sorting algorithm"
    ```
3. Push your changes:
    ```
    git push
    ```

### Run Tests
**Trigger:** Before pushing changes or to verify code correctness.
**Command:** `/run-tests`

1. Locate test files (pattern: `*.test.*`).
2. Run your test runner (framework is unknown; common commands might be):
    ```
    npm test
    ```
    or
    ```
    npx jest
    ```
    or
    ```
    ts-node priceTracker.test.ts
    ```

## Testing Patterns

- Test files are named with the pattern: `*.test.*` (e.g., `fetchDeals.test.ts`).
- The testing framework is not specified; check for scripts in `package.json` or use common TypeScript test runners like Jest or Mocha.
- Example test file:
    ```typescript
    import fetchDeals from './fetchDeals';

    test('fetchDeals returns an array of deals', () => {
      const deals = fetchDeals();
      expect(Array.isArray(deals)).toBe(true);
    });
    ```

## Commands
| Command         | Purpose                                      |
|-----------------|----------------------------------------------|
| /commit-changes | Guide for staging, committing, and pushing   |
| /run-tests      | Instructions for running the test suite      |
```
