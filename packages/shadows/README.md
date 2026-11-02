# @reuse-sh/shadows

A CSS shadow scale with six levels, from a small control to a floating surface. Each level has two soft layers and an optional hairline ring.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Build each level from two layers.** Every level is a close shadow and a wide one, drawn from one color and one strength.
- **Set color and strength once.** --re-shadow-color and --re-shadow-strength drive all six levels, and a dark ancestor raises the strength and lightens the ring.
- **Use a ring, not a border.** The ring variants add a hairline in the shadow itself, so the element's size never changes.
- **Work without JavaScript.** The levels and cards are plain classes in one stylesheet.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/shadows
```

<!-- examples:start -->

## Usage

[Documentation](https://reuse.sh/shadows/getting-started)

### React

#### Usage

Import the stylesheet and add one shadow class to the element that needs depth. The ring variant combines its hairline outline and shadow in one box-shadow declaration.

```tsx
import "@reuse-sh/shadows/styles.css";

<div className="re-shadow-ring-md">...</div>
```

#### Integration

Use re-shadow-xs, sm, md, lg, xl or 2xl for depth only. Add ring in the class name to include the hairline edge. No controller, React state or JavaScript initialization is needed.

#### Tailwind 4

For Tailwind variants, remove the plain styles.css import and import the adapter in your Tailwind stylesheet instead. It registers the same shadow classes as utilities, so hover and responsive variants use your existing Tailwind build.

```css
@import "tailwindcss";
@import "@reuse-sh/shadows/tailwind.css";
```

```tsx
<article className="re-shadow-ring-sm hover:re-shadow-ring-md">Print details</article>
```

### HTML + JavaScript

#### Usage

Import the stylesheet and add one shadow class to the element that needs depth. The ring variant combines its hairline outline and shadow in one box-shadow declaration.

```html
<div class="re-shadow-ring-md">...</div>
```

#### Styles

Import the package stylesheet once. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/shadows/styles.css";
```

#### Integration

Use re-shadow-xs, sm, md, lg, xl or 2xl for depth only. Add ring in the class name to include the hairline edge. No controller, React state or JavaScript initialization is needed.

#### Tailwind 4

For Tailwind variants, remove the plain styles.css import and import the adapter in your Tailwind stylesheet instead. It registers the same shadow classes as utilities, so hover and responsive variants use your existing Tailwind build.

```css
@import "tailwindcss";
@import "@reuse-sh/shadows/tailwind.css";
```

```html
<article class="re-shadow-ring-sm hover:re-shadow-ring-md">Print details</article>
```

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/shadows
- Guide for coding agents: https://reuse.sh/shadows/guide.md

## License

MIT
