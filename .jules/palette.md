## 2026-06-29 - Missing Focus States on Interactive Icon Buttons
**Learning:** Custom interactive icon components in this app (e.g., HeartButton, NotificationBell, SidebarModal close button) frequently omit focus states despite having hover animations, negatively impacting keyboard accessibility.
**Action:** Ensure that all newly created or modified interactive elements, especially icon-only buttons without default browser styles, include explicit `focus-visible` utility classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`).

## 2024-05-24 - Consistent Keyboard Focus Indicators
**Learning:** While checking accessibility on key interactive elements (e.g., custom icon buttons, game card triggers), I found that many had hover states but lacked visible focus indicators for keyboard users. Adding a consistent focus ring pattern greatly improves accessibility without compromising the design.
**Action:** Always apply `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (or similar utility classes from the established design system) to all interactive elements (`button`, `a`, `input`, etc.) to ensure keyboard navigability.
## 2026-07-24 - Added Keyboard Focus to Clear Search Buttons
**Learning:** Icon-only utility buttons within inputs (like 'Clear search' X buttons) were lacking focus states, making them difficult to use for keyboard-only users who couldn't tell when they had navigated to the clear action.
**Action:** When implementing icon-only buttons as secondary actions within inputs, always include explicit  utility classes (e.g., ) to ensure clear keyboard navigation.

## 2024-07-24 - Added Keyboard Focus to Clear Search Buttons
**Learning:** Icon-only utility buttons within inputs (like 'Clear search' X buttons) were lacking focus states, making them difficult to use for keyboard-only users who couldn't tell when they had navigated to the clear action.
**Action:** When implementing icon-only buttons as secondary actions within inputs, always include explicit `focus-visible` utility classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus-visible:rounded`) to ensure clear keyboard navigation.
