## 2026-06-29 - Missing Focus States on Interactive Icon Buttons
**Learning:** Custom interactive icon components in this app (e.g., HeartButton, NotificationBell, SidebarModal close button) frequently omit focus states despite having hover animations, negatively impacting keyboard accessibility.
**Action:** Ensure that all newly created or modified interactive elements, especially icon-only buttons without default browser styles, include explicit `focus-visible` utility classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`).

## 2024-05-24 - Consistent Keyboard Focus Indicators
**Learning:** While checking accessibility on key interactive elements (e.g., custom icon buttons, game card triggers), I found that many had hover states but lacked visible focus indicators for keyboard users. Adding a consistent focus ring pattern greatly improves accessibility without compromising the design.
**Action:** Always apply `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (or similar utility classes from the established design system) to all interactive elements (`button`, `a`, `input`, etc.) to ensure keyboard navigability.

## 2024-07-27 - Consistent Focus States and ARIA Labels on Navbar Components
**Learning:** During accessibility review of the navbar, I found that the `SearchBox` submit button lacked both an `aria-label` and visible focus states, while the `UserMenu` toggle and its nested options lacked focus states entirely. Since the `UserMenu` toggle hides its text label on smaller screens (`max-lg:hidden`), an explicit `aria-label` is required for screen readers on mobile devices.
**Action:** Consistently apply `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` to all interactive buttons in the navbar (including `SearchBox`, `UserMenu`, and `AuthSection`). Ensure any button relying heavily on an icon, or where text is conditionally hidden via responsive classes, receives an explicit `aria-label` (e.g., `aria-label="Toggle user menu"`).
