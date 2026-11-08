## 2026-06-29 - Missing Focus States on Interactive Icon Buttons
**Learning:** Custom interactive icon components in this app (e.g., HeartButton, NotificationBell, SidebarModal close button) frequently omit focus states despite having hover animations, negatively impacting keyboard accessibility.
**Action:** Ensure that all newly created or modified interactive elements, especially icon-only buttons without default browser styles, include explicit `focus-visible` utility classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`).

## 2024-05-24 - Consistent Keyboard Focus Indicators
**Learning:** While checking accessibility on key interactive elements (e.g., custom icon buttons, game card triggers), I found that many had hover states but lacked visible focus indicators for keyboard users. Adding a consistent focus ring pattern greatly improves accessibility without compromising the design.
**Action:** Always apply `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (or similar utility classes from the established design system) to all interactive elements (`button`, `a`, `input`, etc.) to ensure keyboard navigability.

## 2024-05-24 - Custom Checkbox Keyboard Focus Visibility
**Learning:** When building custom checkboxes using an invisible `<input type="checkbox" className="sr-only">` coupled with a visual styled `<div>`, the hidden input still receives keyboard focus, but the default focus outline is hidden because the element itself is visually hidden. This makes it impossible for keyboard users to see when the custom checkbox is focused.
**Action:** Always add the `peer` class to the hidden input (e.g., `className="sr-only peer"`) and use the `peer-focus-visible` modifier on the visible custom element (e.g., `peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2`) to show a focus ring when the hidden input receives focus.
