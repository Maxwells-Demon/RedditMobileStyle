# Reddit Mobile Style — Implementation Plan

## 1. Objective

Build a Tampermonkey userscript that makes the classic/old Reddit frontend usable on a smartphone while preserving the old Reddit information architecture, Reddit/RES functionality, existing links, and normal desktop behavior.

The target is responsive old Reddit, not a replacement frontend. The script should override the desktop layout constraints that make the current page render as a shrunken desktop page on a phone.

Primary target:

- Old Reddit pages on old.reddit.com.
- Smartphone portrait and landscape layouts.
- RES enabled, including RES-selected posts and RES night mode.
- Existing subreddit CSS/themes must not be allowed to reintroduce desktop-width or positioned elements into the mobile layout.
- Desktop users should receive essentially no changes.

The screenshot demonstrates the current failure mode: the page is laid out for a 1024 CSS-pixel viewport and the smartphone browser scales that entire desktop layout down to fit the physical display. Text, vote controls, thumbnails, navigation, and sidebars consequently become too small for comfortable touch use.

## 2. Repository findings

Current repository contents:

- base.html
- README.md

README.md currently contains no implementation information.

### 2.1 base.html is a captured Reddit document head

The supplied base.html is not a complete page. It ends at </head> and contains no Reddit listing/body markup.

Therefore base.html can establish the page-level constraints and external assets, but the actual body selectors must be validated against a live old Reddit DOM during implementation.

### 2.2 Root cause visible in base.html

The document explicitly declares:

    <meta name="viewport" content="width=1024" />

This is the central cause of the screenshot's scaling problem. A smartphone is instructed to expose a 1024-CSS-pixel layout viewport, so the desktop Reddit layout can remain approximately 1024px wide and the browser scales it down.

Changing only this meta tag is not sufficient. Once the viewport becomes device-width, old Reddit's desktop CSS still contains fixed/minimum widths, floated columns, a desktop sidebar, fixed thumbnail dimensions, and other assumptions that need mobile overrides.

### 2.3 External Reddit CSS

The page imports several Reddit stylesheets, including the main Reddit stylesheet and expando/media/crosspost/tooltip/listing-comment/video stylesheets.

The userscript should not attempt to replace Reddit's stylesheet. It should inject a high-specificity mobile override stylesheet after/beside Reddit's CSS and use !important selectively where Reddit's desktop rules or subreddit CSS otherwise win.

Relevant imported assets include:

- reddit.*.css
- expando.*.css
- crosspost-preview.*.css
- author-tooltip.*.css
- listing-comments.*.css
- popup-notification.*.css
- crossposting-modal.*.css
- videoplayer.*.css
- videoplayercontrols.*.css

The exact hashed filenames are implementation details and must not be hard-coded into the userscript.

### 2.4 RES interaction

The captured document contains RES-specific styling, including selectors such as:

- .entry.res-selected
- .res-nightmode
- .author.friend
- .author.submitter
- .author.moderator
- .author.admin
- .author.alum

The mobile stylesheet must not destroy RES state styling. It should mostly control geometry, sizing, positioning, and overflow, while allowing RES to continue controlling selection/night-mode semantics.

### 2.5 Captured page contains injected development/debug CSS

base.html contains large inline style blocks for eruda-* and luna-* classes/fonts. These are not the old Reddit layout itself.

The userscript must avoid broad selectors such as a universal selector with global font/position rules that could accidentally affect those tools, media widgets, RES components, or Reddit dialogs.

## 3. Design principles

