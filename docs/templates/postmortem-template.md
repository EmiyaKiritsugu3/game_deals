# Postmortem: [TITLE]

**Date**: YYYY-MM-DD
**Incident ID**: INC-NNN
**Severity**: P1 / P2 / P3
**Duration**: [start] — [end] ([duration])
**Authors**: [Name], [Name]

## Roles

| Role | Lead |
|------|------|
| Incident Commander (IC) | [Name] |
| Operations Lead (OL) | [Name] |
| Communications Lead (CL) | [Name] |

---

## Summary

[One-paragraph description of the incident. What happened? Which service was affected? What was the blast radius?]

**Impact**:
- **Users affected**: [count] / [percentage] of active users
- **Error rate**: [baseline]% → [peak]% (x[N] increase)
- **Latency p99**: [baseline]ms → [peak]ms
- **Data loss**: Yes / No — [details if yes]
- **Business impact**: [revenue impact, SLA breach, etc.]

---

## Timeline

*All times in UTC. Timestamps sourced from: [e.g., deploy logs, Datadog metrics, Slack messages].*

| Time (UTC) | Event | Source |
|------------|-------|--------|
| HH:MM | [Event description] | [link to log/chat/deploy] |
| HH:MM | [Event description] | [link to log/chat/deploy] |
| HH:MM | [Event description] | [link to log/chat/deploy] |
| HH:MM | **Incident declared** | [link] |
| HH:MM | [Action taken] | [link] |
| HH:MM | [Action taken] | [link] |
| HH:MM | **Service recovered** | [link] |
| HH:MM | **Incident closed** | [link] |

---

## Root Cause

**Trigger**: [What specific event started the incident — a deploy, config change, external dependency failure, traffic spike?]

**Root cause**: [Deepest underlying cause. Include code path, config value, or dependency behavior.]

**Path to failure** (chain of events):
1. [First link]
2. [Second link]
3. [Third link]
4. → **Outage**

**Why it wasn't caught earlier**:
- [Monitoring gap / test gap / review gap]
- [Why existing safeguards didn't fire]

---

## What Went Well

- [Thing that worked well]
- [Thing that worked well]
- [Thing that worked well]

---

## What Went Wrong

- [Thing that went wrong]
- [Thing that went wrong]
- [Thing that went wrong]

---

## Where We Got Lucky

> Hidden risks masked by luck. These are near-misses that didn't cause harm *this time* but will next.

- [Example: "The failover worked because the standby node happened to be on the same AZ as the recovery script — next AZ failure won't line up."]
- [Example: "No customers were affected because the bug only fired during off-peak hours."]
- [Example: "The on-call engineer had debugged a similar issue last week — without that recency, MTTR would have been 3x longer."]

---

## Action Items

| # | Action | Owner | Tracked In | Severity |
|---|--------|-------|------------|----------|
| 1 | [Specific, measurable action] | @handle | [Issue/PR link] | P1 |
| 2 | [Specific, measurable action] | @handle | [Issue/PR link] | P2 |
| 3 | [Specific, measurable action] | @handle | [Issue/PR link] | P2 |
| 4 | [Specific, measurable action] | @handle | [Issue/PR link] | P3 |

### Severity Definitions

| Label | Definition |
|-------|------------|
| **P1** | Critical. Blocks incident closure or prevents recurrence. Complete within 1 week. |
| **P2** | High. Reduces risk or improves detection/mitigation. Complete within 1 sprint. |
| **P3** | Medium. Nice-to-have improvement. Complete when capacity allows. |

### DREAD Severity Scoring

Score each action item's risk using DREAD:

| Dimension | 0 (Low) | 1 (Medium) | 2 (High) | Score |
|-----------|---------|------------|----------|-------|
| **D**amage | No user impact | Partial degradation | Full outage / data loss | [ ] |
| **R**eproducibility | Hard to trigger | Specific conditions | Any request triggers it | [ ] |
| **E**xploitability | Requires auth+config | Requires auth | Public / unauthenticated | [ ] |
| **A**ffected users | <1% | 1–25% | >25% | [ ] |
| **D**iscoverability | Hidden | Visible in logs | Obvious to user | [ ] |
| | | **Total** | **/10** |

**Score thresholds**: 0–3 = P3, 4–6 = P2, 7–10 = P1

---

## Lessons Learned

### What did we learn about our system?

[System knowledge gained from this incident.]

### What will we do differently next time?

[Process improvements, runbook updates, training needs.]

---

## Appendix

- [Link to incident Slack channel]
- [Link to related monitoring dashboards]
- [Link to relevant runbooks]
- [Link to deploy logs]

<!--
Template: Google SRE postmortem
Reference: https://sre.google/workbook/postmortem-culture/
-->
