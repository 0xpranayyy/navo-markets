# Design System

Navo's UI follows [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) with a custom Navo brand layer. No third-party component libraries are used.

## Brand

### Navo Mark

The mark is four SVG shapes (inline in `NavoMark.tsx`):

- Left stem + diagonal — **base color** (white on dark, ink on light)
- Right stem + arrowhead — **accent blue** (`#0A84FF`) — never green/red

| Lockup | Usage |
|--------|-------|
| `NavoHeaderLockup` | App header — mark + `NAVO` in `#4DA3FF`, 0.24em tracking |
| `NavoProductLockup` | Marketing — mark + lowercase `navo`, weight 800 |

Clear space: ≥ arrowhead height. No rotation, outline, or drop shadow on the mark.

### Color Tokens

```css
--navo-blue: #0A84FF;        /* CTAs, links */
--navo-blue-deep: #0A4DB5;
--navo-sky: #4DA3FF;         /* Header lockup */
--navo-bg: #000000;
--navo-surface: #1C1E22;
--navo-hairline: #26282C;
--navo-paper: #F4F5F7;        /* Light mode background */
--navo-yes: #34C759;         /* Market Yes only */
--navo-no: #FF453A;          /* Market No only */
--navo-text-secondary: #8B93A7;
--navo-text-tertiary: #6B7280;
```

Yes/No colors are **reserved for market pricing** — never used for brand elements.

## Typography

SF Pro scale via `src/theme/typography.ts`:

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Large Title | 34pt | 700 | Screen headers |
| Title 2 | 22pt | 700 | Sheet titles |
| Headline | 17pt | 600 | List row titles |
| Body | 17pt | 400 | Primary content |
| Subheadline | 15pt | 400 | Secondary labels |
| Footnote | 13pt | 400/600 | Section headers (uppercase) |
| Tab Label | 10pt | 500 | Tab bar |

Font stack: `-apple-system, 'SF Pro Display', 'Space Grotesk', system-ui`

Financial values use `font-variant-numeric: tabular-nums` (`.ios-tabular`).

## Layout

| Token | Value |
|-------|-------|
| Screen margin | 20pt |
| Grouped list radius | 10pt |
| Card radius | 12pt |
| Min touch target | 44pt |
| Search field height | 36pt |
| Tab bar height | 49pt + safe area |

## Components (`src/components/ios/controls.tsx`)

| Component | HIG Pattern |
|-----------|-------------|
| `LargeTitle` | Collapsible navigation title |
| `GroupedList` + `ListRow` | Settings-style inset grouped lists |
| `SearchField` | Standard iOS search bar |
| `SegmentedControl` | 32pt track |
| `PrimaryButton` / `SecondaryButton` | Pill CTAs |
| `SectionHeader` | Footnote uppercase section labels |
| `Toggle` | 51×31pt switch |

## Materials

Liquid Glass via `ThemeProvider`:

- `card` — blurred surface with hairline border
- `sheet` — bottom sheet shell with grabber
- `glassBlur` / `glassShine` — frosted chrome on landing CTAs

Dark grouped background: `#000000` · Light: `#F4F5F7`

## Sign-In (`SignInSheet`)

Custom auth UI replacing default Privy modal for primary flows:

- Apple button — white/black inverted per theme
- Google — brand icon + grouped surface
- Email — inline OTP with 6-digit centered input
- Bottom sheet with Navo mark, safe-area padding, PWA-aware copy

## PWA Assets

| Asset | Spec |
|-------|------|
| `apple-touch-icon.png` | 180×180, opaque black (iOS masks) |
| `icon-*-maskable.png` | Safe zone for adaptive icons |
| `og.png` | 1200×630 link preview |
| `favicon.svg` | Vector favicon for browser tabs |

## Accessibility

- `prefers-reduced-motion` disables scale animations
- 44pt minimum touch targets (`.ios-hit-44`)
- `aria-label` on icon buttons and sign-in controls
- `role="switch"` on Toggle component