1. Responsive rather than scaled. Mobile should use the phone's actual CSS viewport and reflow the page.
2. Preserve old Reddit semantics. Do not rewrite post contents or replace Reddit links unnecessarily.
3. Progressive override. Fix the smallest structural constraint first, then override individual desktop components.
4. Touch-first sizing. Interactive controls need practical touch targets without making the feed excessively tall.
5. Content-first feed. The listing is the primary mobile surface; the desktop side column should not consume permanent horizontal space.
6. No horizontal scrolling for normal Reddit UI. Horizontal scrolling is acceptable only inside inherently wide content such as code blocks or tables.
7. Theme compatibility. RES night mode should continue to work. Subreddit CSS may be neutralized where it breaks mobile geometry.
8. Dynamic-page tolerance. Reddit/RES can mutate the DOM after initial load. The script must survive navigation and dynamically inserted posts.
9. Desktop preservation. Mobile rules must be gated behind a reliable mobile condition.
10. No dependency on Reddit's hashed asset names. Select semantic/class/id selectors instead.

## 4. Userscript architecture

Create a single userscript initially:

    reddit-mobile.user.js

Recommended metadata:

    // ==UserScript==
    // @name         Reddit Mobile Style
    // @namespace    RedditMobileStyle
    // @version      0.1.0
    // @description  Responsive mobile layout for old Reddit
    // @match        https://old.reddit.com/*
    // @grant        none
    // @run-at       document-start
    // @noframes
    // ==/UserScript==

Do not add privileged Tampermonkey grants unless a later requirement actually needs one.

### 4.1 Early viewport correction

At document-start:

1. Locate the existing viewport meta tag.
2. Replace its content with:

    width=device-width, initial-scale=1, viewport-fit=cover

3. Create it if Reddit did not provide one.
4. Avoid duplicate viewport tags.

This must happen before normal layout settles.

Important implementation detail: because the original page reports width=1024, the script must not initially depend on window.innerWidth <= 700 to detect mobile. Detect the phone before the viewport correction using a combination of:

- navigator.userAgentData?.mobile where available;
- navigator.maxTouchPoints > 0;
- screen.width / screen.height;
- the user agent as a fallback.

After the viewport is corrected, ordinary max-width media queries become useful.

### 4.2 Mobile state class

Add a stable root class:

    html.reddit-mobile-style

Only add it when the device is determined to be a phone/mobile-sized touch environment.

Optionally add:

- reddit-mobile-portrait
- reddit-mobile-landscape
- reddit-mobile-ready

Do not permanently modify the DOM on desktop.

### 4.3 Inject one controlled stylesheet

Create one style element with id reddit-mobile-style.

Keep all CSS in that stylesheet initially. Avoid dozens of small style nodes because debugging and precedence become harder.

Use a selector namespace such as:

    html.reddit-mobile-style body #siteTable { ... }

This reduces accidental interaction with unrelated pages and makes the override easy to disable.

## 5. Layout transformation

The desktop layout visible in the screenshot is effectively:

- global/header strip;
- main listing;
- left/right desktop side areas;
- fixed vote column;
- fixed thumbnail column;
- post entry content.

The mobile layout should become:

    [compact header]
    [optional subreddit/navigation row]
    [listing / primary content]
    [footer/navigation]

### 5.1 Global document constraints

Override:

- html
- body
- .content
- .listing-page
- #siteTable
- relevant page wrappers

Goals:

- width: 100%;
- min-width: 0;
- remove desktop min-width values;
- remove large desktop margins;
- prevent viewport-wide overflow;
- use box-sizing: border-box on the mobile-controlled subtree;
- keep vertical document scrolling on the page.

Do not globally set overflow-x: hidden until testing confirms it does not clip useful UI. Prefer fixing the source of overflow.

### 5.2 Sidebar/right column

The screenshot shows the desktop sidebar consuming a large portion of the available width.

On phones:

- hide .side by default;
- do not delete it from the DOM;
- do not destroy search/submit controls before checking whether they should be relocated.

Phase 1 can hide the desktop sidebar to establish a clean feed. Phase 2 can selectively expose important actions, especially search and navigation, in a mobile header/control row.

Keeping the nodes in the DOM preserves functionality and reduces breakage from Reddit/RES scripts.

### 5.3 Header

Target classic Reddit header selectors such as:

