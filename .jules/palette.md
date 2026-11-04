## 2026-06-29 - Missing Focus States on Interactive Icon Buttons
**Learning:** Custom interactive icon components in this app (e.g., HeartButton, NotificationBell, SidebarModal close button) frequently omit focus states despite having hover animations, negatively impacting keyboard accessibility.
**Action:** Ensure that all newly created or modified interactive elements, especially icon-only buttons without default browser styles, include explicit `focus-visible` utility classes (e.g., `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`).

## 2024-05-24 - Consistent Keyboard Focus Indicators
**Learning:** While checking accessibility on key interactive elements (e.g., custom icon buttons, game card triggers), I found that many had hover states but lacked visible focus indicators for keyboard users. Adding a consistent focus ring pattern greatly improves accessibility without compromising the design.
**Action:** Always apply `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (or similar utility classes from the established design system) to all interactive elements (`button`, `a`, `input`, etc.) to ensure keyboard navigability.

## 2026-11-04 - Dynamic ARIA Labels for Notification Counters
**Learning:** For components like a notification bell that have a dynamic counter, a static `aria-label="Notifications"` does not communicate the number of unread notifications to screen reader users when they focus the button.
**Action:** When creating notification or message buttons with counters, use a dynamic `aria-label` that includes the count (e.g., `aria-label={\`Notifications\${unread > 0 ? \` (\${unread} unread)\` : ''}\`}`). Also ensure all interactive elements within dropdowns, like "Mark all as read" buttons or individual notification items, have descriptive `aria-label`s and visible focus states (`focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`).
