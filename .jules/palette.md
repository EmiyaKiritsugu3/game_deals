## 2026-06-29 - Missing Focus States on Interactive Icon Buttons
**Learning:** Custom interactive icon components in this app (e.g., HeartButton, NotificationBell, SidebarModal close button) frequently omit focus states despite having hover animations, negatively impacting keyboard accessibility.
**Action:** Ensure that all newly created or modified interactive elements, especially icon-only buttons without default browser styles, include explicit `focus-visible` utility classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`).

## 2024-05-24 - Consistent Keyboard Focus Indicators
**Learning:** While checking accessibility on key interactive elements (e.g., custom icon buttons, game card triggers), I found that many had hover states but lacked visible focus indicators for keyboard users. Adding a consistent focus ring pattern greatly improves accessibility without compromising the design.
**Action:** Always apply `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (or similar utility classes from the established design system) to all interactive elements (`button`, `a`, `input`, etc.) to ensure keyboard navigability.

## 2026-06-30 - Hidden Text in Responsive Components Requires ARIA Labels
**Learning:** Components that rely on CSS classes like `max-lg:hidden` to hide descriptive text on smaller screens (like the username in UserMenu) inadvertently create icon-only buttons for mobile/tablet users without providing an accessible name for screen readers.
**Action:** When conditionally hiding text inside a button based on screen size, ensure the button itself has an `aria-label` attribute (e.g., `aria-label="Toggle user menu"`) to maintain accessibility across all breakpoints.
