## 2026-06-29 - Missing Focus States on Interactive Icon Buttons
**Learning:** Custom interactive icon components in this app (e.g., HeartButton, NotificationBell, SidebarModal close button) frequently omit focus states despite having hover animations, negatively impacting keyboard accessibility.
**Action:** Ensure that all newly created or modified interactive elements, especially icon-only buttons without default browser styles, include explicit `focus-visible` utility classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`).

## 2024-05-24 - Consistent Keyboard Focus Indicators
**Learning:** While checking accessibility on key interactive elements (e.g., custom icon buttons, game card triggers), I found that many had hover states but lacked visible focus indicators for keyboard users. Adding a consistent focus ring pattern greatly improves accessibility without compromising the design.
**Action:** Always apply `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (or similar utility classes from the established design system) to all interactive elements (`button`, `a`, `input`, etc.) to ensure keyboard navigability.
## 2026-11-01 - Missing Focus States on Custom Checkboxes
**Learning:** Custom checkboxes in this app often use visually hidden native inputs (`sr-only`) to power custom visual components (e.g., SVG checkmarks). These custom elements frequently lack keyboard focus indicators, making them inaccessible for keyboard users navigating via Tab.
**Action:** When creating or modifying custom checkboxes that hide the native input, ensure the hidden input has the `peer` class (e.g., `className="sr-only peer"`) and apply `peer-focus-visible` outline styles (e.g., `peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2`) to the adjacent custom visual container to satisfy WCAG 2.4.7 Focus Visible guidelines.
