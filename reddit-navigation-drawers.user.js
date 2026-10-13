// ==UserScript==
// @name         Reddit Navigation Drawers
// @namespace    RedditMobileStyle
// @version      1.0.0
// @description  Adds mobile toggles for the multireddit menu and Reddit sidebar.
// @match        https://*.reddit.com/*
// @grant        none
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
    'use strict';
    if (!/Android|iPhone|iPod|iPad/i.test(navigator.userAgent || '') &&
        !(navigator.userAgentData && navigator.userAgentData.mobile) &&
        !(navigator.maxTouchPoints > 0 && Math.min(screen.width || 0, screen.height || 0) <= 700)) return;

    const drawerStyleId = 'rms-drawer-feature-style';
    if (!document.getElementById(drawerStyleId)) {
        const style = document.createElement('style');
        style.id = drawerStyleId;
        style.textContent = `html.reddit-mobile-style .rms-drawer-toggle {
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

`;
        (document.head || document.documentElement).appendChild(style);
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


    function start() { installDrawerButtons(); }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
