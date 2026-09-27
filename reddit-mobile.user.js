// ==UserScript==
// @name         Reddit Mobile Style
// @namespace    RedditMobileStyle
// @version      1.2.0
// @description  Responsive shell for classic old Reddit on smartphones
// @match        https://*.reddit.com/*
// @grant        none
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    /*
     * Stage 1:
     * Fix the 1024px mobile viewport and collapse the desktop shell.
     *
     * This intentionally does NOT rebuild Reddit's DOM or reflow .thing posts yet.
     * The next stage will be driven by measurements from the target Android/RES setup.
     */

    const ROOT_CLASS = 'reddit-mobile-style';
    const STYLE_ID = 'reddit-mobile-style';

    function isMobileDevice() {
        // Do this before changing the viewport. On old Reddit the original
        // viewport declaration can make innerWidth report the desktop canvas.
        if (navigator.userAgentData && navigator.userAgentData.mobile === true) {
            return true;
        }

        if (navigator.maxTouchPoints > 0) {
            const width = Math.min(
                window.screen && window.screen.width || 0,
                window.screen && window.screen.height || 0
            );

            // Phones/tablet-like touch displays. Deliberately exclude large
            // desktop touch monitors from the first mobile baseline.
            if (width > 0 && width <= 700) {
                return true;
            }
        }

        const ua = navigator.userAgent || '';
        if (/Android/i.test(ua)) {
            return true;
        }

        if (/iPhone|iPod/i.test(ua)) {
            return true;
        }

        // iPad is not the primary target, but treat a small touch viewport as
        // mobile rather than applying desktop Reddit geometry.
        if (/iPad/i.test(ua) && navigator.maxTouchPoints > 0) {
            return true;
        }

        return false;
    }

    if (!isMobileDevice()) {
        return;
    }

    function fixViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');

        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';

            const head = document.head || document.documentElement;
            head.insertBefore(viewport, head.firstChild || null);
        }

        viewport.setAttribute(
            'content',
            'width=device-width, initial-scale=1, viewport-fit=cover'
        );
    }

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
/*
 * Reddit Mobile Style 1.0.0
 * Stage 2: mobile listing reflow.
 */
html.reddit-mobile-style,
html.reddit-mobile-style body {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
}

html.reddit-mobile-style body {
    margin: 0 !important;
    overflow-x: hidden;
}

html.reddit-mobile-style body > *,
html.reddit-mobile-style #header,
html.reddit-mobile-style #sr-header-area,
html.reddit-mobile-style #header-bottom-left,
html.reddit-mobile-style #header-bottom-right,
html.reddit-mobile-style .content,
html.reddit-mobile-style .side {
    box-sizing: border-box;
}

html.reddit-mobile-style #header {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    position: relative !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    margin: 0 !important;
}

html.reddit-mobile-style #sr-header-area {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    position: relative !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    margin: 0 !important;
    box-sizing: border-box;
}

html.reddit-mobile-style #header-bottom-left,
html.reddit-mobile-style #header-bottom-right {
    position: relative !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
    box-sizing: border-box;
}

html.reddit-mobile-style #sr-header-area .width-clip,
html.reddit-mobile-style #sr-header-area .sr-list {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    box-sizing: border-box;
}

html.reddit-mobile-style #header-bottom-left .pagename,
html.reddit-mobile-style #header-bottom-left .tabmenu {
    float: none !important;
}

html.reddit-mobile-style #header-bottom-left .tabmenu {
    flex: 1 1 auto;
    width: auto !important;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap !important;
    -webkit-overflow-scrolling: touch;
}

html.reddit-mobile-style #header-bottom-left {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    min-height: 40px;
}

html.reddit-mobile-style #header-bottom-right {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    min-height: 32px;
}

html.reddit-mobile-style #header-img {
    flex: 0 0 auto;
}

html.reddit-mobile-style .tabmenu {
    min-width: 0 !important;
    max-width: 100% !important;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
}

html.reddit-mobile-style .tabmenu li {
    float: none !important;
    display: inline-block;
}

html.reddit-mobile-style .content {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    margin: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    box-sizing: border-box;
}

html.reddit-mobile-style .side {
    display: none !important;
}

html.reddit-mobile-style #siteTable {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    box-sizing: border-box;
}

