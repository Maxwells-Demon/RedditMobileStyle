// ==UserScript==
// @name         Universal Video.js Player Replacement
// @namespace    RedditMobileStyle
// @version      1.2.0
// @description  Attempts to replace HTML5 video players and compatible GIF/media sources with Video.js across websites and frames
// @match        *://*/*
// @require      https://vjs.zencdn.net/8.23.4/video.min.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = '1.2.0';
    const STYLE_ID = 'rms-vjs-style';
    const PANEL_ID = 'rms-vjs-settings';
    const STORE_KEY = 'rmsVideoJsSettings';
    const VJS_CSS = 'https://vjs.zencdn.net/8.23.4/video-js.css';
    const MARKER = 'data-rms-vjs-processed';

    const DEFAULTS = {
        autoplay: 'off',       // off | muted | any
        muted: false,
        loop: false,
        controls: true,
        preload: 'metadata',   // none | metadata | auto
        playbackRate: 1,
        replaceGifs: true,
        replaceExistingVideo: true,
        replaceEmbeds: true,
        scanCollapsedPosts: false
    };

    let settings = loadSettings();
    let observer;
    let scanQueued = false;

    function loadSettings() {
        try {
            return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(STORE_KEY) || '{}'));
        } catch (_) {
            return Object.assign({}, DEFAULTS);
        }
    }

    function saveSettings() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch (_) {}
    }

    function addStyles() {
        if (!document.querySelector('link[data-rms-vjs-css]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = VJS_CSS;
            link.dataset.rmsVjsCss = '1';
            (document.head || document.documentElement).appendChild(link);
        }
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .rms-vjs-shell { position:relative; width:100%; max-width:100%; margin:8px 0; clear:both; }
            .rms-vjs-shell { max-width:100vw; max-height:100vh; overflow:hidden; }
            .rms-vjs-shell .video-js { width:100%; max-width:100vw; height:auto; max-height:100vh; aspect-ratio:16/9; background:#000; font-size:14px; }
            .rms-vjs-shell video { max-width:100vw!important; max-height:100vh!important; object-fit:contain!important; }
            .rms-vjs-shell .video-js video { object-fit:contain; }
            .rms-vjs-shell .video-js .vjs-tech { width:100%; height:100%; object-fit:contain; }
            .rms-vjs-error { padding:8px; margin:4px 0; border:1px solid #a33; background:#241515; color:#fff; font:13px/1.4 sans-serif; }
            #${PANEL_ID} { position:fixed; z-index:2147483647; right:10px; bottom:10px; width:min(340px,calc(100vw - 20px)); max-height:75vh; overflow:auto; box-sizing:border-box; padding:12px; border:1px solid #777; border-radius:10px; background:#171717; color:#f5f5f5; box-shadow:0 3px 18px #0008; font:14px/1.4 system-ui,sans-serif; }
            #${PANEL_ID}[hidden] { display:none!important; }
            #${PANEL_ID} .rms-vjs-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; font-weight:700; }
            #${PANEL_ID} .rms-vjs-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(120px,1fr); gap:8px 10px; align-items:center; }
            #${PANEL_ID} label { display:contents; }
            #${PANEL_ID} select, #${PANEL_ID} button { min-width:0; box-sizing:border-box; padding:6px; border:1px solid #666; border-radius:5px; background:#292929; color:#fff; font:inherit; }
            #${PANEL_ID} input { justify-self:end; width:18px; height:18px; }
            #${PANEL_ID} .rms-vjs-check { display:flex; justify-content:space-between; gap:10px; align-items:center; grid-column:1/-1; }
            #${PANEL_ID} .rms-vjs-actions { display:flex; gap:8px; margin-top:10px; }
            #${PANEL_ID} .rms-vjs-actions button { flex:1; }
            #${PANEL_ID} .rms-vjs-note { color:#bbb; font-size:12px; margin-top:8px; }
            #rms-vjs-open { position:fixed; z-index:2147483646; right:10px; bottom:10px; padding:8px 11px; border:1px solid #777; border-radius:20px; background:#171717; color:#fff; font:13px system-ui,sans-serif; }
            .rms-vjs-fallback { display:block; padding:8px; margin:5px 0; background:#222; color:#fff; border:1px solid #666; }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function buildSettingsPanel() {
        if (document.getElementById(PANEL_ID)) return;
        const open = document.createElement('button');
        open.id = 'rms-vjs-open';
        open.type = 'button';
        open.textContent = 'Video.js settings';
        open.addEventListener('click', () => {
            const panel = document.getElementById(PANEL_ID);
            panel.hidden = !panel.hidden;
            open.hidden = !panel.hidden;
        });
        document.body.appendChild(open);

        const panel = document.createElement('section');
        panel.id = PANEL_ID;
        panel.hidden = true;
        panel.setAttribute('aria-label', 'Video.js player settings');
        panel.innerHTML = `
            <div class="rms-vjs-head"><span>Video.js settings</span><button type="button" data-action="close" aria-label="Close settings">×</button></div>
            <div class="rms-vjs-grid">
                <label for="rms-vjs-autoplay"><span>Autoplay</span><select id="rms-vjs-autoplay">
                    <option value="off">Off</option><option value="muted">Muted autoplay</option><option value="any">Try autoplay, then mute</option>
                </select></label>
                <label for="rms-vjs-preload"><span>Preload</span><select id="rms-vjs-preload">
                    <option value="none">None</option><option value="metadata">Metadata</option><option value="auto">Auto</option>
                </select></label>
                <label for="rms-vjs-rate"><span>Playback speed</span><select id="rms-vjs-rate">
                    <option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option>
                </select></label>
                <label class="rms-vjs-check" for="rms-vjs-muted"><span>Start muted</span><input id="rms-vjs-muted" type="checkbox"></label>
                <label class="rms-vjs-check" for="rms-vjs-loop"><span>Loop videos/GIFs</span><input id="rms-vjs-loop" type="checkbox"></label>
                <label class="rms-vjs-check" for="rms-vjs-controls"><span>Show player controls</span><input id="rms-vjs-controls" type="checkbox"></label>
                <label class="rms-vjs-check" for="rms-vjs-gifs"><span>Replace compatible GIFs</span><input id="rms-vjs-gifs" type="checkbox"></label>
                <label class="rms-vjs-check" for="rms-vjs-existing"><span>Restyle existing HTML video players</span><input id="rms-vjs-existing" type="checkbox"></label>
                <label class="rms-vjs-check" for="rms-vjs-embeds"><span>Scan embeds for direct media URLs</span><input id="rms-vjs-embeds" type="checkbox"></label>
                <label class="rms-vjs-check" for="rms-vjs-collapsed"><span>Scan collapsed posts too</span><input id="rms-vjs-collapsed" type="checkbox"></label>
            </div>
            <div class="rms-vjs-actions"><button type="button" data-action="apply">Apply + rescan</button><button type="button" data-action="reset">Reset</button></div>
            <div class="rms-vjs-note">Settings are saved in this browser. Autoplay may be blocked by the browser. Unsupported third-party or DRM players cannot always be replaced.</div>
        `;
        panel.querySelector('[data-action="close"]').addEventListener('click', () => {
            panel.hidden = true;
            open.hidden = false;
        });
        panel.querySelector('[data-action="apply"]').addEventListener('click', () => {
            settings = readPanel();
            saveSettings();
            panel.hidden = true;
            open.hidden = false;
            applySettingsToPlayers();
            scan();
        });
        panel.querySelector('[data-action="reset"]').addEventListener('click', () => {
            settings = Object.assign({}, DEFAULTS);
            saveSettings();
            populatePanel();
            applySettingsToPlayers();
            scan();
        });
        document.body.appendChild(panel);
        populatePanel();
    }

    function populatePanel() {
        const panel = document.getElementById(PANEL_ID);
        if (!panel) return;
        const set = (id, value) => { const el = panel.querySelector('#' + id); if (el) el.value = String(value); };
        const check = (id, value) => { const el = panel.querySelector('#' + id); if (el) el.checked = Boolean(value); };
        set('rms-vjs-autoplay', settings.autoplay);
        set('rms-vjs-preload', settings.preload);
        set('rms-vjs-rate', settings.playbackRate);
        check('rms-vjs-muted', settings.muted);
        check('rms-vjs-loop', settings.loop);
        check('rms-vjs-controls', settings.controls);
        check('rms-vjs-gifs', settings.replaceGifs);
        check('rms-vjs-existing', settings.replaceExistingVideo);
        check('rms-vjs-embeds', settings.replaceEmbeds);
        check('rms-vjs-collapsed', settings.scanCollapsedPosts);
    }

    function readPanel() {
        const panel = document.getElementById(PANEL_ID);
        const val = id => panel.querySelector('#' + id).value;
        const checked = id => panel.querySelector('#' + id).checked;
        return {
            autoplay: val('rms-vjs-autoplay'),
            preload: val('rms-vjs-preload'),
            playbackRate: Number(val('rms-vjs-rate')) || 1,
            muted: checked('rms-vjs-muted'),
            loop: checked('rms-vjs-loop'),
            controls: checked('rms-vjs-controls'),
            replaceGifs: checked('rms-vjs-gifs'),
            replaceExistingVideo: checked('rms-vjs-existing'),
            replaceEmbeds: checked('rms-vjs-embeds'),
            scanCollapsedPosts: checked('rms-vjs-collapsed')
        };
    }

    function inHiddenOrThumbnail(el) {
        // Reddit-specific exclusions must not suppress players on other websites.
        if (!/(^|\.)reddit\.com$/i.test(location.hostname)) return false;
        if (el.closest('.thumbnail, .thing .midcol, .listing-chooser, #header, #sr-header-area')) return true;
        if (settings.scanCollapsedPosts) return false;
        const thing = el.closest('.thing');
        return Boolean(thing && !thing.classList.contains('expanded'));
    }

    function inferType(url) {
        const clean = url.split('#')[0].split('?')[0].toLowerCase();
        if (clean.endsWith('.m3u8')) return 'application/x-mpegURL';
        if (clean.endsWith('.mpd')) return 'application/dash+xml';
        if (clean.endsWith('.webm')) return 'video/webm';
        if (clean.endsWith('.ogv') || clean.endsWith('.ogg')) return 'video/ogg';
        if (clean.endsWith('.gif') || clean.endsWith('.gifv')) return 'video/mp4';
        return 'video/mp4';
    }

    function normalizeMediaUrl(raw) {
        if (!raw) return null;
        let url;
        try { url = new URL(raw, location.href); } catch (_) { return null; }
        if (!/^https?:$/.test(url.protocol)) return null;
        const host = url.hostname.toLowerCase();

        // Imgur GIFV/GIF URLs have MP4 counterparts which Video.js can play.
        if (/(^|\.)imgur\.com$/.test(host) && /\.gifv?$/i.test(url.pathname)) {
            url.pathname = url.pathname.replace(/\.gifv?$/i, '.mp4');
            url.search = '';
            return url.href;
        }

        // Reddit's HLS playlist is a better replacement than its DASH iframe player.
        if (host === 'v.redd.it') {
            const id = url.pathname.split('/').filter(Boolean)[0];
            if (id && !/\.(mp4|webm|m3u8)$/i.test(url.pathname)) {
                return 'https://v.redd.it/' + encodeURIComponent(id) + '/HLSPlaylist.m3u8';
            }
        }

        if (/\.(mp4|m4v|webm|ogv|ogg|m3u8|mpd)(\?|$)/i.test(url.href)) return url.href;
        if (/\.gifv?(\?|$)/i.test(url.href) && settings.replaceGifs) return url.href;
        return null;
    }

    function collectSources(video) {
        const sources = [];
        const addExistingMediaSource = (raw, type) => {
            if (!raw) return;
            let resolved;
            try { resolved = new URL(raw, location.href); } catch (_) { return; }
            // Blob URLs are often used by MediaSource-based players. Preserve them
            // when re-wrapping an existing video in the same document.
            if (resolved.protocol === 'blob:') {
                const src = resolved.href;
                if (!sources.some(s => s.src === src)) sources.push({ src, type: type || 'video/mp4' });
                return;
            }
            if (!/^https?:$/.test(resolved.protocol)) return;
            const src = normalizeMediaUrl(resolved.href) || resolved.href;
            if (!sources.some(s => s.src === src)) sources.push({ src, type: type || inferType(src) });
        };
        addExistingMediaSource(video.currentSrc);
        addExistingMediaSource(video.getAttribute('src'));
        video.querySelectorAll('source[src]').forEach(source => addExistingMediaSource(source.src, source.type));

        // Custom players often expose a stream URL in data attributes.
        const candidates = ['data-video-url', 'data-playback-url', 'data-hls-url', 'data-mp4', 'data-source', 'data-src', 'data-url'];
        for (const attr of candidates) {
            const raw = video.getAttribute(attr);
            if (!raw) continue;
            const normalized = normalizeMediaUrl(raw);
            if (normalized && !sources.some(s => s.src === normalized)) sources.push({ src: normalized, type: inferType(normalized) });
        }
        const parent = video.closest('.expando, .media-preview, .media-embed, .video-wrapper, .video-container, .reddit-video-player, .res-media') || video.parentElement;
        if (parent) {
            parent.querySelectorAll('a[href]').forEach(a => {
                const s = normalizeMediaUrl(a.href);
                if (s && !sources.some(item => item.src === s)) sources.push({ src: s, type: inferType(s) });
            });
        }
        return sources;
    }

    function makeVideoJs(video, sources, original) {
        if (!sources.length || video.dataset.rmsVjsReady === '1') return;
        video.dataset.rmsVjsReady = '1';
        const shell = document.createElement('div');
        shell.className = 'rms-vjs-shell';
        const id = 'rms-vjs-' + Math.random().toString(36).slice(2, 10);
        shell.dataset.rmsVjsShell = '1';
        video.removeAttribute('id');
        video.id = id;
        video.classList.add('video-js', 'vjs-big-play-centered');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.controls = Boolean(settings.controls);
        video.muted = Boolean(settings.muted || settings.autoplay === 'muted' || settings.autoplay === 'any');
        video.loop = Boolean(settings.loop);
        video.preload = settings.preload;
        video.removeAttribute('autoplay');
        video.removeAttribute('data-setup');

        const parent = video.parentNode;
        if (!parent) return;
        parent.insertBefore(shell, video);
        shell.appendChild(video);

        const options = {
            controls: Boolean(settings.controls),
            autoplay: settings.autoplay === 'off' ? false : settings.autoplay,
            muted: Boolean(settings.muted || settings.autoplay === 'muted' || settings.autoplay === 'any'),
            loop: Boolean(settings.loop),
            preload: settings.preload,
            fluid: true,
            responsive: true,
            aspectRatio: '16:9',
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            sources: sources
        };

        try {
            const player = window.videojs(video, options);
            video.dataset.rmsVjsInitialized = '1';
            player.ready(() => {
                try { player.playbackRate(settings.playbackRate); } catch (_) {}
            });
            player.on('error', () => {
                const error = player.error();
                const current = player.currentSource();
                const idx = sources.findIndex(s => current && s.src === current.src);
                if (idx >= 0 && idx + 1 < sources.length) {
                    player.src(sources.slice(idx + 1));
                    return;
                }
                if (original && shell.parentNode) {
                    original.hidden = false;
                    shell.replaceWith(original);
                } else {
                    showSourceError(shell, 'Video.js could not play this source. The original host/player may require a site-specific decoder, authentication, DRM, or a site-specific playback engine.');
                }
            });
        } catch (error) {
            if (original && shell.parentNode) {
                original.hidden = false;
                shell.replaceWith(original);
            } else showSourceError(shell, 'Video.js could not initialize: ' + String(error && error.message || error));
        }
    }

    function showSourceError(shell, message) {
        if (!shell || shell.querySelector('.rms-vjs-error')) return;
        const box = document.createElement('div');
        box.className = 'rms-vjs-error';
        box.textContent = message;
        shell.appendChild(box);
    }

    function replaceExistingVideos() {
        if (!settings.replaceExistingVideo) return;
        document.querySelectorAll('video:not([data-rms-vjs-ready])').forEach(video => {
            if (inHiddenOrThumbnail(video)) return;
            const sources = collectSources(video);
            if (sources.length) makeVideoJs(video, sources, null);
        });
    }

    function findPlayableMediaUrl(el) {
        const candidates = [];
        const add = value => { if (value && !candidates.includes(value)) candidates.push(value); };
        const nodes = [el, ...Array.from(el.querySelectorAll('[src], [href], [data], [data-url], [data-media-url], [data-video-url], [data-playback-url], [data-hls-url], [data-mp4]'))];
        nodes.forEach(node => {
            ['src', 'href', 'data', 'data-url', 'data-media-url', 'data-video-url', 'data-playback-url', 'data-hls-url', 'data-mp4', 'data-source'].forEach(attr => add(node.getAttribute && node.getAttribute(attr)));
        });
        for (const candidate of candidates) {
            const normalized = normalizeMediaUrl(candidate);
            if (normalized) return normalized;
        }
        return null;
    }

    function replaceGifImages() {
        if (!settings.replaceGifs) return;
        document.querySelectorAll('img:not([data-rms-vjs-gif])').forEach(img => {
            if (inHiddenOrThumbnail(img) || img.closest('.rms-vjs-shell')) return;
            const raw = img.currentSrc || img.src;
            if (!raw || !/\.gifv?(?:[?#]|$)/i.test(raw)) return;
            const url = normalizeMediaUrl(raw);
            // Only replace GIFs when a real video URL can be derived.
            if (!url || !/\.(mp4|webm|m3u8)(?:[?#]|$)/i.test(url)) return;
            const video = document.createElement('video');
            video.className = 'video-js vjs-big-play-centered';
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('preload', settings.preload);
            video.dataset.rmsVjsGif = '1';
            const original = img.cloneNode(true);
            img.dataset.rmsVjsGif = '1';
            const sources = [{ src: url, type: inferType(url) }];
            img.replaceWith(video);
            makeVideoJs(video, sources, original);
        });
    }

    function replaceEmbedWrappers() {
        if (!settings.replaceEmbeds) return;
        const selector = 'iframe[src], object[data], embed[src], .expando, .media-preview, .media-preview-content, .media-embed, .video-wrapper, .video-container, .reddit-video-player, .res-media, [data-video-url], [data-media-url]';
        document.querySelectorAll(selector).forEach(wrapper => {
            if (wrapper.dataset.rmsVjsEmbedScanned === '1') return;
            if (inHiddenOrThumbnail(wrapper)) return;
            if (wrapper.matches('iframe, object, embed') && wrapper.closest('.rms-vjs-shell')) return;
            if (wrapper.querySelector && wrapper.querySelector('video[data-rms-vjs-ready], .rms-vjs-shell')) return;

            const url = findPlayableMediaUrl(wrapper);
            if (!url) return; // A lazy-loaded source may appear later.
            let mediaNode = wrapper.matches('iframe, object, embed')
                ? wrapper
                : wrapper.querySelector('iframe[src], object[data], embed[src], img');
            if (!mediaNode) return;

            // A provider page URL is not a direct media source. The userscript can
            // process that provider's own frame separately when browser permissions allow.
            if (!/\.(mp4|m4v|webm|ogv|ogg|m3u8|mpd|gifv?)(?:[?#]|$)/i.test(url) &&
                !/v\.redd\.it/i.test(url)) {
                wrapper.dataset.rmsVjsEmbedScanned = '1';
                return;
            }

            const video = document.createElement('video');
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.preload = settings.preload;
            const original = mediaNode;
            if (original.parentNode) {
                original.parentNode.insertBefore(video, original);
                original.hidden = true;
                wrapper.dataset.rmsVjsEmbedScanned = '1';
                makeVideoJs(video, [{ src: url, type: inferType(url) }], original);
            }
        });
    }

    function applySettingsToPlayers() {
        if (!window.videojs || !window.videojs.getPlayers) return;
        Object.values(window.videojs.getPlayers()).forEach(player => {
            if (!player || player.isDisposed && player.isDisposed()) return;
            try {
                player.controls(Boolean(settings.controls));
                player.loop(Boolean(settings.loop));
                player.muted(Boolean(settings.muted || settings.autoplay === 'muted' || settings.autoplay === 'any'));
                player.preload(settings.preload);
                player.playbackRate(settings.playbackRate);
                if (settings.autoplay !== 'off' && player.paused()) {
                    if (settings.autoplay === 'muted' || settings.autoplay === 'any') player.muted(true);
                    const result = player.play();
                    if (result && typeof result.catch === 'function') result.catch(() => {});
                }
            } catch (_) {}
        });
    }

    function scan() {
        scanQueued = false;
        if (!document.body || !window.videojs) return;
        addStyles();
        replaceExistingVideos();
        replaceGifImages();
        replaceEmbedWrappers();
    }

    function queueScan() {
        if (scanQueued) return;
        scanQueued = true;
        window.setTimeout(scan, 150);
    }

    function start() {
        addStyles();
        buildSettingsPanel();
        scan();
        observer = new MutationObserver(queueScan);
        observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href', 'data-url', 'data-video-url'] });
        window.addEventListener('pageshow', queueScan);
        window.addEventListener('popstate', queueScan);
        window.addEventListener('resize', () => {
            document.querySelectorAll('.rms-vjs-shell').forEach(shell => {
                const video = shell.querySelector('video');
                if (video && window.videojs.getPlayer(video)) {
                    try { window.videojs.getPlayer(video).trigger('playerresize'); } catch (_) {}
                }
            });
        }, { passive: true });
        console.info('[Universal Video.js] v' + VERSION + ' initialized on', location.href);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
