# ═══════════════════════════════════════════════
#  UI PROMPT LIBRARY — Bộ Prompt Thiết Kế Đẹp
# ═══════════════════════════════════════════════
# Copy từng prompt theo use case, điền vào [ngoặc]

---

## 🎨 PROMPT 1 — Thiết kế từ đầu (Greenfield)

```
Design a [tên component/trang] for [mô tả sản phẩm].

## Context
- Users: [ai dùng? ví dụ: startup founders, Vietnamese consumers, B2B SaaS teams]
- Purpose: [mục tiêu: sign up, browse products, manage tasks...]
- Tone: [ví dụ: professional & trustworthy / playful & energetic / minimal & calm]

## Technical
- Stack: [React + Tailwind / Next.js / Vanilla HTML+CSS]
- Mobile-first: yes
- Dark mode: [yes / no]

## Design Direction
- Aesthetic: [ví dụ: editorial magazine / modern SaaS dashboard / luxury brand]
- Font pairing: [display font] + [body font] — import from Google Fonts
- Color palette: define as CSS variables, use [warm neutral / cool slate / dark editorial]
- One memorable detail: [ví dụ: a smooth card hover with depth / animated counter / gradient text heading]

## Deliverables
- Complete, production-ready code
- All interactive states (hover, focus, active, loading, empty, error)
- Responsive at 375px and 1280px
- Inline comments on non-obvious design decisions
- Realistic content (no Lorem ipsum)
```

---

## 🔄 PROMPT 2 — Redesign (có UI cũ)

```
Redesign this component. DO NOT preserve the current layout or style.

## Current Problems
[Paste danh sách issues từ bước Analyze, hoặc để trống để AI tự tìm]

## New Direction
- Aesthetic: [ví dụ: clean SaaS / editorial / bold consumer app]
- Font: Replace current font with [Fraunces / Syne / Cormorant / Bebas Neue] + matching body font
- Colors: Define new palette as CSS variables — avoid purple gradients
- Layout: Use asymmetric grid, card-based sections, generous whitespace

## Keep
- [Chức năng nào giữ nguyên, ví dụ: form fields, navigation structure]

## Stack: [React + Tailwind / Next.js / Vanilla]

Deliver complete code. All hover/focus/active states. Mobile responsive.
```

---

## 🧩 PROMPT 3 — Component đơn lẻ

```
Create a [tên component] component.

## Variants
- Default state
- Hover state
- Active/Selected state
- Loading state
- Empty state
- Error state

## Design specs
- Follow the .cursorrules design system in this project
- Border-radius: var(--radius-md) [or --radius-lg for cards]
- Animation: 150–250ms ease-out transitions
- Font: var(--font-body) for labels, var(--font-display) for headings
- Colors: use CSS variables only, no hardcoded hex

## Examples of this component in context:
[Mô tả ngữ cảnh dùng, ví dụ: used in dashboard sidebar, appears after checkout, shown in empty search results]
```

---

## 📱 PROMPT 4 — Responsive Deep Fix

```
Make this component fully responsive without breaking the design.

## Breakpoints to handle
- 375px — mobile (primary)
- 640px — large mobile / small tablet
- 768px — tablet
- 1024px — desktop
- 1280px+ — wide desktop

## Approach
- Mobile-first CSS (min-width media queries)
- Use CSS Grid with auto-fit / minmax for fluid columns
- Fluid typography with clamp() for headings
- Touch targets minimum 44×44px
- Hamburger menu for nav on mobile (slide-in drawer, not dropdown)
- Hide decorative elements on mobile if needed for performance

Show the responsive CSS alongside the component.
```

---

## ✨ PROMPT 5 — Animation & Polish

