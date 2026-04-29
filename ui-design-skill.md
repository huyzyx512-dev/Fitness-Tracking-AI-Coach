# UI Design Skill — Beautiful Interface Generation
# Lưu file này vào: .cursor/skills/ui-design.md
# Dùng khi: "@ui-design thiết kế [component]"

## Skill: ui-design
**Trigger**: @ui-design | /design | "thiết kế giao diện" | "redesign"

---

## Activation Protocol

Khi skill này được kích hoạt, LUÔN thực hiện theo thứ tự:

### Phase 1 — Audit (nếu có UI cũ)
```
Scan existing UI for:
□ Color contrast issues (WCAG AA minimum)
□ Inconsistent spacing (not on 8px grid)
□ Typography hierarchy problems
□ Missing hover/focus/active states
□ Non-semantic HTML structure
□ Hardcoded colors (not using variables)
□ Missing responsive breakpoints
```

### Phase 2 — Design Brief (chạy trong đầu trước khi code)
```
□ Tone: [pick one] minimal / editorial / bold / luxury / playful / utilitarian
□ Primary font: [pick from approved list]
□ Color palette: [define 5 variables]
□ Key interaction: [the one micro-interaction that defines this UI]
□ Memorable detail: [the one thing user will remember]
```

### Phase 3 — Build Order
```
1. CSS Variables & Reset
2. Typography system
3. Layout structure (Grid/Flex)
4. Component styles
5. Interactive states
6. Animations & transitions
7. Responsive adjustments
8. Accessibility audit
```

---

## Approved Font Combinations

| Mood | Display | Body | Import |
|------|---------|------|--------|
| Editorial | Fraunces | DM Sans | fonts.google.com |
| Modern Bold | Syne | Instrument Sans | fonts.google.com |
| Luxury | Cormorant Garamond | Outfit | fonts.google.com |
| Clean Pro | Cabinet Grotesk | Lora | fonts.google.com |
| Energetic | Bebas Neue | Mulish | fonts.google.com |
| Geometric | Clash Display | General Sans | fontshare.com |

---

## CSS Variable Template

```css
:root {
  /* Colors */
  --color-bg: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-surface-raised: #F5F4F1;
  --color-border: rgba(0, 0, 0, 0.08);
  --color-border-strong: rgba(0, 0, 0, 0.16);
  --color-text-primary: #111110;
  --color-text-secondary: #6B6B6B;
  --color-text-muted: #9B9B9B;
  --color-accent: #D4622A;        /* Change per project */
  --color-accent-light: #FAE8DF;  /* 10% opacity version */

  /* Typography */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Scale */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.25rem;    /* 20px */
  --text-xl: 1.5rem;     /* 24px */
  --text-2xl: 2rem;      /* 32px */
  --text-3xl: 3rem;      /* 48px */
  --text-4xl: 4rem;      /* 64px */

  /* Spacing (8px grid) */
  --space-1: 0.5rem;    /* 8px */
  --space-2: 1rem;      /* 16px */
  --space-3: 1.5rem;    /* 24px */
  --space-4: 2rem;      /* 32px */
  --space-6: 3rem;      /* 48px */
  --space-8: 4rem;      /* 64px */
  --space-12: 6rem;     /* 96px */
  --space-16: 8rem;     /* 128px */

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-pill: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg: 0 16px 40px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04);
  --shadow-hover: 0 20px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06);

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 250ms ease-out;
  --transition-slow: 400ms ease-out;

  /* Z-index scale */
  --z-base: 10;
  --z-dropdown: 20;
  --z-sticky: 30;
  --z-overlay: 40;
  --z-modal: 100;
}
```

---

## Component Patterns

### Card — Standard
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
```

### Button — Primary
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 44px;
  padding: 0 var(--space-3);
  background: var(--color-text-primary);
  color: var(--color-bg);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary:hover {
  transform: scale(1.02);
  opacity: 0.88;
}

.btn-primary:active {
  transform: scale(0.98);
}
```

### Input — Standard
```css
.input {
  width: 100%;
  height: 46px;
  padding: 0 var(--space-2);
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
  outline: none;
}

.input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}
```

---

## Scroll Animation (IntersectionObserver)

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
```

```css
[data-animate] {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

[data-animate].visible {
  opacity: 1;
  transform: translateY(0);
}

[data-animate]:nth-child(2) { transition-delay: 0.1s; }
[data-animate]:nth-child(3) { transition-delay: 0.2s; }
[data-animate]:nth-child(4) { transition-delay: 0.3s; }
```

---

## Quality Checklist (trước khi submit code)

```
□ Tất cả màu sắc dùng CSS variables (không hardcode hex)
□ Typography dùng đúng font đã chọn
□ Spacing theo 8px grid
□ Hover/focus states cho mọi interactive element
□ Mobile responsive tại 375px
□ Không dùng màu mặc định của AI (tím gradient, Inter font)
□ Contrast ratio đạt WCAG AA
□ Animation có prefers-reduced-motion fallback
□ Semantic HTML (không span/div cho mọi thứ)
□ Realistic placeholder content (không Lorem ipsum)
```
