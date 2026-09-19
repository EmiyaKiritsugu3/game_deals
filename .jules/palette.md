## 2024-05-24 - Interactive Element Accessibility
**Learning:** For custom tab-like navigation (e.g., `WishlistTabs.tsx`), `role="tab"` and `role="tablist"` shouldn't be added without full keyboard arrow navigation implementation. Instead, native `<button>` elements with `aria-current="page"` (or `"true"`) are better for simple state toggles, and `focus-visible` states are critical since custom styles often strip default browser outlines.
**Action:** Always add explicit `focus-visible:outline-2 focus-visible:outline-primary` classes to interactive elements that have custom hover/active styles, and use semantic native elements over incomplete ARIA patterns.

## 2024-05-24 - Interactive Element Accessibility
**Learning:** For custom tab-like navigation (e.g., `WishlistTabs.tsx`), `role="tab"` and `role="tablist"` shouldn't be added without full keyboard arrow navigation implementation. Instead, native `<button>` elements with `aria-current="page"` (or `"true"`) are better for simple state toggles, and `focus-visible` states are critical since custom styles often strip default browser outlines.
**Action:** Always add explicit `focus-visible:outline-2 focus-visible:outline-primary` classes to interactive elements that have custom hover/active styles, and use semantic native elements over incomplete ARIA patterns.
