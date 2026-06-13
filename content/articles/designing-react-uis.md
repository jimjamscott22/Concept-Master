---
title: Designing UIs for a React App
subtitle: Component boundaries, state, and the visual decisions that make an interface feel right
is_published: true
categories: [design]
tags: [fundamentals, web]
related_terms: [composition-vs-inheritance, pure-function, immutability, dependency-injection, observer-pattern]
related_articles: [learning-well-styled-react-apps]
---

A React UI is two designs wearing one coat: the *component design* (how you cut the
interface into pieces and pass data between them) and the *visual design* (spacing,
type, color, motion). Get the first wrong and the app is painful to change; get the
second wrong and it's painful to use. This article walks through the decisions worth
making deliberately in both.

## Compose, don't configure

The single most useful instinct in React is to **build small components and combine
them**, rather than growing one component with more and more boolean props. A
`<Button variant primary loading disabled iconOnly>` that branches internally on
every flag becomes a maze. Composition keeps each piece honest:

```tsx
// Configuration soup — every new need adds another prop and another branch
<Card title="BST" badge="new" collapsible footerActions actionsAlign="right" />

// Composition — the parent decides the shape by combining small parts
<Card>
  <Card.Header>
    <Card.Title>BST</Card.Title>
    <Badge>new</Badge>
  </Card.Header>
  <Card.Body>…</Card.Body>
  <Card.Footer align="right">
    <Button>Edit</Button>
  </Card.Footer>
</Card>
```

This is the same trade-off as **composition vs. inheritance** in OO design: prefer
assembling behavior from independent parts over a rigid hierarchy that you extend by
adding special cases. The `children` prop and "slot"-style props (`header`, `footer`)
are React's composition primitives.

## Decide where each piece of state lives

State placement is a design decision, not an afterthought. The rule of thumb:

- **Local state** for anything only one component cares about (an input's value, an
  open/closed toggle). Keep it in `useState` next to where it's used.
- **Lifted state** when two siblings must agree — move it up to their nearest common
  parent and pass it down. This is "lifting state up."
- **Shared/global state** (theme, current user, a cart) for things many distant
  components read. Reach for Context or a store *only here* — global state is
  expensive to reason about, so make a component earn its way out of local state.

A useful discipline is the **single source of truth**: each piece of data is owned in
exactly one place. Don't copy a prop into state "to be safe" — derive what you can
during render instead. Anything you can compute from existing state or props should
*not* be its own state.

```tsx
// Anti-pattern: duplicated state drifts out of sync
const [items, setItems] = useState(props.items)   // stale when props.items changes
const [count, setCount] = useState(items.length)  // now THREE things to keep aligned

// Better: one source, the rest is derived during render
const count = items.length
```

## Render should be a pure function of state

Treat your component tree as **UI = f(state)** — given the same props and state, a
component should produce the same output and no side effects during render. This is
the **pure function** idea applied to rendering, and it's why React leans so hard on
**immutability**: you replace state with a new value rather than mutating it in place,
so React can cheaply tell what changed.

```tsx
// Mutating in place — React sees the same array reference and may skip the update
todos.push(newTodo)
setTodos(todos)

// New reference — predictable re-render, and time-travel/undo stays possible
setTodos([...todos, newTodo])
```

Side effects (fetching, subscriptions, timers, DOM measurement) belong in `useEffect`,
not in the render body. A component that subscribes to an external source on mount and
unsubscribes on cleanup is the **observer pattern** in disguise — the effect's cleanup
function is your "unsubscribe."

## Pass dependencies in, don't reach out

Components are easier to test and reuse when their inputs arrive as props rather than
being grabbed from a global. That's **dependency injection** in UI form: a component
that takes an `onSave` callback or a `formatDate` function as a prop can be dropped
into a test, a Storybook story, or a different screen without dragging the whole app
along. Containers wire up the real dependencies; leaf components stay ignorant of where
their data came from.

## Now the visual layer

Once the structure is sound, the look is mostly about *restraint and consistency*:

- **Spacing is a system, not a guess.** Pick a scale (4px or 8px steps) and use only
  those values. Consistent rhythm reads as "designed"; arbitrary pixels read as sloppy.
- **Establish a type hierarchy.** Two or three font sizes with clear weight contrast
  beat six sizes that all look similar. Size and weight should signal importance before
  the user reads a word.
- **Limit the palette.** A background, a surface, a couple of text shades, and *one*
  accent goes a long way. Reserve the accent for what's interactive or important — if
  everything is highlighted, nothing is. (This is exactly how this app's theme tokens
  are structured: `bg`, `surface`, `border`, `text`, `muted`, `accent`.)
- **Make state visible.** Every interactive element needs hover, focus, active, and
  disabled treatments. Keyboard users rely on a clear focus ring — never remove it
  without replacing it.
- **Design the empty, loading, and error states.** The "happy path with data" is the
  easy 20%. Skeletons, spinners, "no results," and error messages are where an app
  feels finished or half-built.

## Accessibility is a design constraint, not a bolt-on

Use semantic elements (`<button>`, `<nav>`, `<label>`) so the browser gives you
keyboard handling and screen-reader semantics for free. Keep color contrast high
enough to read (WCAG AA is a 4.5:1 ratio for body text), make focus order follow the
visual order, and ensure nothing is operable by mouse only. Retrofitting this later is
far more expensive than designing for it from the start.

## Performance is felt, not measured (by users)

Don't reach for `memo`, `useMemo`, and `useCallback` reflexively — they add complexity
and have their own cost. Measure first, then memoize the genuinely expensive path. The
perceived-speed wins that matter most are usually higher level: **debounce** search
input so you don't fire a request per keystroke, paginate or virtualize long lists so
you render what's visible, and show optimistic UI or skeletons so the interface never
feels frozen while data loads.

## A checklist to design against

- Is each component small enough to describe in one sentence?
- Does every piece of state have exactly one owner, and is everything else derived?
- Are renders pure, with side effects quarantined in effects?
- Do leaf components receive their data and callbacks as props?
- Is spacing on a fixed scale, the palette small, and the accent reserved?
- Have I designed the focus, hover, empty, loading, and error states — not just the
  happy path?

Structure first, polish second. A well-decomposed tree with predictable state makes the
visual layer easy to iterate on; a tangled one makes every design tweak a refactor.
