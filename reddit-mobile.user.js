// ==UserScript==
// @name         Reddit Mobile Style
// @namespace    RedditMobileStyle
// @version      0.1.0
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
 * Reddit Mobile Style 0.1.0
 * Stage 1: shell normalization only.
 */
html.reddit-mobile-style,
html.reddit-mobile-style body {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
}

html.reddit-mobile-style body {
    margin: 0 !important;
    overflow-x: auto;
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
    white-space: normal !important;
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
html.reddit-mobile-style #header *,
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
})();