/*
 * Do not globally force every descendant to fit. Media, RES widgets and
 * Reddit dialogs can have intentionally different geometry. These rules
 * only remove fixed-width constraints from the classic shell.
 */
html.reddit-mobile-style #header img,
html.reddit-mobile-style #header iframe,
html.reddit-mobile-style #header table,
html.reddit-mobile-style .content,
html.reddit-mobile-style #siteTable {
    max-width: 100%;
}

@media (orientation: landscape) {
    html.reddit-mobile-style #header-bottom-left,
    html.reddit-mobile-style #header-bottom-right {
        min-height: 32px;
    }
}

@media (max-width: 380px) {
    html.reddit-mobile-style #header-bottom-left,
    html.reddit-mobile-style #header-bottom-right {
        width: 100% !important;
    }
}
        `;

        (document.head || document.documentElement).appendChild(style);
    }

    function injectPostLayout() {
        const style = document.getElementById(STYLE_ID);
        if (!style) return;

        style.textContent += `
/*
 * Stage 2: listing layout.
 * Match the classic Reddit DOM: .thing contains .rank, .midcol,
 * .thumbnail and .entry as siblings. Do not turn those into arbitrary
 * grid rows; that was the cause of ranks/thumbnails appearing below posts.
 */

html.reddit-mobile-style #siteTable {
    display: block !important;
}

/* The post number is desktop-only information and wastes scarce width. */
html.reddit-mobile-style #siteTable > .thing > .rank,
html.reddit-mobile-style #siteTable > .thing > .rank-spacer,
html.reddit-mobile-style #siteTable > .thing > .clearleft {
    display: none !important;
}

/* vote rail | thumbnail | text */
html.reddit-mobile-style #siteTable > .thing {
    position: relative !important;
    display: grid !important;
    grid-template-columns: 34px 76px minmax(0, 1fr) !important;
    align-items: start !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    overflow: visible !important;
}

html.reddit-mobile-style #siteTable > .thing > .midcol {
    grid-column: 1 !important;
    grid-row: 1 !important;
    align-self: center !important;
    display: flex !important;
    flex: none !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: visible !important;
    width: 34px !important;
    min-width: 34px !important;
    max-width: 34px !important;
    height: auto !important;
    margin: 0 !important;
    padding: 6px 0 !important;
    box-sizing: border-box !important;
    float: none !important;
}

html.reddit-mobile-style #siteTable > .thing > .midcol .arrow {
    position: relative !important;
    display: block !important;
    flex: 0 0 14px !important;
    width: 15px !important;
    height: 14px !important;
    margin: 2px auto !important;
    padding: 0 !important;
    background-position: center center !important;
    background-repeat: no-repeat !important;
    cursor: pointer !important;
    pointer-events: auto !important;
}

/* Preserve Reddit's 15px sprite. Enlarge only the clickable area. */
html.reddit-mobile-style #siteTable > .thing > .midcol .arrow::after {
    content: "" !important;
    position: absolute !important;
    top: -8px !important;
    right: -8px !important;
    bottom: -8px !important;
    left: -8px !important;
}

html.reddit-mobile-style #siteTable > .thing > .midcol .score {
    display: block !important;
    width: 34px !important;
    min-height: 14px !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 14px !important;
    text-align: center !important;
    overflow: visible !important;
    white-space: nowrap !important;
}

/* Thumbnail is a sibling of .entry in old Reddit, not a child of it. */
html.reddit-mobile-style #siteTable > .thing > .thumbnail {
    grid-column: 2 !important;
    grid-row: 1 !important;
    align-self: center !important;
    justify-self: start !important;
    display: block !important;
    float: none !important;
    position: relative !important;
    width: 68px !important;
    max-width: 68px !important;
    min-width: 0 !important;
    height: 68px !important;
    max-height: 68px !important;
    margin: 6px 8px 6px 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    text-align: center !important;
}

html.reddit-mobile-style #siteTable > .thing > .thumbnail img {
    display: block !important;
    width: 68px !important;
    max-width: 68px !important;
    height: 68px !important;
    max-height: 68px !important;
    margin: 0 auto !important;
    object-fit: cover !important;
}