- #header
- #sr-header-area
- #header-bottom-left
- #header-bottom-right
- #header-img
- .pagename
- .tabmenu

Transform them from desktop positioning into a compact, normal-flow header.

Requirements:

- no fixed 1024px minimum width;
- no absolute/fixed desktop positioning that causes overflow;
- subreddit name remains visible;
- account links remain reachable;
- tabs remain horizontally usable or wrap/scroll deliberately;
- touch targets should be at least approximately 40px where practical;
- avoid a permanently tall header.

The first implementation should preserve Reddit's real header DOM rather than construct a replacement navbar. A replacement header is more invasive and creates unnecessary maintenance work.

### 5.4 Sort/navigation tabs

The old Reddit sort tabs visible in the screenshot are important.

On mobile:

- keep them;
- prevent them from forcing a fixed desktop width;
- allow wrapping or controlled horizontal scrolling;
- increase hit area without making text oversized;
- ensure the selected state remains obvious;
- keep RES-injected controls intact.

## 6. Post/listing transformation

Primary selectors to validate against the live DOM:

- #siteTable
- .thing
- .rank
- .midcol
- .entry
- .thumbnail
- .title
- .domain
- .tagline
- .flat-list.buttons
- .expando
- .md-container
- .md

### 6.1 Listing container

#siteTable should become a full-width single-column feed.

Remove:

- fixed desktop widths;
- desktop left/right margins;
- assumptions that multiple columns are available.

Use:

    width: 100%;
    min-width: 0;

### 6.2 Post row

Each .thing should become a compact responsive row.

Recommended initial structure:

- vote column: approximately 32–40px;
- content: minmax(0, 1fr);
- thumbnail: approximately 72–88px when a useful thumbnail exists.

CSS Grid is preferred because it makes the mobile geometry explicit:

    grid-template-columns: 36px minmax(0, 1fr) 80px;

For posts without useful thumbnails:

    grid-template-columns: 36px minmax(0, 1fr);

Use CSS selectors/class state to determine the no-thumbnail case rather than moving nodes in JavaScript unless the actual DOM requires it.

### 6.3 Vote controls

Keep Reddit's existing .midcol and arrows.

Mobile adjustments:

- enlarge the clickable area around the small sprite arrows;
- keep the visual sprite itself intact unless necessary;
- stack up/down controls vertically;
- display the relevant score without consuming excessive height;
- maintain selected/upvoted/downvoted states.

Avoid replacing vote buttons with custom controls because Reddit's event handlers and RES depend on the existing DOM.

### 6.4 Title

The title is the most important content.

Requirements:

- approximately 16px on phones as the initial target;
- line-height around 1.25–1.35;
- allow long words/URLs to wrap;
- remove desktop assumptions that force single-line rendering;
- visited/title colors should remain compatible with the active theme.

Do not truncate titles with JavaScript.

### 6.5 Metadata/tagline

Keep author, age, subreddit/domain, score and comment information.

Use smaller secondary typography than the title, but larger than the current scaled screenshot.

Allow wrapping where necessary:

    overflow-wrap: anywhere;
    white-space: normal;

### 6.6 Action links

The existing post action row (comments, share, save, hide, report, crosspost, RES controls, etc.) should:

- remain functional;
- wrap instead of overflowing;
- receive larger vertical padding;
- avoid forcing a single long desktop line.

Do not remove RES controls simply because they are visually secondary.

## 7. Thumbnail and media behavior

Thumbnails should remain useful rather than being reduced to tiny desktop dimensions.

Initial target:

- approximately 72–88px square in portrait;
- responsive down-sizing at very narrow widths;
- object-fit: cover;
- no fixed width that exceeds the available content.

For full media/expandos:

- .expando
- .media-preview
- .media-preview-content
- images
- videos
- iframes
- embeds

must have:

    max-width: 100%;
    min-width: 0;

Media should not exceed the viewport.

Images/videos should preserve aspect ratio.

