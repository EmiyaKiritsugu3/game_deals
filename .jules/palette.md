## 2026-06-29 - Missing Focus States on Interactive Icon Buttons
**Learning:** Custom interactive icon components in this app (e.g., HeartButton, NotificationBell, SidebarModal close button) frequently omit focus states despite having hover animations, negatively impacting keyboard accessibility.
**Action:** Ensure that all newly created or modified interactive elements, especially icon-only buttons without default browser styles, include explicit `focus-visible` utility classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`).

## 2024-05-24 - Consistent Keyboard Focus Indicators
**Learning:** While checking accessibility on key interactive elements (e.g., custom icon buttons, game card triggers), I found that many had hover states but lacked visible focus indicators for keyboard users. Adding a consistent focus ring pattern greatly improves accessibility without compromising the design.
**Action:** Always apply `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (or similar utility classes from the established design system) to all interactive elements (`button`, `a`, `input`, etc.) to ensure keyboard navigability.

## 2024-05-18 - WishlistTabs Accessibility Enhancement
**Learning:** For components functioning as in-page view toggles (like `WishlistTabs`) rather than full page navigations, `aria-current="true"` is a more semantically accurate accessibility indicator for screen readers than `aria-current="page"`.
**Action:** When adding active states to internal UI tabs or toggles, prefer `aria-current="true"` over `aria-current="page"` unless they navigate to a distinct URL route. Always clean up `.orig` files and test output logs before committing.
