# chinmayrelkar.github.io

Source for my personal site, hosted on GitHub Pages at [chinmayrelkar.github.io](https://chinmayrelkar.github.io).

Plain HTML, CSS, and JS — no build step and no framework.

## Structure

- `index.html` — the single-page site: Writing, Projects, Experience, Contact
- `404.html` — not-found page, served by GitHub Pages
- `writing/` — long-form posts, one self-contained HTML file each
- `assets/style.css` — all styles, shared by every page. Theming is
  `light-dark()` over a `color-scheme` that `data-theme` overrides
- `assets/script.js` — theme toggle, active-section nav highlighting, the Writing
  feed, and post heading numbering, dividers, breadcrumb and reading progress
- `assets/og-image.png` — Open Graph / Twitter card image

## Type scale

Heading sizes come from five custom properties in `:root`, on an even scale
between body text and the title. Set a heading from these, never a bare
`font-size`:

| Step | Role        | Variable      | Size    |
| ---- | ----------- | ------------- | ------- |
| 10   | title       | `--fs-title`  | 42.0px  |
| 7    | heading 1   | `--fs-h1`     | 33.7px  |
| 5    | heading 2   | `--fs-h2`     | 28.1px  |
| 3    | heading 3   | `--fs-h3`     | 22.6px  |
| 1    | normal text | `--fs-body`   | 17.0px  |

In a post, `h1` is the title, `h2` is heading 1, and `h3` is heading 2. All
headings use `--ink` rather than the accent colour.

Each block of content closes with a divider whose weight matches its depth:
green (2px) ends a section, white (1px) ends a subsection, faint grey ends an
`h4` block. Only the green rules are authored, as `<hr class="post-hr">` before
each `<h2>`; `script.js` generates the rest and closes the final section.

## Sticky bars

Two stacked sticky bars, whose heights live in `--header-h` and `--nav-h`.
Anything scrolling to an anchor must offset by them or the target lands
underneath — that is what the `scroll-margin-top` rules on `section` and
`.post h2, .post h3` are for. `--header-h` is the header's *total* height, so
`.site-header-inner` is 1px shorter to leave room for the border.

`.site-header` carries the wordmark on every page. On post pages it also holds
the breadcrumb: `Writing › Title › heading 1 › heading 2`, where the last two
track the reader's position. Only the deepest level in view is green.

Below 640px the header stacks into three single-line rows — wordmark, fixed
context, live position — so its height stays constant while scrolling. Only pages
that have a breadcrumb get the taller bar, via `:root:has(.crumb)`.

## The Writing feed

`index.html` ships a static list of posts, which `assets/script.js` then replaces
at runtime with the live Medium feed (via the `api.rss2json.com` proxy) merged with
the `LOCAL_POSTS` array and sorted by date.

Two things follow from that:

- **Adding a post under `writing/` means editing two places** — add an entry to
  `LOCAL_POSTS` in `assets/script.js`, *and* add the same `<li>` to the static list
  in `index.html`. The static copy is what search engines and no-JS visitors see.
- If the feed fetch fails or times out (6s), the script falls back to
  `MEDIUM_FALLBACK`, so the section is never empty.

## Local preview

Open `index.html` directly, or serve the directory so that relative paths and the
feed fetch behave as they do in production:

```sh
python3 -m http.server 8000
```