Embeds that have an unavoidable intrinsic width should be placed in a horizontally scrollable container rather than causing the whole document to overflow.

## 8. Self-text, Markdown, tables and code

Old Reddit posts can contain arbitrary Markdown.

Mobile rules should cover:

- .md
- .md-container
- pre
- code
- table
- blockquotes
- lists
- images
- links

Rules:

- normal prose wraps;
- long URLs wrap;
- tables/code may scroll horizontally inside their own block;
- images never exceed their containing width;
- code should not cause page-level horizontal overflow.

Do not globally apply word-break: break-all to prose. Prefer overflow-wrap: anywhere for URLs and other pathological strings.

## 9. Sidebar functionality migration

After the basic responsive layout works, selectively migrate important sidebar actions.

Candidate controls:

1. search;
2. submit link;
3. submit text;
4. subreddit information;
5. account/navigation links.

The first version should not attempt to reproduce every desktop sidebar widget.

Possible mobile pattern:

    [Search]
    [Submit / navigation]
    [Listing]

Search should be easy to access but should not occupy permanent vertical space if it can be exposed by a compact button/toggle.

If JavaScript relocation is required, move nodes only after confirming Reddit/RES event handlers survive DOM movement. Prefer CSS repositioning over DOM movement.

## 10. Subreddit custom CSS

Subreddit styles can contain arbitrary desktop-oriented CSS and may override the global mobile stylesheet.

The script should provide a controlled normalization layer for mobile:

- neutralize min-width;
- neutralize large fixed widths/heights;
- neutralize absolute positioning on major layout containers;
- remove decorative backgrounds that cover the mobile viewport only where they interfere with navigation/content;
- preserve useful subreddit branding when it does not break layout.

Do not indiscriminately disable all subreddit CSS. That would destroy the classic Reddit customization model.

If specific problematic selectors recur during testing, add narrowly scoped overrides.

## 11. RES compatibility

Explicitly test with RES enabled.

Preserve:

- .res-selected
- .res-nightmode
- RES vote/selection state
- RES post filtering
- RES infinite scroll
- RES keyboard navigation where applicable
- RES expando behavior
- RES comment controls
- RES user tags/author styling

Mobile CSS should not depend on RES being installed.

Avoid changing classes that RES uses as state markers.

If RES injects controls after initial load, they should inherit the mobile action-row rules automatically.

## 12. Dynamic content and navigation

Reddit can update portions of the page without a complete document reload, and RES can inject/remove elements.

Use a small MutationObserver only where necessary.

Recommended observer strategy:

- observe document.body for structural additions;
- do not repeatedly rewrite every post;
- use CSS for most transformations;
- only run JavaScript when a newly inserted node needs a class/attribute or an actual structural operation;
- debounce/batch mutation handling.

Also account for:

- browser back/forward;
- Reddit route changes;
- RES infinite scrolling;
- newly loaded posts;
- expandos opening;
- comment loading.

If the mobile implementation is purely CSS after viewport correction, route-change handling can be minimal.

## 13. Breakpoints

Initial breakpoints should be evidence-driven rather than copied blindly.

Suggested starting points:

- mobile: <= 700px;
- very narrow phones: <= 380px;
- landscape/tablet: allow the mobile layout to remain active while there is insufficient room for the desktop sidebar.

The exact breakpoint must be validated on real devices.

Important: the breakpoint should describe the corrected viewport, not the original width=1024 viewport.

## 14. Touch interaction

The screenshot is a desktop UI scaled down, so visual size and hit-target size both need correction.

Target:

- primary controls around 40–44px effective hit area;
- sufficient spacing between vote arrows;
- post action links should not be adjacent enough to cause accidental taps;
- no hover-only functionality required for core actions.

Where the visual icon must remain small, enlarge the clickable element with padding/pseudo-elements rather than scaling the icon sprite unnecessarily.

## 15. Mobile browser chrome / safe areas

Use:

    viewport-fit=cover

and account for safe-area insets where a fixed/sticky header is introduced:

    padding-top: env(safe-area-inset-top)

