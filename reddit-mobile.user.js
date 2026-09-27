// ==UserScript==
// @name         Reddit Mobile Style
// @namespace    RedditMobileStyle
// @version      1.10.0
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
 * Reddit Mobile Style 1.9.1
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
html.reddit-mobile-style .rms-left-toggle { left: 7px !important; }
html.reddit-mobile-style .rms-right-toggle { right: 7px !important; }

html.reddit-mobile-style .listing-chooser.rms-left-drawer {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: min(220px, 68vw) !important;
    max-width: 68vw !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 8px !important;
    box-sizing: border-box !important;
    overflow: visible !important;
    z-index: 2147483001 !important;
    background: #e1e1e1 !important;
    transform: none !important;
}

html.reddit-mobile-style .listing-chooser.rms-left-drawer.rms-open {
    transform: none !important;
}

html.reddit-mobile-style .side.rms-right-drawer {
    display: block !important;
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    left: auto !important;
    width: min(340px, 92vw) !important;
    max-width: 92vw !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 8px !important;
    box-sizing: border-box !important;
    overflow: visible !important;
    z-index: 2147483001 !important;
    background: #e1e1e1 !important;
    transform: none !important;
}

html.reddit-mobile-style .side.rms-right-drawer.rms-open {
    transform: none !important;
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

/*
 * Keep the desktop sidebar hidden on phones, as in the original 0.1.0
 * shell. No drawer, event interception, or DOM relocation is performed.
 */
html.reddit-mobile-style .side {
    display: none !important;
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

    function installDrawerButtons() {
        if (document.getElementById('rms-left-toggle')) return;

        const html = document.documentElement;

        const leftButton = document.createElement('button');
        leftButton.id = 'rms-left-toggle';
        leftButton.className = 'rms-drawer-toggle rms-left-toggle';
        leftButton.type = 'button';
        leftButton.textContent = '☰';
        leftButton.setAttribute('aria-label', 'Open multireddit menu');
        document.documentElement.appendChild(leftButton);

        const rightButton = document.createElement('button');
        rightButton.id = 'rms-right-toggle';
        rightButton.className = 'rms-drawer-toggle rms-right-toggle';
        rightButton.type = 'button';
        rightButton.textContent = '▤';
        rightButton.setAttribute('aria-label', 'Open Reddit sidebar');
        document.documentElement.appendChild(rightButton);

        const left = () => document.querySelector('div.listing-chooser');
        const right = () => document.querySelector('.side');

        function close() {
            const l = left(), r = right();
            if (l) l.classList.remove('rms-open', 'rms-left-drawer');
            if (r) r.classList.remove('rms-open', 'rms-right-drawer');
            html.classList.remove('rms-drawer-open');
        }

        function open(which) {
            close();
            const el = which === 'left' ? left() : right();
            if (!el) return;
            el.classList.add(
                'rms-open',
                which === 'left' ? 'rms-left-drawer' : 'rms-right-drawer'
            );
            html.classList.add('rms-drawer-open');
        }

        leftButton.addEventListener('click', () => {
            const el = left();
            if (el && el.classList.contains('rms-open')) close();
            else open('left');
        });

        rightButton.addEventListener('click', () => {
            const el = right();
            if (el && el.classList.contains('rms-open')) close();
            else open('right');
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') close();
        });
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
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installDrawerButtons, { once: true });
    } else {
        installDrawerButtons();
    }
})();
