## 2026-06-29 - Missing Focus States on Interactive Icon Buttons
**Learning:** Custom interactive icon components in this app (e.g., HeartButton, NotificationBell, SidebarModal close button) frequently omit focus states despite having hover animations, negatively impacting keyboard accessibility.
**Action:** Ensure that all newly created or modified interactive elements, especially icon-only buttons without default browser styles, include explicit `focus-visible` utility classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`).

## 2024-05-24 - Consistent Keyboard Focus Indicators
**Learning:** While checking accessibility on key interactive elements (e.g., custom icon buttons, game card triggers), I found that many had hover states but lacked visible focus indicators for keyboard users. Adding a consistent focus ring pattern greatly improves accessibility without compromising the design.
**Action:** Always apply `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (or similar utility classes from the established design system) to all interactive elements (`button`, `a`, `input`, etc.) to ensure keyboard navigability.

## 2024-05-24 - Accessible Pseudo-Tabs
**Learning:** When building tab-like navigation with `<button>` elements, avoid applying broken ARIA tab patterns (role="tablist" etc.) without full keyboard arrow support. Instead, rely on native `<button>` and `aria-current="true"` (or "page") to denote the active state for screen readers. Also, custom interactive components with hover animations often omit default browser focus states; explicitly adding `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` guarantees keyboard accessibility.
**Action:** Always check interactive button groups for active state announcements via `aria-current` and ensure custom components retain `focus-visible` classes.