Only use sticky/fixed positioning after confirming it does not interfere with Reddit's own scroll behavior.

Do not hard-code the height of the browser's Chrome/Safari UI; it is outside the page viewport.

## 16. Styling strategy and specificity

Use a layered stylesheet.

### Layer A — viewport/document normalization

- viewport;
- html/body width;
- overflow;
- box sizing.

### Layer B — global layout

- header;
- content;
- sidebar;
- site table.

### Layer C — listing/post layout

- thing;
- vote;
- entry;
- thumbnail;
- metadata;
- actions.

### Layer D — media/content

- expando;
- markdown;
- images;
- videos;
- tables;
- code.

### Layer E — RES/theme compatibility

- selected post;
- night mode;
- author states;
- injected controls.

Keep !important concentrated in the layout layer where it is necessary to defeat old Reddit/subreddit CSS. Do not use it on every declaration by default.

## 17. JavaScript responsibilities

JavaScript should remain small.

Required:

1. detect mobile environment before the 1024px viewport causes incorrect layout detection;
2. fix the viewport meta tag;
3. add/remove the mobile root class;
4. inject the stylesheet;
5. optionally handle dynamic route/content edge cases.

Avoid:

- rebuilding the post DOM;
- copying post content;
- manually calculating widths;
- replacing Reddit links;
- polling;
- per-post interval timers.

CSS should do the majority of the work.

## 18. Development sequence

### Phase 1 — Establish a reproducible baseline

- Confirm the screenshot's behavior on a real Android phone.
- Record viewport/device dimensions.
- Capture desktop and mobile screenshots.
- Inspect the live DOM for #header, .content, .side, #siteTable, .thing, .midcol, .entry, .thumbnail, and related nodes.
- Confirm which nodes are generated by Reddit versus RES.

### Phase 2 — Fix viewport

- Add the device-width viewport.
- Confirm text becomes physically readable.
- Confirm that this alone exposes horizontal overflow.
- Record the desktop layout dimensions that must then be overridden.

### Phase 3 — Collapse desktop shell

- full-width body/content;
- hide/collapse sidebar;
- normalize header;
- normalize navigation tabs;
- eliminate desktop min-widths.

### Phase 4 — Reflow posts

- convert .thing to mobile rows;
- resize vote controls;
- resize thumbnails;
- make entry content flexible;
- wrap titles/taglines/actions.

### Phase 5 — Media/content

- constrain expandos;
- constrain images/video/iframes;
- handle Markdown tables/code;
- test long titles and URLs.

### Phase 6 — RES

- test RES selected state;
- night mode;
- RES controls;
- infinite scroll;
- dynamic insertion.

### Phase 7 — Subreddit CSS hardening

- test several heavily customized subreddits;
- add narrowly scoped neutralization rules for recurring desktop-only customizations.

### Phase 8 — Polish

- tune typography;
- tune touch targets;
- tune narrow-screen breakpoint;
- tune landscape;
- reduce unnecessary vertical whitespace.

## 19. Testing matrix

Test at minimum:

### Devices/layouts

- Android phone, portrait;
- Android phone, landscape;
- narrow phone around 360px;
- common phone around 390–430px;
- desktop browser at 1280px+;
- desktop browser resized to a narrow window.

### Reddit pages

- front/custom feed;
- subreddit listing;
- search;
- post/comments page;
- user/profile page if supported by the same layout;
- subreddit with custom CSS;
- subreddit without custom CSS.

### Post types

- text/self post;
- link post;
- image;
- video;
- gallery;
- crosspost;
- post with long title;
- post with long domain;
- post with no thumbnail;
- post with thumbnail;
- Markdown-heavy self post;
- table;
- code block.

### RES

- night mode;
- selected post;
- infinite scroll;
- post filtering;
- expando;
- RES controls.

### Interaction

- upvote/downvote;
- open post;
- comments;
- save/hide/report;
- expand media;
- search;
- sort tabs;
- back/forward navigation.

