// ==UserScript==
// @name         Reddit Mobile Style
// @namespace    RedditMobileStyle
// @version      0.4.0
// @description  Responsive shell for classic old Reddit on smartphones
// @match        https://old.reddit.com/*
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
 * Reddit Mobile Style 0.4.0
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
 * Preserve Reddit's existing DOM and controls; only change geometry.
 */

html.reddit-mobile-style body {
    overflow-x: hidden;
}

html.reddit-mobile-style .content {
    overflow: visible !important;
}

/* The classic listing itself must not inherit desktop table-like geometry. */
html.reddit-mobile-style #siteTable {
    display: block !important;
}

/* One post = vote rail + content. Thumbnail remains inside .entry. */
html.reddit-mobile-style .thing {
    position: relative !important;
    display: grid !important;
    grid-template-columns: 42px minmax(0, 1fr) !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    box-sizing: border-box !important;
}

html.reddit-mobile-style .thing > .midcol {
    grid-column: 1;
    grid-row: 1;
    width: 42px !important;
    min-width: 42px !important;
    max-width: 42px !important;
    margin: 0 !important;
    padding: 6px 0 !important;
    box-sizing: border-box !important;
    text-align: center;
}

html.reddit-mobile-style .thing > .entry {
    grid-column: 2;
    grid-row: 1;
    min-width: 0 !important;
    width: auto !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 6px 8px 8px 0 !important;
    box-sizing: border-box !important;
}

/* Prevent the classic thumbnail float from consuming desktop-sized geometry. */
html.reddit-mobile-style .thing .thumbnail {
    float: right !important;
    width: min(70px, 25vw) !important;
    max-width: 25vw !important;
    height: auto !important;
    max-height: 70px !important;
    margin: 0 0 4px 8px !important;
    box-sizing: border-box !important;
}

html.reddit-mobile-style .thing .thumbnail img {
    display: block;
    width: 100% !important;
    height: auto !important;
    max-width: 100% !important;
    object-fit: contain;
}

/* Text columns must be allowed to shrink rather than force page overflow. */
html.reddit-mobile-style .thing .entry > *,
html.reddit-mobile-style .thing .entry .title,
html.reddit-mobile-style .thing .entry .tagline,
html.reddit-mobile-style .thing .entry .flat-list,
html.reddit-mobile-style .thing .entry .expando,
html.reddit-mobile-style .thing .entry .md-container {
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box;
}

html.reddit-mobile-style .thing .title {
    display: block;
    line-height: 1.25;
    overflow-wrap: anywhere;
}

html.reddit-mobile-style .thing .domain {
    overflow-wrap: anywhere;
}

html.reddit-mobile-style .thing .tagline {
    line-height: 1.35;
    overflow-wrap: anywhere;
}

html.reddit-mobile-style .thing .flat-list {
    display: flex !important;
    flex-wrap: wrap;
    gap: 0 7px;
    line-height: 1.5;
}

html.reddit-mobile-style .thing .flat-list li {
    float: none !important;
    display: inline-block;
}

/* Vote controls are small in the original CSS; enlarge the hit target
 * without changing the underlying links or RES vote behavior. */
html.reddit-mobile-style .thing .midcol .arrow {
    display: block;
    margin: 0 auto !important;
    width: 32px !important;
    height: 30px !important;
    background-position-x: center !important;
}

html.reddit-mobile-style .thing .midcol .score {
    display: block;
    width: 42px;
    line-height: 16px;
    text-align: center;
}

/* Expandos/media must respect the phone content column. */
html.reddit-mobile-style .thing .expando,
html.reddit-mobile-style .thing .expando-content,
html.reddit-mobile-style .thing .media-preview,
html.reddit-mobile-style .thing .media-preview-content,
html.reddit-mobile-style .thing iframe,
html.reddit-mobile-style .thing video,
html.reddit-mobile-style .thing object,
html.reddit-mobile-style .thing embed {
    max-width: 100% !important;
    box-sizing: border-box !important;
}

html.reddit-mobile-style .thing .md {
    max-width: 100% !important;
    overflow-wrap: anywhere;
}

html.reddit-mobile-style .thing .md pre,
html.reddit-mobile-style .thing .md table {
    max-width: 100% !important;
    overflow-x: auto;
}

html.reddit-mobile-style .thing .md pre {
    white-space: pre;
    overflow-x: auto;
}

html.reddit-mobile-style .thing .md table {
    display: block;
    width: max-content;
}

/* Keep RES-selected rows visible without reintroducing desktop width. */
html.reddit-mobile-style .res-selected {
    min-width: 0 !important;
    max-width: 100% !important;
}

/* Listing separators remain useful, but never depend on a fixed canvas. */
html.reddit-mobile-style .thing {
    border-right: 0 !important;
}

/* "next" and pagination should occupy the same fluid column. */
html.reddit-mobile-style .nav-buttons,
html.reddit-mobile-style .nextprev {
    max-width: 100% !important;
    box-sizing: border-box;
    overflow-wrap: anywhere;
}

/* Narrow phones: slightly reduce the vote rail and thumbnail. */
@media (max-width: 380px) {
    html.reddit-mobile-style .thing {
        grid-template-columns: 38px minmax(0, 1fr) !important;
    }

    html.reddit-mobile-style .thing > .midcol {
        width: 38px !important;
        min-width: 38px !important;
        max-width: 38px !important;
    }

    html.reddit-mobile-style .thing .midcol .score {
        width: 38px;
    }

    html.reddit-mobile-style .thing .thumbnail {
        width: 62px !important;
        max-width: 62px !important;
        max-height: 62px !important;
    }
}
        `;
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
})();
