// ==UserScript==
// @name         Reddit Media Fit & Controls
// @namespace    RedditMobileStyle
// @version      1.0.0
// @description  Viewport-fit expanded media with on-demand scale and translation controls.
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

    const mediaStyleId = 'rms-media-feature-style';
    if (!document.getElementById(mediaStyleId)) {
        const style = document.createElement('style');
        style.id = mediaStyleId;
        style.textContent = `/*
 * Expanded media may grow to the available screen dimensions, but must not
 * exceed the viewport. Scale controls are bounded by these same limits.
 */
html.reddit-mobile-style {
    --rms-media-max-width: 100vw;
    --rms-media-max-height: 100vh;
}
@supports (height: 100dvh) {
    html.reddit-mobile-style {
        --rms-media-max-height: 100dvh;
    }
}

html.reddit-mobile-style .expando img:not(.censored-preview),
html.reddit-mobile-style .expando video,
html.reddit-mobile-style .expando canvas,
html.reddit-mobile-style .expando svg,
html.reddit-mobile-style .expando iframe,
html.reddit-mobile-style .expando object,
html.reddit-mobile-style .expando embed,
html.reddit-mobile-style .media-preview img,
html.reddit-mobile-style .media-preview video,
html.reddit-mobile-style .media-preview iframe,
html.reddit-mobile-style .media-preview-content img,
html.reddit-mobile-style .media-preview-content video,
html.reddit-mobile-style .media-preview-content iframe,
html.reddit-mobile-style .media-embed iframe,
html.reddit-mobile-style .media-embed video,
html.reddit-mobile-style .reddit-video-player,
html.reddit-mobile-style .reddit-video-player video,
html.reddit-mobile-style .reddit-video-player iframe,
html.reddit-mobile-style .res-media img,
html.reddit-mobile-style .res-media video,
html.reddit-mobile-style .res-media iframe {
    max-width: var(--rms-media-max-width) !important;
    max-height: var(--rms-media-max-height) !important;
    object-fit: contain !important;
    box-sizing: border-box !important;
}

html.reddit-mobile-style .expando img,
html.reddit-mobile-style .media-preview img,
html.reddit-mobile-style .media-preview-content img,
html.reddit-mobile-style .res-media img,
html.reddit-mobile-style .expando video,
html.reddit-mobile-style .media-preview video,
html.reddit-mobile-style .media-preview-content video,
html.reddit-mobile-style .reddit-video-player video,
html.reddit-mobile-style .res-media video {
    display: block !important;
    width: min(100%, calc(100vw - 16px)) !important;
    height: auto !important;
    max-width: calc(100vw - 16px) !important;
    max-height: calc(100dvh - 120px) !important;
    object-fit: contain !important;
}
@supports not (height: 100dvh) {
    html.reddit-mobile-style .expando img,
    html.reddit-mobile-style .media-preview img,
    html.reddit-mobile-style .media-preview-content img,
    html.reddit-mobile-style .res-media img,
    html.reddit-mobile-style .expando video,
    html.reddit-mobile-style .media-preview video,
    html.reddit-mobile-style .media-preview-content video,
    html.reddit-mobile-style .reddit-video-player video,
    html.reddit-mobile-style .res-media video {
        max-height: calc(100vh - 120px) !important;
    }
}

/* Hide duplicate blurred placeholders when a clear media version is present. */
html.reddit-mobile-style .censored-preview,
html.reddit-mobile-style img.censored-preview,
html.reddit-mobile-style .expando img[class*="blurred"],
html.reddit-mobile-style .expando img[class*="blurred"] ~ img,
html.reddit-mobile-style .expando img[style*="blur("],
html.reddit-mobile-style .expando img[style*="blur("] ~ img,
html.reddit-mobile-style .media-preview img[class*="blurred"],
html.reddit-mobile-style .media-preview img[style*="blur("] {
    display: none !important;
}

html.reddit-mobile-style .expando iframe,
html.reddit-mobile-style .media-preview iframe,
html.reddit-mobile-style .media-preview-content iframe,
html.reddit-mobile-style .media-embed iframe,
html.reddit-mobile-style .reddit-video-player iframe,
html.reddit-mobile-style .res-media iframe {
    display: block !important;
    width: min(100%, calc(100vw - 16px)) !important;
    height: auto !important;
    aspect-ratio: 16 / 9;
    max-width: calc(100vw - 16px) !important;
    max-height: calc(100dvh - 120px) !important;
}
@supports not (height: 100dvh) {
    html.reddit-mobile-style .expando iframe,
    html.reddit-mobile-style .media-preview iframe,
    html.reddit-mobile-style .media-preview-content iframe,
    html.reddit-mobile-style .media-embed iframe,
    html.reddit-mobile-style .reddit-video-player iframe,
    html.reddit-mobile-style .res-media iframe {
        max-height: calc(100vh - 120px) !important;
    }
}

html.reddit-mobile-style .rms-media-open-controls,
html.reddit-mobile-style .rms-media-controls {
    display: flex !important;
    align-items: center !important;
    flex-wrap: wrap !important;
    gap: 4px !important;
    width: 100% !important;
    margin: 4px 0 !important;
    padding: 2px 0 !important;
    box-sizing: border-box !important;
}
html.reddit-mobile-style .rms-media-open-controls {
    align-items: center !important;
    justify-content: center !important;
    width: auto !important;
    min-width: 30px !important;
    min-height: 28px !important;
    margin: 4px 0 !important;
    padding: 4px 8px !important;
    border: 1px solid #999 !important;
    border-radius: 4px !important;
    background: #f6f6f6 !important;
    color: #222 !important;
    font: 14px/1.1 sans-serif !important;
    touch-action: manipulation !important;
}
html.reddit-mobile-style .rms-media-controls button {
    min-width: 30px !important;
    min-height: 28px !important;
    padding: 2px 6px !important;
    border: 1px solid #999 !important;
    border-radius: 4px !important;
    background: #f6f6f6 !important;
    color: #222 !important;
    font: 14px/1.1 sans-serif !important;
    touch-action: manipulation !important;
}
html.reddit-mobile-style .rms-media-scale-label {
    font: 13px/1.2 sans-serif !important;
    color: inherit !important;
}
`;
        (document.head || document.documentElement).appendChild(style);
    }

    function installMediaScaleControls() {
        const root = document.documentElement;
        if (root.dataset.rmsMediaControlsInstalled === '1') return;
        root.dataset.rmsMediaControlsInstalled = '1';

        const mediaSelector = 'img, video, iframe, canvas, svg, object, embed';
        const outerSelector = '.expando, .media-preview, .media-preview-content, .media-embed, .reddit-video-player, .res-media';

        function readBaseDimension(el, dimension) {
            if (el instanceof HTMLImageElement) {
                const natural = dimension === 'width' ? el.naturalWidth : el.naturalHeight;
                if (natural > 0) return natural;
            }
            if (el instanceof HTMLVideoElement) {
                const intrinsic = dimension === 'width' ? el.videoWidth : el.videoHeight;
                if (intrinsic > 0) return intrinsic;
            }

            const attr = el.getAttribute(dimension);
            if (attr && /^\d+(?:\.\d+)?$/.test(attr)) {
                return Math.max(1, parseFloat(attr));
            }

            const cssValue = el.style.getPropertyValue(dimension);
            const cssMatch = cssValue && cssValue.trim().match(/^([0-9]+(?:\.[0-9]+)?)px$/i);
            if (cssMatch) return Math.max(1, parseFloat(cssMatch[1]));

            const rect = el.getBoundingClientRect();
            const measured = dimension === 'width' ? rect.width : rect.height;
            return Math.max(1, measured || parseFloat(getComputedStyle(el)[dimension]) || 1);
        }

        function addControls(container, targetOverride = null) {
            if (!container || container.dataset.rmsControlsAdded === '1') return;
            if (container.closest('.thumbnail')) return;
            const initialTargets = targetOverride || [
                ...(container.matches(mediaSelector) ? [container] : []),
                ...container.querySelectorAll(mediaSelector)
            ].filter(el => !el.closest('.thumbnail'));
            if (!initialTargets.length) return;

            if (!targetOverride && container.parentElement && container.parentElement.closest(outerSelector)) return;
            container.dataset.rmsControlsAdded = '1';

            const controls = document.createElement('div');
            controls.className = 'rms-media-controls';
            const makeButton = (text, label) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = text;
                button.setAttribute('aria-label', label);
                return button;
            };
            const down = makeButton('−', 'Scale media down');
            const reset = makeButton('Reset', 'Reset media scale');
            const up = makeButton('+', 'Scale media up');
            const left = makeButton('←', 'Move media 25 pixels left');
            const right = makeButton('→', 'Move media 25 pixels right');
            const upMove = makeButton('↑', 'Move media 25 pixels up');
            const downMove = makeButton('↓', 'Move media 25 pixels down');
            const label = document.createElement('span');
            label.className = 'rms-media-scale-label';

            const targets = [...new Set(initialTargets)].map(el => ({
                el,
                width: readBaseDimension(el, 'width'),
                height: readBaseDimension(el, 'height'),
                x: 0,
                y: 0
            }));
            let scale = 1;

            const apply = () => {
                targets.forEach(({ el, width, height, x, y }) => {
                    if (!el.isConnected) return;
                    el.style.setProperty('width', (width * scale) + 'px', 'important');
                    el.style.setProperty('height', (height * scale) + 'px', 'important');
                    el.style.setProperty('max-width', 'none', 'important');
                    el.style.setProperty('max-height', 'none', 'important');
                    el.style.setProperty('min-width', '0', 'important');
                    el.style.setProperty('min-height', '0', 'important');
                    el.style.setProperty('aspect-ratio', 'auto', 'important');
                    el.style.setProperty('box-sizing', 'border-box', 'important');
                    el.style.setProperty('translate', x + 'px ' + y + 'px', 'important');
                });
                label.textContent = Math.round(scale * 100) + '%';
            };

            down.addEventListener('click', () => {
                scale = Math.max(0.1, Math.round((scale - 0.1) * 100) / 100);
                apply();
            });
            up.addEventListener('click', () => {
                scale = Math.round((scale + 0.1) * 100) / 100;
                apply();
            });
            left.addEventListener('click', () => { targets.forEach(t => { t.x -= 25; }); apply(); });
            right.addEventListener('click', () => { targets.forEach(t => { t.x += 25; }); apply(); });
            upMove.addEventListener('click', () => { targets.forEach(t => { t.y -= 25; }); apply(); });
            downMove.addEventListener('click', () => { targets.forEach(t => { t.y += 25; }); apply(); });
            reset.addEventListener('click', () => {
                scale = 1;
                targets.forEach(t => { t.x = 0; t.y = 0; });
                apply();
            });

            controls.append(down, reset, up, left, upMove, downMove, right, label);

            const launcher = makeButton('Scale / move', 'Show media scale and translation controls');
            launcher.className = 'rms-media-open-controls';
            launcher.addEventListener('click', () => {
                launcher.replaceWith(controls);
                apply();
            });

            if (container.matches(mediaSelector)) {
                container.parentElement?.insertBefore(launcher, container);
            } else {
                container.insertBefore(launcher, container.firstChild);
            }
        }

        function scan() {
            document.querySelectorAll('.expando').forEach(addControls);
            document.querySelectorAll(outerSelector).forEach(container => {
                if (!container.closest('.expando')) addControls(container);
            });

            document.querySelectorAll('img.res-media-zoomable, iframe.res-media-zoomable, iframe.media-embed, video.res-media-zoomable')
                .forEach(media => {
                    if (media.closest(outerSelector) || !media.parentElement) return;
                    addControls(media, [media]);
                });

            document.querySelectorAll('source[src]').forEach(source => {
                const video = source.closest('video');
                if (!video || video.closest(outerSelector) || !video.parentElement) return;
                addControls(video, [video]);
            });
        }

        scan();
        const observer = new MutationObserver(() => scan());
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }


    function start() { installMediaScaleControls(); }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