## 20. Acceptance criteria

The first production-ready version should satisfy all of the following:

1. On a typical smartphone, Reddit is rendered at approximately normal mobile CSS scale rather than as a shrunken 1024px desktop screenshot.
2. The primary listing occupies the full available width.
3. No normal Reddit UI requires page-level horizontal scrolling.
4. Post titles are comfortably readable without zooming.
5. Vote controls are usable by touch.
6. Thumbnails are visibly useful and do not consume excessive width.
7. Post action links remain usable.
8. Media stays within the viewport.
9. Long URLs/titles do not break the page.
10. The desktop sidebar does not consume phone width.
11. RES remains functional.
12. RES night mode and selected-post styling remain recognizable.
13. Infinite-scroll posts receive the same mobile layout automatically.
14. Existing subreddit CSS cannot force the main mobile shell back to a fixed desktop width.
15. Desktop layout is unchanged outside the mobile condition.
16. The script does not require external libraries or privileged Tampermonkey permissions.

## 21. Failure modes to watch

### A. Only changing the viewport

This makes text larger but exposes the underlying fixed-width desktop layout. It is necessary but insufficient.

### B. Using window.innerWidth before fixing the viewport

The original width=1024 declaration can make the phone appear to the script as a 1024px viewport. Mobile detection must happen before relying on that value.

### C. Overusing position: fixed

A fixed mobile header can interfere with Reddit's own overlays, popups, and scroll behavior. Prefer normal/sticky layout until there is a demonstrated need for fixed positioning.

### D. Replacing Reddit DOM

Rebuilding posts/header markup is much more likely to break Reddit and RES JavaScript. Prefer CSS reflow and minimal DOM changes.

### E. Over-neutralizing subreddit CSS

A global reset can make every subreddit look identical and can break legitimate branding. Neutralize only properties that violate mobile geometry.

### F. Breaking expandos

Media and self-text frequently have intrinsic dimensions. Every media container must be tested after opening/closing an expando.

### G. Breaking RES state

Do not remove RES classes or move nodes unnecessarily.

### H. Horizontal overflow hidden as a band-aid

overflow-x: hidden can hide real bugs and clip content. Fix the fixed-width child first; use clipping only where intentional.

## 22. Suggested repository structure after implementation

    /
    ├── README.md
    ├── base.html
    ├── docs/
    │   └── plan.md
    └── reddit-mobile.user.js

If the userscript becomes large, split source CSS/JS during development and provide a generated single userscript for Tampermonkey. For the first implementation, a single file is preferable because it is directly installable and easier to debug.

## 23. Reference material

Use existing responsive old-Reddit userscripts as behavior/selector references only, not as code to copy.

In particular, the publicly available "Old Reddit Mobile Layout" userscript demonstrates the general approach of:

- correcting the viewport;
- moving the desktop shell to full width;
- hiding/repositioning the sidebar;
- reflowing .thing posts;
- constraining expandos/media;
- adapting controls for touch.

Its implementation should be independently designed for this repository and validated against the exact Reddit/RES DOM being targeted.

## 24. Immediate next implementation task

Before writing the userscript itself:

1. Inspect the live old Reddit DOM corresponding to the captured base.html.
2. Record the exact desktop geometry and selectors for the header, content wrapper, sidebar, site table, post, vote column, thumbnail, entry, and action rows.
3. Create a minimal userscript that only:
   - fixes the viewport;
   - detects mobile;
   - injects the root mobile class;
   - makes the page/content/sidebar full-width.
4. Verify that this removes the screenshot's 1024px scaling problem.
5. Then implement the post/grid rules incrementally, testing after each structural change.
6. Keep each stage small enough that regressions can be attributed to one CSS group.

The key implementation constraint is that base.html documents the head-level cause and dependencies, but not the actual listing DOM. The live body must therefore be treated as the authoritative source for final selectors before the userscript is written.