/* Keep the actual post content in the third grid column. */
html.reddit-mobile-style #siteTable > .thing > .entry {
    grid-column: 3 !important;
    grid-row: 1 !important;
    align-self: stretch !important;
    min-width: 0 !important;
    width: auto !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 3px 5px 5px 0 !important;
    box-sizing: border-box !important;
    float: none !important;
    overflow: visible !important;
}

html.reddit-mobile-style #siteTable > .thing > .entry > *,
html.reddit-mobile-style #siteTable > .thing > .entry .title,
html.reddit-mobile-style #siteTable > .thing > .entry .tagline,
html.reddit-mobile-style #siteTable > .thing > .entry .flat-list,
html.reddit-mobile-style #siteTable > .thing > .entry .expando,
html.reddit-mobile-style #siteTable > .thing > .entry .md-container {
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
}

html.reddit-mobile-style #siteTable > .thing .title {
    display: block !important;
    line-height: 1.25 !important;
    overflow-wrap: anywhere !important;
}

html.reddit-mobile-style #siteTable > .thing .domain {
    overflow-wrap: anywhere !important;
}

html.reddit-mobile-style #siteTable > .thing .tagline {
    font-size: 13px !important;
    line-height: 1.35 !important;
    overflow-wrap: anywhere !important;
}
html.reddit-mobile-style #siteTable > .thing .flat-list,
html.reddit-mobile-style #siteTable > .thing .flat-list a {
    font-size: 13px !important;
    line-height: 1.45 !important;
}

html.reddit-mobile-style #siteTable > .thing .flat-list {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 0 7px !important;
    line-height: 1.5 !important;
}

html.reddit-mobile-style #siteTable > .thing .flat-list li {
    float: none !important;
    display: inline-block !important;
    min-width: 0 !important;
    max-width: 100% !important;
}


html.reddit-mobile-style #siteTable > .thing .share-button,
html.reddit-mobile-style #siteTable > .thing .source-url,
html.reddit-mobile-style #siteTable > .thing .report-button,
html.reddit-mobile-style #siteTable > .thing .crosspost-button,
html.reddit-mobile-style #siteTable > .thing .flat-list > li:has(.share-button),
html.reddit-mobile-style #siteTable > .thing .flat-list > li:has(.source-url),
html.reddit-mobile-style #siteTable > .thing .flat-list > li:has(.report-button),
html.reddit-mobile-style #siteTable > .thing .flat-list > li:has(.crosspost-button) {
    display: none !important;
}


html.reddit-mobile-style #siteTable > .thing .flat-list li:has(a[href*="l="]),
html.reddit-mobile-style #siteTable > .thing .flat-list li:has(a[onclick*="l="]),
html.reddit-mobile-style #siteTable > .thing .flat-list li:has(a[href*="linkcomments"]),
html.reddit-mobile-style #siteTable > .thing .flat-list li:has(a[onclick*="share"]),
html.reddit-mobile-style #siteTable > .thing .flat-list li:has(a[onclick*="source"]),
html.reddit-mobile-style #siteTable > .thing .flat-list li:has(a[onclick*="report"]),
html.reddit-mobile-style #siteTable > .thing .flat-list li:has(a[onclick*="crosspost"]) {
    display: none !important;
}

/* Expandos/media must respect the phone content column. */
html.reddit-mobile-style #siteTable > .thing .expando,
html.reddit-mobile-style #siteTable > .thing .expando-content,
html.reddit-mobile-style #siteTable > .thing .media-preview,
html.reddit-mobile-style #siteTable > .thing .media-preview-content,
html.reddit-mobile-style #siteTable > .thing iframe,
html.reddit-mobile-style #siteTable > .thing video,
html.reddit-mobile-style #siteTable > .thing object,
html.reddit-mobile-style #siteTable > .thing embed {
    max-width: 100% !important;
    box-sizing: border-box !important;
}

html.reddit-mobile-style #siteTable > .thing .md {
    max-width: 100% !important;
    overflow-wrap: anywhere !important;
}

html.reddit-mobile-style #siteTable > .thing .md pre {
    max-width: 100% !important;
    white-space: pre !important;
    overflow-x: auto !important;
}

html.reddit-mobile-style #siteTable > .thing .md table {
    max-width: 100% !important;
    overflow-x: auto !important;
}

