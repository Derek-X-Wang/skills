# Web Application Quality Criteria

Evaluation rubric for web applications (React, Next.js, Vue, Svelte, etc.). Customize weights and add project-specific dimensions during `/harness setup`.

## Dimensions

### 1. Design Quality (Weight: High)

Is the visual design coherent — do colors, typography, layout, and spacing create a unified experience? Or does it feel like separate components randomly assembled?

| Score | Description |
|-------|-------------|
| 1 | No visual coherence. Components look like they belong to different apps. |
| 2 | Some visual consistency but jarring transitions between sections. |
| 3 | Acceptable — follows a basic theme but feels generic. |
| 4 | Cohesive design language. Intentional choices visible throughout. |
| 5 | Distinctive, unified experience. Every element reinforces the design direction. |

### 2. Originality (Weight: High)

Does the UI show deliberate creative decisions, or does it default to generic AI patterns? Watch for telltale signs: purple gradients over white cards, excessive rounded corners, generic hero sections with large headings and two buttons.

| Score | Description |
|-------|-------------|
| 1 | Pure template/AI defaults. Indistinguishable from generic output. |
| 2 | Mostly defaults with minor customization. |
| 3 | Some original choices but the overall feel is familiar/safe. |
| 4 | Clear creative direction. Distinctive look that fits the product. |
| 5 | Memorable design with bold, intentional choices. Doesn't look AI-generated. |

### 3. Craft (Weight: Medium)

Technical execution of the visual design. Typography hierarchy, spacing consistency, contrast ratios, alignment, responsive behavior.

| Score | Description |
|-------|-------------|
| 1 | Broken layout, overlapping elements, illegible text. |
| 2 | Visible spacing/alignment issues. Inconsistent typography. |
| 3 | Technically sound but unremarkable. No major issues. |
| 4 | Polished — consistent spacing, good hierarchy, proper contrast. |
| 5 | Pixel-perfect. Every detail is intentional and consistent. |

### 4. Functionality (Weight: High)

Does every component perform its specific task in the user flow? Do interactions work end-to-end? Does state persist correctly?

| Score | Description |
|-------|-------------|
| 1 | Core features broken. App is non-functional. |
| 2 | Basic flow works but significant bugs in secondary features. |
| 3 | All described features work on the happy path. Edge cases unhandled. |
| 4 | Features work reliably including common edge cases. Good error handling. |
| 5 | Bulletproof. Handles edge cases, error states, loading states, empty states gracefully. |

### 5. Responsiveness (Weight: Medium)

Does the app work across screen sizes? Not just "doesn't break" but actually provides a good experience on mobile, tablet, and desktop.

| Score | Description |
|-------|-------------|
| 1 | Completely broken on non-desktop screens. |
| 2 | Technically accessible but poor experience on mobile. |
| 3 | Acceptable on all sizes. Basic responsive behavior. |
| 4 | Good experience across sizes. Thoughtful layout adaptations. |
| 5 | Excellent responsive design. Each breakpoint feels intentional. |

### 6. Performance (Weight: Low)

Page load speed, interaction responsiveness, bundle size, unnecessary re-renders.

| Score | Description |
|-------|-------------|
| 1 | Unusably slow. Visible lag on interactions. |
| 2 | Noticeable performance issues. Slow transitions or loads. |
| 3 | Acceptable performance. No major bottlenecks. |
| 4 | Fast and smooth. Efficient data loading and rendering. |
| 5 | Optimized. Lazy loading, code splitting, minimal re-renders. |

## Optional Dimensions

Add these when relevant to the project:

- **Accessibility**: ARIA labels, keyboard navigation, screen reader support, color contrast
- **Data Integrity**: Correct data display, accurate calculations, proper data persistence
- **Security**: Input validation, XSS prevention, auth state handling, CSRF protection
- **SEO**: Meta tags, semantic HTML, structured data, crawlability

## Testing Tools

For web apps, the evaluator can use these tools if available:
- **Playwright MCP**: Click through the app, fill forms, check behavior
- **Browser DevTools**: Check console errors, network requests, performance
- **Lighthouse**: Automated performance/accessibility scoring

These are opt-in — the evaluator should note if tools were unavailable and their evaluation was code-review only.
