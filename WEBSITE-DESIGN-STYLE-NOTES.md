# Website design guide

This guide describes the visual identity and user experience of the standalone
AutoRubric pages included in this repository: the [landing page](docs/landing/index.html)
and [research page](docs/research/index.html). The MkDocs documentation has its own
[theme configuration](mkdocs.yml) and [styles](docs/assets/stylesheets/extra.css).

## Principles

- **Familiar dark surfaces.** Use GitHub-like blue-gray backgrounds, clear text
  hierarchy and quiet borders so research, examples and documentation remain prominent.
- **A restrained gold accent.** Reserve gold for important actions and selective
  emphasis. Large decorative fills or competing accents would dilute that hierarchy.
- **Scientific credibility.** Make specific, supportable claims, link evidence and
  use precise technical names. Readers should be able to distinguish implemented
  capabilities, research findings and proposed work.
- **Readable at different sizes.** Let content determine wrapping and responsive
  layout. Preserve comfortable reading widths and usable navigation on narrow screens.
- **Purposeful motion.** Use motion sparingly for feedback or understandable content
  changes. Keep the page calm, respect reduced-motion preferences and prevent moving
  content from displacing surrounding text or controls.
- **Accessible interaction.** Preserve semantic headings, keyboard navigation,
  visible focus, readable contrast and meaningful accessible names. Essential content
  should remain available when fonts or scripts fail to load.

### Voice and content

Write for researchers and developers: plain language, named methods, concrete
examples and links to supporting papers or documentation. Avoid superlatives,
urgency and unsupported adoption or performance claims. Labels such as “Get Started”,
“Cookbook” and “Paper” should describe the destination or action.

Use technical terms consistently, including “LLM-as-a-Judge”, “Cohen's kappa”,
“Earth Mover's Distance”, “LiteLLM” and the API value `CANNOT_ASSESS`. Explain a term
when its meaning matters to the reader. Code examples should match the supported
API and accurately represent their scientific assumptions.

Keep titles, descriptions and structured metadata consistent with visible content.
Preserve upstream attribution, license information and any applicable funding
notice; changes in presentation should keep those notices readable.

## Design system

### Colors

Reuse the named CSS properties for surfaces, text, borders and accent colors.
The `:root` definitions in the source pages control the rendered values; this table
records the shared palette. Update the relevant pages together when changing it.

| Token | Value | Role |
| --- | --- | --- |
| `--bg-primary` | `#0d1117` | Page background |
| `--bg-secondary` | `#161b22` | Cards and code surfaces |
| `--bg-tertiary` | `#21262d` | Secondary controls and raised surfaces |
| `--text-primary` | `#e6edf3` | Headings and primary text |
| `--text-secondary` | `#8b949e` | Supporting text |
| `--accent` | `#f0b429` | Primary actions and selective emphasis |
| `--accent-hover` | `#f7c948` | Accent interaction feedback |
| `--border` | `#30363d` | Quiet surface boundaries and dividers |

Keep action labels legible against their fill, including dark text on gold buttons.
Syntax highlighting can use additional colors to distinguish code roles; those
colors should remain readable without becoming competing interface accents.

### Typography

Use **Inter** for interface and prose, with system sans-serif fallbacks, and
**JetBrains Mono** for code, with a monospace fallback. Preserve a clear hierarchy:
a prominent page title, quieter section headings, readable body text and subordinate
metadata. Emphasis should help readers scan rather than compete with headings.

Reuse the corresponding text styles when adding a component. Adjust size, weight,
line height and wrapping when content or accessibility requires it. Exact font sizes
and loaded font variants belong in the page styles.

### Spacing, layout and components

Keep shared container alignment, generous section separation and narrower measures
for long prose. Prefer flexible grids and wrapping controls; introduce breakpoints
where the content needs them. Check long labels and zoomed text as well as typical
screen widths.

Reuse existing spacing and corner treatments as a starting point. Add a new value
when it solves a concrete readability or layout problem, while preserving the
visual rhythm across related components.

| Component | User-facing intent |
| --- | --- |
| Header and navigation | Make documentation, research and project resources easy to find and reach. |
| Hero | State the purpose clearly, with selective gold emphasis and an obvious next step. |
| Actions | Establish a clear primary action; use link or button semantics appropriate to the behavior. |
| Cards and code | Group related content with quiet surfaces and borders; keep code selectable and readable. |
| Icons | Use a consistent line style. Hide purely decorative icons from assistive technology; label meaningful standalone controls. |
| Footer and notices | Keep attribution, license and funding information readable without competing with the main content. |

### Motion and accessibility

Changing headlines should retain a stable accessible name and a readable static
state. Reserve enough space for alternate text and font loading so content changes
do not shift the page. Avoid unnecessary screen-reader announcements and pause
nonessential rotation when it is not being viewed. Reduced-motion preferences
should yield a usable, calm experience.

Check keyboard access, focus visibility, contrast, text zoom, narrow-screen layout
and motion preferences in the rendered page when making relevant changes. These
principles describe the intended experience; they do not certify the current pages
as having passed an accessibility audit.

## Engineering and deployment

The standalone pages use self-contained HTML, inline CSS and minimal JavaScript.
Keep ordinary page changes within that structure; introduce dependencies only when
a clear user need justifies them. The research page uses KaTeX for displayed math.

| Source | Responsibility |
| --- | --- |
| [Landing HTML](docs/landing/index.html) | Landing content, styles and headline behavior |
| [Research HTML](docs/research/index.html) | Research content, styles and math rendering |
| [MkDocs configuration](mkdocs.yml) | Documentation navigation and theme |
| [Documentation styles](docs/assets/stylesheets/extra.css) | MkDocs-specific styling |
| [Pages workflow](.github/workflows/docs.yml) | Site build and publication configuration |
| [Domain configuration](docs/CNAME) | Domain used by the upstream publication workflow |

Edit the source files. `site/` is generated output and will be overwritten by a build.
The Pages workflow in this checkout restricts official-site publication to
`delip/autorubric`; pushing this fork does not publish to `autorubric.org`.
A separate deployment needs its own domain and URL configuration.

Timing constants, DOM structure and sizing algorithms are maintained in the source
code. Keep dated defects and audit findings with their supporting evidence in an
issue or review record. Update this guide when the intended design changes.