html.reddit-mobile-style .res-selected {
    min-width: 0 !important;
    max-width: 100% !important;
}

/* Mobile drawers for the two side areas. */
html.reddit-mobile-style .rms-drawer-backdrop {
    position: fixed !important;
    inset: 0 !important;
    z-index: 2147483000 !important;
    display: none !important;
    background: rgba(0, 0, 0, .28) !important;
}

html.reddit-mobile-style .rms-drawer-backdrop.rms-open {
    display: block !important;
}

html.reddit-mobile-style .rms-drawer {
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    z-index: 2147483001 !important;
    display: block !important;
    width: min(220px, 68vw) !important;
    max-width: 68vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100vh !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
    background: #e1e1e1 !important;
    transition: transform .18s ease !important;
}

html.reddit-mobile-style .rms-drawer-content {
    display: block !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: 100% !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 8px !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    overscroll-behavior: contain !important;
    touch-action: pan-y !important;
}

html.reddit-mobile-style .rms-drawer-content > * {
    touch-action: pan-y !important;
}

html.reddit-mobile-style .rms-left-drawer > .rms-drawer-content {
    max-width: 100% !important;
}

html.reddit-mobile-style .rms-left-drawer .rms-drawer-content {
    background: #e1e1e1 !important;
}

html.reddit-mobile-style .rms-right-drawer .rms-drawer-content {
    background: #e1e1e1 !important;
}

html.reddit-mobile-style .rms-left-drawer {
    width: min(220px, 68vw) !important;
    max-width: 68vw !important;
    left: 0 !important;
    right: auto !important;
    transform: translateX(-105%) !important;
}

html.reddit-mobile-style .rms-left-drawer.rms-open {
    transform: translateX(0) !important;
}

html.reddit-mobile-style .rms-right-drawer {
    width: min(340px, 92vw) !important;
    max-width: 92vw !important;
    right: 0 !important;
    left: auto !important;
    transform: translateX(105%) !important;
}

html.reddit-mobile-style .rms-right-drawer.rms-open {
    transform: translateX(0) !important;
}

html.reddit-mobile-style .rms-drawer-toggle {
    position: fixed !important;
    top: 7px !important;
    z-index: 2147483002 !important;
    width: 34px !important;
    height: 34px !important;
    padding: 0 !important;
    border: 1px solid rgba(0,0,0,.25) !important;
    border-radius: 3px !important;
    background: #fff !important;
    color: #555 !important;
    font: bold 20px/32px sans-serif !important;
    text-align: center !important;
    cursor: pointer !important;
    box-sizing: border-box !important;
}

html.reddit-mobile-style .rms-left-toggle {
    left: 7px !important;
}

html.reddit-mobile-style .rms-right-toggle {
    right: 7px !important;
}

html.reddit-mobile-style .rms-drawer-close {
    display: block !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 2 !important;
    width: 100% !important;
    min-height: 34px !important;
    margin: 0 0 10px 0 !important;
    padding: 5px 8px !important;
    border: 1px solid rgba(0,0,0,.2) !important;
    background: #eee !important;
    color: #333 !important;
    font: bold 14px/22px sans-serif !important;
    text-align: right !important;
    box-sizing: border-box !important;
    cursor: pointer !important;
}

