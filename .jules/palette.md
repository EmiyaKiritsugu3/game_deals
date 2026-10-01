## 2026-06-29 - Missing Focus States on Interactive Icon Buttons
**Learning:** Custom interactive icon components in this app (e.g., HeartButton, NotificationBell, SidebarModal close button) frequently omit focus states despite having hover animations, negatively impacting keyboard accessibility.
**Action:** Ensure that all newly created or modified interactive elements, especially icon-only buttons without default browser styles, include explicit `focus-visible` utility classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`).

## 2024-05-24 - Consistent Keyboard Focus Indicators
**Learning:** While checking accessibility on key interactive elements (e.g., custom icon buttons, game card triggers), I found that many had hover states but lacked visible focus indicators for keyboard users. Adding a consistent focus ring pattern greatly improves accessibility without compromising the design.
**Action:** Always apply `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (or similar utility classes from the established design system) to all interactive elements (`button`, `a`, `input`, etc.) to ensure keyboard navigability.

## 2024-05-25 - ARIA Current for View Toggles
**Learning:** When building or updating tab-based navigation for simple view toggles in this app, applying `role="tablist"` and `role="tab"` without full W3C ARIA tab pattern implementation (e.g., keyboard arrow navigation) creates a broken experience for assistive technologies.
**Action:** Rely on native `<button>` elements and use `aria-current="true"` to denote the active state for simple in-page view toggles, avoiding broken keyboard interaction expectations while still conveying state to screen readers.
