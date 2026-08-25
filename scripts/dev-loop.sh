#!/usr/bin/env bash
# scripts/dev-loop.sh — one iteration of the autonomous dev loop.
# Invoked by a scheduled Claude session (hourly cron prompt) or manually.
# Idempotent: exits 0 when nothing to do.
#
# Flow: pick task from docs/backlog.md -> branch -> implement (delegated to
# Claude headless) -> local gauntlet -> push -> PR -> auto-merge if
# risk:auto && CI green; else park for human review.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

BACKLOG="docs/backlog.md"

task_field() { # $1=task id, $2=field -> value
  awk -v t="## $1:" -v f="- $2:" '
    $0 ~ t {inblk=1; next}
    inblk && /^## / {exit}
    inblk && index($0, f)==1 {sub(f,"",$0); gsub(/^[ \t]+|[ \t]+$/,"",$0); print; exit}
  ' "$BACKLOG"
}

set_task_status() { # $1=id, $2=status
  python3 - "$1" "$2" "$BACKLOG" <<'PY'
import re, sys
tid, status, path = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
pat = re.compile(r'(## ' + tid + r':.*?\n- status: )\w+', re.S)
s2, n = pat.subn(r'\g<1>' + status, s, count=1)
if n != 1:
    print(f"could not set status for {tid}", file=sys.stderr); sys.exit(1)
open(path, 'w').write(s2)
print(f"{tid} -> {status}")
PY
}

first_todo_task() {
  awk '
    /^## T[0-9]+:/ {id=$2; instate=1; st=""; dep="none"; next}
    instate && /^## / {instate=0}
    instate && /^- status:/ {st=$2}
    instate && /^- depends:/ {dep=$2}
    instate && /^- spec:/ {
      ok=1
      if (st=="todo" && dep!="none") {
        # dependencies checked in bash wrapper via task_field
        print id "|" dep
      } else if (st=="todo") {
        print id "|none"
      }
      instate=0
    }
  ' "$BACKLOG"
}

deps_satisfied() { # $1=depends value ("none" or "T7, T2")
  [ "$1" = "none" ] && return 0
  for d in $(echo "$1" | tr ',' ' '); do
    [ "$(task_field "$d" status)" = "done" ] || return 1
  done
  return 0
}

gauntlet() {
  echo "── gauntlet ──"
  ./node_modules/.bin/biome check src/ tests/ || return 1
  ./node_modules/.bin/tsc --noEmit || return 1
  bun --bun vitest run --reporter=basic || return 1
}

wait_for_ci() { # $1=pr number -> 0 if all checks green
  gh pr checks "$1" --watch --interval 60 >/dev/null 2>&1 || true
  local fails
  fails=$(gh pr view "$1" --json statusCheckRollup \
    --jq '[.statusCheckRollup[] | select(.conclusion=="FAILURE")] | length')
  [ "$fails" = "0" ]
}

# --- main -----------------------------------------------------------------

TASK=""
while IFS='|' read -r id dep; do
  if deps_satisfied "$dep"; then TASK="$id"; break; fi
done < <(first_todo_task)

if [ -z "${TASK:-}" ]; then
  echo "backlog empty or all remaining tasks blocked — nothing to do"
  exit 0
fi

RISK="$(task_field "$TASK" risk)"
SPEC="$(awk -v t="## $TASK:" 'index($0,t)==1{inblk=1;next} inblk&&/^## /{exit} inblk{print}' "$BACKLOG")"
echo "picked $TASK (risk: $RISK)"

BRANCH="loop/$TASK-lowercase"
BRANCH=$(echo "$BRANCH" | tr 'A-Z' 'a-z')
git checkout main >/dev/null 2>&1
HUSKY=0 git pull origin main --ff-only >/dev/null 2>&1 || true
git checkout -B "$BRANCH"

set_task_status "$TASK" doing

if ! claude -p "$(cat <<PROMPT
Implemente a tarefa abaixo seguindo o CLAUDE.md do projeto.
Regras absolutas:
- menor diff possível; nada de deps novas sem necessidade real
- teste unitário pra toda lógica nova não-trivial (padrão tests/unit/routes/)
- NÃO edite .env.example exceto para adicionar var nova comentada
- ao terminar, rode: ./node_modules/.bin/biome check src/ tests/ && ./node_modules/.bin/tsc --noEmit && bun --bun vitest run
- faça commit Conventional Commits com Co-Authored-By: Claude <noreply@anthropic.com>
- NÃO faça push

Tarefa $TASK:
$SPEC
PROMPT
)"; then
  echo "agent failed — marking blocked"
  set_task_status "$TASK" blocked
  git checkout main
  exit 1
fi

if ! gauntlet; then
  echo "local gauntlet failed — back to todo"
  set_task_status "$TASK" todo
  git checkout main && git branch -D "$BRANCH"
  exit 1
fi

HUSKY=0 git push -u origin "$BRANCH"

TITLE=$(echo "$SPEC" | head -1 | cut -c1-70)
PR_URL=$(gh pr create --title "[$TASK] $TITLE" \
  --body "Autonomous loop PR. Acceptance criteria in docs/backlog.md ($TASK)." | tail -1)
PR_NUM="${PR_URL//[!0-9]/}"
echo "PR: $PR_URL"

if wait_for_ci "$PR_NUM"; then
  if [ "$RISK" = "auto" ]; then
    gh pr merge "$PR_NUM" --squash --delete-branch
    set_task_status "$TASK" done
    echo "✔ $TASK DONE (auto-merged)"
  else
    set_task_status "$TASK" review
    echo "⏸ $TASK awaiting human review: $PR_URL"
  fi
else
  set_task_status "$TASK" blocked
  echo "✖ $TASK BLOCKED by failing CI — $PR_URL"
fi
