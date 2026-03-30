import assert from 'node:assert';
import { estimatePlaytime, calculateCostPerHour } from './hltb';

console.log('🧪 Starting HLTB Service Tests...\n');

/**
 * Tests for estimatePlaytime
 */
console.log('Testing estimatePlaytime...');

// Test Determinism
const title1 = "Cyberpunk 2077";
const res1 = estimatePlaytime(title1);
const res2 = estimatePlaytime(title1);
assert.deepStrictEqual(res1, res2, 'Determinism failed: Same title produced different results');
console.log('✅ Determinism: Passed');

// Test Range Validation (mainStory)
const titles = ["A", "Very Long Game Title That Might Affect Hash", "", "!@#$%^&*()", "🎮 Video Game"];
titles.forEach(t => {
    const res = estimatePlaytime(t);
    assert.ok(res.mainStory >= 6 && res.mainStory <= 80, `Range failed for "${t}": mainStory=${res.mainStory}`);
});
console.log('✅ Range Validation (6-80h): Passed');

// Test Logical Consistency
titles.forEach(t => {
    const res = estimatePlaytime(t);
    assert.ok(res.mainExtra >= res.mainStory, `Consistency failed: mainExtra(${res.mainExtra}) < mainStory(${res.mainStory}) for "${t}"`);
    assert.ok(res.completionist >= res.mainExtra, `Consistency failed: completionist(${res.completionist}) < mainExtra(${res.mainExtra}) for "${t}"`);
});
console.log('✅ Logical Consistency (Story <= Extra <= Completionist): Passed');

// Test Unicode / Surrogate Pairs (e.g. Emoji)
const resEmoji = estimatePlaytime("🔥 EPIC DEAL");
assert.ok(resEmoji.found, 'Should return found: true even for special chars');
console.log('✅ Special Characters: Passed');

/**
 * Tests for calculateCostPerHour
 */
console.log('\nTesting calculateCostPerHour...');

assert.strictEqual(calculateCostPerHour(0, 50), 'FREE', 'Price 0 should be FREE');
assert.strictEqual(calculateCostPerHour(10, 0), 'N/A', 'Hours 0 should be N/A');
assert.strictEqual(calculateCostPerHour(10, 20), '$0.50/hr', 'Standard calculation failed');
assert.strictEqual(calculateCostPerHour(59.99, 100), '$0.60/hr', 'Rounding/formatting failed');
console.log('✅ costPerHour Logic: Passed');

console.log('\n✨ All HLTB Service tests passed successfully!');