```
Add animations and micro-interactions to this component.

## Rules
- CSS transitions only (no JS libraries unless complex)
- Timing: hover = 150ms, page load = 400–600ms staggered
- Properties: transform and opacity ONLY (no width/height animation)
- Stagger delay: 0.1s increments for lists/grids

## Specific interactions to add
□ Page load: fade-up with stagger (data-animate pattern)
□ Cards: translateY(-2px) + shadow on hover
□ Buttons: scale(1.02) hover, scale(0.98) active
□ Links: underline slide-in from left
□ [Add any specific interactions you want]

## Accessibility
Always include:
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎯 PROMPT 6 — Landing Page Hero

```
Design a hero section for [product/brand name].

## Product
- What it does: [1 sentence]
- Target users: [who]
- Key value prop: [what makes it different]

## Visual Direction
- Headline: large, [serif / display] font, max 6 words, no buzzwords
- Subheadline: 1–2 lines, conversational tone
- CTA: primary button + secondary text link
- Background: [subtle gradient mesh / textured / solid with geometric decoration / dark cinematic]
- Hero image/illustration: [describe what visual to use]

## Layout
- Asymmetric: text left, visual right (or full-width editorial)
- Decorative elements: SVG shapes, dot patterns, or gradient orbs — low opacity
- Scroll indicator: subtle animated down arrow

Stack: [React / HTML]
```

---

## 🏗 PROMPT 7 — Dashboard Layout

```
Design a dashboard for [product name].

## Pages/Sections
- Sidebar navigation: [list menu items]
- Header: [search / notifications / user avatar]
- Main content: [what data/widgets to show]
- [Add any specific panels]

## Data to display
[Mô tả các metric, list, chart cần hiển thị]

## Design
- Style: clean SaaS — white surfaces, subtle borders, no heavy shadows
- Accent color: [blue / indigo / green] — used sparingly for CTAs and active states
- Font: [pick one from approved list]
- Charts: use simple SVG or CSS-only — no chart libraries unless specified
- Cards: white bg, 1px border, 12–16px radius, 24px padding

## Layout structure
- Sidebar: 240px fixed, collapsible to 64px on mobile
- Header: 64px sticky
- Content: fluid, max-width 1200px, 32px padding

Stack: [React + Tailwind / Next.js]
Deliver: complete working layout with realistic data.
```

---

## 🔍 PROMPT 8 — Analyze & Audit

```
Analyze this UI and provide a detailed audit.

## Check for
### Visual Design
- Color contrast (WCAG AA: 4.5:1 for body, 3:1 for large text)
- Typography consistency (are sizes on a scale? is hierarchy clear?)
- Spacing inconsistencies (is it on an 8px grid?)
- Color usage (are CSS variables used? any hardcoded hex?)

### Layout
- Visual hierarchy (does the eye know where to go?)
- Grid alignment issues
- Whitespace problems (too tight / too loose)
- Mobile responsiveness gaps

### Interactions
- Missing hover states
- Missing focus indicators (accessibility)
- Missing loading/empty/error states
- Animation issues

### Code Quality
- Semantic HTML usage
- CSS organization
- Hardcoded values vs variables

## Output format
For each issue:
- Location: [where in the UI]
- Problem: [what's wrong]
- Severity: [critical / major / minor]
- Fix: [specific code or approach to fix it]

Prioritize by impact on user experience.
```

---

## 💡 TIPS — Cách dùng hiệu quả

### Làm cho output độc đáo hơn
Thêm vào cuối bất kỳ prompt nào:
```
Make one unexpected design choice that a junior developer wouldn't think of.
This should feel like it was designed by a senior product designer at a top-tier company.
```

### Yêu cầu nhiều options
```
Generate 3 different aesthetic directions for this component:
1. Minimal & typographic
2. Bold & expressive  
3. Soft & approachable
Show all 3 as separate code blocks.
```

### Lock design token
```
Use EXACTLY these design tokens, do not deviate:
--color-bg: #0F0F0D
--color-text: #F5F3EE
--color-accent: #E8C547
--font-display: 'Fraunces'
--font-body: 'DM Sans'
```

### Iteration prompt
```
Keep the layout and structure from my last message.
Only change: [typography / colors / spacing / animations]
Do not redesign — refine.
```