@media (max-width: 380px) {
    html.reddit-mobile-style #siteTable > .thing {
        grid-template-columns: 32px 64px minmax(0, 1fr) !important;
    }

    html.reddit-mobile-style #siteTable > .thing > .midcol {
        width: 32px !important;
        min-width: 32px !important;
        max-width: 32px !important;
    }

    html.reddit-mobile-style #siteTable > .thing > .midcol .score {
        width: 32px !important;
    }

    html.reddit-mobile-style #siteTable > .thing > .thumbnail {
        width: 56px !important;
        max-width: 56px !important;
        height: 56px !important;
        max-height: 56px !important;
    }

    html.reddit-mobile-style #siteTable > .thing > .thumbnail img {
        width: 56px !important;
        max-width: 56px !important;
        height: 56px !important;
        max-height: 56px !important;
    }
}
        `;
    }

    function installDrawerControls() {
        if (document.getElementById('rms-left-toggle')) return;

        const html = document.documentElement;

        const backdrop = document.createElement('div');
        backdrop.id = 'rms-drawer-backdrop';
        backdrop.className = 'rms-drawer-backdrop';
        document.documentElement.appendChild(backdrop);

        const leftButton = document.createElement('button');
        leftButton.id = 'rms-left-toggle';
        leftButton.className = 'rms-drawer-toggle rms-left-toggle';
        leftButton.type = 'button';
        leftButton.setAttribute('aria-label', 'Toggle multireddit menu');
        leftButton.textContent = '☰';
        document.documentElement.appendChild(leftButton);

        const rightButton = document.createElement('button');
        rightButton.id = 'rms-right-toggle';
        rightButton.className = 'rms-drawer-toggle rms-right-toggle';
        rightButton.type = 'button';
        rightButton.setAttribute('aria-label', 'Toggle Reddit sidebar');
        rightButton.textContent = '▤';
        document.documentElement.appendChild(rightButton);

        function findLeftDrawer() {
            return document.querySelector(
                '#siteTable ~ .listing-chooser, .listing-chooser, #RESSubredditGroupDropdown, #srList'
            );
        }

        function findRightDrawer() {
            return document.querySelector('.side');
        }

        function makeDrawerScrollable(shell) {
            if (shell.dataset.rmsTouchScroll === '1') return;
            shell.dataset.rmsTouchScroll = '1';

            // Reddit/RES installs legacy touch handlers on document/body.
            // Do not depend on native overflow scrolling winning that event
            // arbitration. Drive the drawer's scrollTop directly from the
            // finger gesture.
            let dragging = false;
            let lastY = 0;

            shell.addEventListener('touchstart', (event) => {
                if (event.touches.length !== 1) return;
                dragging = true;
                lastY = event.touches[0].clientY;
            }, { passive: true });

            shell.addEventListener('touchmove', (event) => {
                if (!dragging || event.touches.length !== 1) return;

                const y = event.touches[0].clientY;
                const delta = lastY - y;
                lastY = y;

                if (delta !== 0) {
                    shell.scrollTop += delta;
                    event.preventDefault();
                }
            }, { passive: false });

            shell.addEventListener('touchend', () => {
                dragging = false;
            }, { passive: true });

            shell.addEventListener('touchcancel', () => {
                dragging = false;
            }, { passive: true });
        }

        function closeDrawers() {
            const left = findLeftDrawer();
            const right = findRightDrawer();

            if (left) {
                left.classList.remove('rms-open', 'rms-left-drawer', 'rms-drawer');
            }
            if (right) {
                right.classList.remove('rms-open', 'rms-right-drawer', 'rms-drawer');
            }

            backdrop.classList.remove('rms-open');
            html.classList.remove('rms-drawer-open');
        }

        function openDrawer(element, side) {
            if (!element) return;

            const isLeft = side === 'left';
            const other = isLeft ? findRightDrawer() : findLeftDrawer();

            if (other) {
                other.classList.remove(
                    'rms-open',
                    isLeft ? 'rms-right-drawer' : 'rms-left-drawer',
                    'rms-drawer'
                );
            }

            element.classList.add(
                'rms-drawer',
                isLeft ? 'rms-left-drawer' : 'rms-right-drawer',
                'rms-open'
            );

            // Do not rely on the old Reddit/RES sidebar element itself as the
            // scroll container. Those elements can have their own fixed
            // heights/overflow rules. Put the live sidebar in a dedicated
            // fixed-height scrolling viewport instead.
            let shell = element.querySelector(':scope > .rms-drawer-content');
            if (!shell) {
                shell = document.createElement('div');
                shell.className = 'rms-drawer-content';
                while (element.firstChild) {
                    shell.appendChild(element.firstChild);
                }
                element.appendChild(shell);
            }

            makeDrawerScrollable(shell);

            if (!shell.querySelector('.rms-drawer-close')) {
                const close = document.createElement('button');
                close.type = 'button';
                close.className = 'rms-drawer-close';
                close.textContent = 'Close';
                close.setAttribute('aria-label', 'Close sidebar');
                close.addEventListener('click', closeDrawers);
                shell.insertBefore(close, shell.firstChild);
            }

            backdrop.classList.add('rms-open');
            html.classList.add('rms-drawer-open');
        }

        leftButton.addEventListener('click', () => {
            const left = findLeftDrawer();
            if (!left) return;
            if (left.classList.contains('rms-open')) {
                closeDrawers();
            } else {
                openDrawer(left, 'left');
            }
        });

        rightButton.addEventListener('click', () => {
            const right = findRightDrawer();
            if (!right) return;
            if (right.classList.contains('rms-open')) {
                closeDrawers();
            } else {
                openDrawer(right, 'right');
            }
        });

        backdrop.addEventListener('click', closeDrawers);

        // Do not globally disable page scrolling while a drawer is open.
        // Instead, let touch gestures inside the fixed drawer scroll it and
        // suppress only gestures that start outside the drawer.
        document.addEventListener('touchmove', (event) => {
            if (!html.classList.contains('rms-drawer-open')) return;

            const left = findLeftDrawer();
            const right = findRightDrawer();
            const target = event.target;

            if (
                (left && left.classList.contains('rms-open') && left.contains(target)) ||
                (right && right.classList.contains('rms-open') && right.contains(target))
            ) {
                return;
            }

            event.preventDefault();
        }, { passive: false });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeDrawers();
        });

        // RES/Reddit can recreate the chooser/sidebar. Reapply drawer classes
        // when they appear without touching their contents.
        const observer = new MutationObserver(() => {
            const left = findLeftDrawer();
            const right = findRightDrawer();
            if (left && left.classList.contains('rms-open')) {
                left.classList.add('rms-drawer', 'rms-left-drawer');
                const shell = left.querySelector(':scope > .rms-drawer-content');
                if (shell) {
                    makeDrawerScrollable(shell);
                    if (!shell.querySelector('.rms-drawer-close')) {
                        const close = document.createElement('button');
                        close.type = 'button';
                        close.className = 'rms-drawer-close';
                        close.textContent = 'Close';
                        close.setAttribute('aria-label', 'Close sidebar');
                        close.addEventListener('click', closeDrawers);
                        shell.insertBefore(close, shell.firstChild);
                    }
                }
            }
            if (right && right.classList.contains('rms-open')) {
                right.classList.add('rms-drawer', 'rms-right-drawer');
                const shell = right.querySelector(':scope > .rms-drawer-content');
                if (shell) {
                    makeDrawerScrollable(shell);
                    if (!shell.querySelector('.rms-drawer-close')) {
                        const close = document.createElement('button');
                        close.type = 'button';
                        close.className = 'rms-drawer-close';
                        close.textContent = 'Close';
                        close.setAttribute('aria-label', 'Close sidebar');
                        close.addEventListener('click', closeDrawers);
                        shell.insertBefore(close, shell.firstChild);
                    }
                }
            }
        });

        function removePostActions() {
            document.querySelectorAll('#siteTable > .thing .flat-list li').forEach((li) => {
                const text = (li.textContent || '').trim().toLowerCase();
                if (
                    text === '[l+c]' ||
                    text === 'share' ||
                    text === 'source' ||
                    text === 'report' ||
                    text === 'crosspost'
                ) {
                    li.remove();
                }
            });
        }

        removePostActions();
        observer.observe(document.documentElement, { childList: true, subtree: true });

        // RES can add action links after initial rendering.
        const actionObserver = new MutationObserver(removePostActions);
        actionObserver.observe(document.documentElement, { childList: true, subtree: true });
    }


    function setRootClass() {
        const html = document.documentElement;
        html.classList.add(ROOT_CLASS);

        const updateOrientation = () => {
            html.classList.toggle(
                'reddit-mobile-portrait',
                window.matchMedia('(orientation: portrait)').matches
            );
            html.classList.toggle(
                'reddit-mobile-landscape',
                window.matchMedia('(orientation: landscape)').matches
            );
        };

        updateOrientation();
        window.addEventListener('resize', updateOrientation, { passive: true });
        window.addEventListener('orientationchange', updateOrientation, { passive: true });
    }

    // Run immediately. The viewport declaration must be corrected before
    // normal page layout is allowed to settle.
    fixViewport();
    setRootClass();
    injectStyle();
    injectPostLayout();
    installDrawerControls();
})();
