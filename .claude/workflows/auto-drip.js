// biome-ignore-all: workflow script — top-level returns valid in this non-standard execution context
export const meta = {
  name: 'auto-drip',
  description: 'Auto pipeline: descobre, implementa, testa, slop gate, deliver.',
  phases: [
    { title: 'Discover', detail: 'Read git + project infer task' },
    { title: 'Spec+Plan', detail: 'Decompose into ordered tasks' },
    { title: 'Build', detail: 'Per-task: implement + self-test until green' },
    { title: 'Smoke', detail: 'Full suite + fix regressions' },
    { title: 'SlopGate', detail: 'Review code vs anti-patterns, fix before PR' },
    { title: 'Deliver', detail: 'Commit/PR depending on branch' },
  ],
};

let feature = args?.feature || args?._ || '';
if (!feature) {
  const git = await agent(
    `Read current git: branch, recent 5 commits, diff --stat main, TODOs in changed files. Infer feature. 1 sentence.`,
    { label: 'discover' }
  );
  feature = git || 'infer context';
  console.log(`Inferred: ${feature}`);
}

phase('Spec+Plan');
const plan = await agent(
  `Read project (package.json, CLAUDE.md, src/ structure, existing tests). Write spec + task list for: ${feature}\n\nOutput spec + tasks file + deps.`,
  {
    label: 'plan',
    schema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              desc: { type: 'string' },
              file: { type: 'string' },
              deps: { type: 'array', items: { type: 'string' } },
            },
            required: ['id', 'desc'],
          },
        },
        order: { type: 'array', items: { type: 'string' } },
      },
      required: ['tasks', 'order'],
    },
  }
);
if (!plan) return;
console.log(`${plan.tasks.length} tasks`);

phase('Build');

// Core: execute each task in order, per-file, self-test until green
for (const task of plan.order.map((id: string) => plan.tasks.find((t: { id: string }) => t.id === id))) {
  if (!task) continue;
  const spec = plan.spec?.find((s: { id: string }) => s.id === task.id);
  await agent(
    `Implement: ${task.desc}\n\nFile: ${task.file}\nSpec: ${JSON.stringify(spec)}\n\nWrite working code. Then run its test file. If test fails, fix and retry. Do NOT proceed until all tests for this file pass.`,
    { label: `build-${task.id}`, maxSteps: 10 },
  );
}

phase('Smoke');
const smoke = await agent(
  `Run full test suite. Any fails, fix them. Repeat until entire suite passes.`,
  {
    label: 'smoke',
    schema: { type: 'object', properties: { pass: { type: 'boolean' } }, required: ['pass'] },
  }
);
if (!smoke?.pass) {
  console.log('❌ Smoke failed');
  return;
}

phase('SlopGate');
const slop = await agent(
  `Review all changed files for common AI slop patterns:

1. Dead code (unused vars, functions, imports)
2. Over-engineering (interface for one impl, factory making one product, unused abstraction)
3. Comment repeats obvious code (// increment i by 1)
4. Duplication where adjacent logic could reuse
5. Unnecessary file split (could be 5 lines inside existing file)
6. Violation of project conventions in CLAUDE.md

For each finding, output path:line: <pattern> — <fix>. If no slop, output CLEAN.`,
  { label: 'slop-check' }
);
if (slop && slop !== 'CLEAN') {
  console.log(`Slop found:\n${slop}`);
  const fixed = await agent(
    `Fix issues:\n\n${slop}\n\nApply fixes following project conventions.`,
    { label: 'slop-fix' }
  );
  if (fixed) console.log('Slop auto-fixed');
  const reSmoke = await agent(`Run full test suite. Any fails, fix them. Pass/fail only.`, {
    label: 're-smoke',
    schema: { type: 'object', properties: { pass: { type: 'boolean' } }, required: ['pass'] },
  });
  if (!reSmoke?.pass) {
    console.log('❌ Post-slop smoke failed');
    return;
  }
  console.log('✅ Post-slop smoke pass');
} else {
  console.log('✅ No slop detected');
}

phase('Deliver');
const branch = await agent(`What git branch are we on? Output just branch name.`, {
  label: 'branch-name',
});
const isMain = branch === 'main' || branch === 'master';

if (isMain || args?.asPr) {
  const prBody = await agent(`Generate PR description for changes on ${branch} targeting main.`, {
    label: 'pr-body',
  });
  await agent(`Create PR:\nTitle: feature/${feature}\nBody: ${prBody}\n\nUse gh CLI.`, {
    label: 'create-pr',
  });
  console.log(`✅ PR created from ${branch}`);
} else {
  await agent(
    `Commit all changes with conventional commit describing: ${feature}\n\nPush to origin/${branch}.`,
    { label: 'deliver-commit' }
  );
  console.log(`✅ Committed and pushed ${branch}. No PR.`);
}
