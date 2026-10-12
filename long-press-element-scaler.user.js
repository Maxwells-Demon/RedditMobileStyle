// ==UserScript==
// @name         Long-Press Element Scaler
// @namespace    RedditMobileStyle
// @version      1.0.0
// @description  Hold any page element for two seconds to show scale controls
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const HOLD_MS = 2000;
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3;
    const STEP = 0.1;
    const CONTROL_ID = 'lpes-controls';
    const STYLE_ID = 'lpes-style';

    let holdTimer = null;
    let pressedElement = null;
    let activeElement = null;
    let holdTriggered = false;
    const originals = new WeakMap();
    const scales = new WeakMap();

    function isIgnored(element) {
        if (!(element instanceof Element)) return true;
        if (element.closest('#' + CONTROL_ID)) return true;
        if (/^(HTML|BODY|HEAD|SCRIPT|STYLE|LINK|META|TITLE)$/i.test(element.tagName)) return true;
        if (element.isContentEditable) return true;
        return false;
    }

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${CONTROL_ID} {
                position: fixed; z-index: 2147483647; left: 50%;
                bottom: max(12px, env(safe-area-inset-bottom));
                transform: translateX(-50%); width: min(360px, calc(100vw - 24px));
                box-sizing: border-box; padding: 12px; border-radius: 14px;
                background: rgba(24, 24, 28, .97); color: #fff;
                box-shadow: 0 4px 24px rgba(0,0,0,.45);
                font: 14px/1.35 system-ui, sans-serif; touch-action: manipulation;
            }
            #${CONTROL_ID} * { box-sizing: border-box; }
            #${CONTROL_ID} .lpes-row { display:flex; align-items:center; gap:8px; }
            #${CONTROL_ID} .lpes-title { font-weight:600; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
            #${CONTROL_ID} .lpes-value { min-width:48px; text-align:center; font-variant-numeric:tabular-nums; }
            #${CONTROL_ID} input[type=range] { width:100%; margin:12px 0; }
            #${CONTROL_ID} button { border:0; border-radius:8px; padding:9px 12px; background:#3c3c45; color:#fff; font:inherit; }
            #${CONTROL_ID} button:active { background:#555560; }
            #${CONTROL_ID} .lpes-actions { display:flex; gap:8px; }
            #${CONTROL_ID} .lpes-actions button { flex:1; }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function getControls() {
        let panel = document.getElementById(CONTROL_ID);
        if (panel) return panel;
        injectStyle();
        panel = document.createElement('div');
        panel.id = CONTROL_ID;
        panel.innerHTML = `
            <div class="lpes-row">
                <div class="lpes-title">Element scale</div>
                <div class="lpes-value">100%</div>
                <button type="button" data-action="close" aria-label="Close scale controls">✕</button>
            </div>
            <input type="range" min="50" max="300" step="10" value="100" aria-label="Element scale">
            <div class="lpes-actions">
                <button type="button" data-action="minus">−</button>
                <button type="button" data-action="reset">Reset</button>
                <button type="button" data-action="plus">+</button>
            </div>`;
        (document.body || document.documentElement).appendChild(panel);
        panel.addEventListener('input', event => {
            if (event.target.matches('input[type="range"]')) setScale(Number(event.target.value) / 100);
        });
        panel.addEventListener('click', event => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            const action = button.dataset.action;
            if (action === 'close') panel.remove();
            if (action === 'reset') setScale(1);
            if (action === 'minus') setScale(Math.max(MIN_SCALE, currentScale() - STEP));
            if (action === 'plus') setScale(Math.min(MAX_SCALE, currentScale() + STEP));
        });
        return panel;
    }

    function currentScale() {
        return activeElement ? (scales.get(activeElement) || 1) : 1;
    }

    function rememberOriginal(element) {
        if (originals.has(element)) return;
        originals.set(element, {
            transform: element.style.transform,
            transformOrigin: element.style.transformOrigin,
            position: element.style.position,
            zIndex: element.style.zIndex,
            willChange: element.style.willChange
        });
    }

    function setScale(scale) {
        if (!activeElement || !activeElement.isConnected) return;
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
        rememberOriginal(activeElement);
        const original = originals.get(activeElement);
        const baseTransform = original.transform && original.transform !== 'none' ? original.transform : '';
        activeElement.style.transform = (baseTransform + ' scale(' + scale + ')').trim();
        activeElement.style.transformOrigin = 'center center';
        if (getComputedStyle(activeElement).position === 'static') activeElement.style.position = 'relative';
        activeElement.style.zIndex = '2147483000';
        activeElement.style.willChange = 'transform';
        scales.set(activeElement, scale);

        const panel = getControls();
        panel.querySelector('.lpes-value').textContent = Math.round(scale * 100) + '%';
        panel.querySelector('input[type="range"]').value = String(Math.round(scale * 100));
        panel.querySelector('.lpes-title').textContent =
            (activeElement.tagName.toLowerCase() + (activeElement.id ? '#' + activeElement.id : '')).slice(0, 70);
    }

    function activate(element) {
        if (isIgnored(element)) return;
        activeElement = element;
        if (!scales.has(element)) scales.set(element, 1);
        getControls();
        setScale(currentScale());
    }

    function clearHold() {
        if (holdTimer !== null) clearTimeout(holdTimer);
        holdTimer = null;
        pressedElement = null;
    }

    document.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const target = event.target instanceof Element ? event.target : null;
        if (!target || isIgnored(target)) return;
        clearHold();
        pressedElement = target;
        holdTriggered = false;
        holdTimer = setTimeout(() => {
            holdTriggered = true;
            activate(pressedElement);
        }, HOLD_MS);
    }, true);

    document.addEventListener('pointerup', clearHold, true);
    document.addEventListener('pointercancel', clearHold, true);
    document.addEventListener('pointermove', event => {
        if (holdTimer === null || !pressedElement) return;
        if (Math.abs(event.movementX || 0) + Math.abs(event.movementY || 0) > 12) clearHold();
    }, true);

    document.addEventListener('contextmenu', event => {
        if (holdTriggered) {
            event.preventDefault();
            event.stopPropagation();
            holdTriggered = false;
        }
    }, true);

    // Some pages create their head/body after document-start.
    const ready = () => injectStyle();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready, { once: true });
    } else {
        ready();
    }
})();
