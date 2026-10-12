// ==UserScript==
// @name         Touch Panel Resizer
// @namespace    https://github.com/Maxwells-Demon/RedditMobileStyle
// @version      2.2.0
// @description  Long-press or use Select mode to select and resize any webpage element. Saves dimensions per website.
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(() => {
  'use strict';
  if (window.top !== window.self) return;

  const KEY = 'touch-panel-resizer:' + location.origin + location.pathname;
  const read = () => {
    try { return JSON.parse(GM_getValue(KEY, '{}')); }
    catch { return {}; }
  };
  const saved = read();
  const store = () => GM_setValue(KEY, JSON.stringify(saved));

  let selected = null;
  let selector = '';
  let resizeStart = null;
  let selectionMode = false;
  let suppressNextClick = false;
  let selectionPointer = null;
  let longPressTimer = null;
  let touchStart = null;
  let longPressFired = false;
  let suppressUntil = 0;

  const host = document.createElement('div');
  host.style.cssText =
    'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      #box { position: fixed; display: none; border: 2px solid #15b8ff; pointer-events: none; }
      #handle {
        position: absolute; width: 40px; height: 40px; right: -20px; bottom: -20px;
        background: #15b8ff; border: 3px solid white; border-radius: 10px;
        pointer-events: auto; touch-action: none; box-shadow: 0 2px 8px #0008;
      }
      #bar {
        position: fixed; display: none; top: 8px; left: 50%; transform: translateX(-50%);
        background: #1d2530; color: white; border-radius: 12px; padding: 6px;
        gap: 6px; pointer-events: auto; font: 13px system-ui;
        box-shadow: 0 2px 12px #0008; max-width: 98vw; z-index: 2;
      }
      button {
        background: #33465b; color: white; border: 0; border-radius: 8px;
        padding: 10px; touch-action: manipulation; font: inherit; white-space: nowrap;
      }
      #status {
        position: fixed; top: 62px; left: 50%; transform: translateX(-50%);
        display: none; padding: 8px 12px; border-radius: 8px; color: white;
        background: #087db1; font: 13px system-ui; pointer-events: none;
      }
    </style>
    <div id="box"><div id="handle"></div></div>
    <div id="bar">
      <button id="select">Select</button>
      <button id="parent">Parent ↑</button>
      <button id="reset">Reset</button>
      <button id="close">Done</button>
    </div>
    <div id="status">Selection mode: tap an element</div>
  `;

  function installHost() {
    if (document.documentElement && !host.isConnected) {
      document.documentElement.append(host);
      applySaved();
    }
  }

  if (document.documentElement) {
    installHost();
  } else {
    const rootObserver = new MutationObserver(() => {
      if (document.documentElement) {
        installHost();
        rootObserver.disconnect();
      }
    });
    rootObserver.observe(document, { childList: true, subtree: true });
  }

  const box = shadow.getElementById('box');
  const bar = shadow.getElementById('bar');
  const handle = shadow.getElementById('handle');
  const status = shadow.getElementById('status');
  const selectButton = shadow.getElementById('select');

  function path(el) {
    if (el === document.documentElement) return 'html';
    if (el.id && CSS.escape) return '#' + CSS.escape(el.id);

    const parts = [];
    while (el && el.nodeType === 1 && el !== document.documentElement) {
      const tag = el.localName;
      const siblings = el.parentElement
        ? [...el.parentElement.children].filter(x => x.localName === tag)
        : [el];
      parts.unshift(tag + ':nth-of-type(' + (siblings.indexOf(el) + 1) + ')');
      el = el.parentElement;
    }
    return parts.join(' > ');
  }

  function update() {
    if (!selected || !selected.isConnected) {
      hideSelection();
      return;
    }
    const r = selected.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = r.left + 'px';
    box.style.top = r.top + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';
    bar.style.display = 'flex';
  }

  function hideSelection() {
    selected = null;
    box.style.display = 'none';
    bar.style.display = 'none';
  }

  function selectElement(el) {
    if (!el || host.contains(el) || el.nodeType !== 1) return;
    selected = el;
    selector = path(el);
    update();
    if (navigator.vibrate) navigator.vibrate(25);
  }

  function save() {
    if (!selected) return;
    saved[selector] = {
      w: selected.style.getPropertyValue('width'),
      h: selected.style.getPropertyValue('height'),
      boxSizing: selected.style.getPropertyValue('box-sizing')
    };
    store();
  }

  function applySaved() {
    for (const [key, val] of Object.entries(saved)) {
      try {
        const el = document.querySelector(key);
        if (!el) continue;
        if (val.w) el.style.setProperty('width', val.w, 'important');
        if (val.h) el.style.setProperty('height', val.h, 'important');
        if (val.boxSizing) el.style.setProperty('box-sizing', val.boxSizing, 'important');
      } catch {}
    }
  }

  function setSelectionMode(enabled) {
    selectionMode = enabled;
    status.style.display = enabled ? 'block' : 'none';
    if (enabled) status.textContent = 'Selection mode: tap an element';
  }

  function elementAt(x, y) {
    // Shadow DOM's overlay is excluded; inspect the page below it.
    const el = document.elementFromPoint(x, y);
    return el && !host.contains(el) ? el : null;
  }

  function cancelLongPress() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
    touchStart = null;
  }

  // Select mode: suppress the normal interaction and select on release.
  selectButton.addEventListener('click', () => setSelectionMode(true));

  document.addEventListener('pointerdown', e => {
    if (host.contains(e.target)) return;

    if (selectionMode) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      selectionPointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
      suppressNextClick = true;
      return;
    }

    // Long-press selection for touch and pen. Do not block normal interaction
    // unless the long-press threshold is reached.
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    cancelLongPress();
    longPressFired = false;
    touchStart = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY
    };
    const { x, y, id } = touchStart;

    longPressTimer = setTimeout(() => {
      if (!touchStart || touchStart.id !== id) return;
      longPressFired = true;
      suppressUntil = Date.now() + 900;
      suppressNextClick = true;
      const target = elementAt(x, y);
      if (target) selectElement(target);
      if (navigator.vibrate) navigator.vibrate([25, 35, 25]);
    }, 550);
  }, true);

  document.addEventListener('pointermove', e => {
    if (selectionPointer && e.pointerId === selectionPointer.id) {
      if (Math.hypot(e.clientX - selectionPointer.x, e.clientY - selectionPointer.y) > 10) {
        // Keep selection anchored to the initial tap; don't turn it into a drag.
      }
    }

    if (!touchStart || e.pointerId !== touchStart.id) return;
    if (Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y) > 12) {
      cancelLongPress();
    }
  }, true);

  document.addEventListener('pointerup', e => {
    if (selectionMode && selectionPointer && e.pointerId === selectionPointer.id) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const { x, y } = selectionPointer;
      selectionPointer = null;
      const target = elementAt(x, y);
      if (target) {
        selectElement(target);
        setSelectionMode(false);
      }
      return;
    }

    if (touchStart && e.pointerId === touchStart.id) {
      const wasLongPress = longPressFired;
      cancelLongPress();
      if (wasLongPress) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      longPressFired = false;
    }
  }, true);

  document.addEventListener('pointercancel', e => {
    if (selectionPointer && e.pointerId === selectionPointer.id) selectionPointer = null;
    if (touchStart && e.pointerId === touchStart.id) {
      cancelLongPress();
      longPressFired = false;
    }
  }, true);

  // Suppress the synthetic click produced after a long-press or Select-mode tap.
  document.addEventListener('click', e => {
    if (!suppressNextClick && Date.now() > suppressUntil) return;
    suppressNextClick = false;
    suppressUntil = 0;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  document.addEventListener('contextmenu', e => {
    if ((selectionMode || longPressFired) && !host.contains(e.target)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  handle.addEventListener('pointerdown', e => {
    if (!selected) return;
    e.preventDefault();
    e.stopPropagation();
    const r = selected.getBoundingClientRect();
    resizeStart = {
      id: e.pointerId, x: e.clientX, y: e.clientY, w: r.width, h: r.height
    };
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener('pointermove', e => {
    if (!resizeStart || e.pointerId !== resizeStart.id || !selected) return;
    const w = Math.max(30, resizeStart.w + e.clientX - resizeStart.x);
    const h = Math.max(30, resizeStart.h + e.clientY - resizeStart.y);
    selected.style.setProperty('box-sizing', 'border-box', 'important');
    selected.style.setProperty('width', w + 'px', 'important');
    selected.style.setProperty('height', h + 'px', 'important');
    update();
  });

  function finishResize(e) {
    if (!resizeStart || e.pointerId !== resizeStart.id) return;
    resizeStart = null;
    save();
  }
  handle.addEventListener('pointerup', finishResize);
  handle.addEventListener('pointercancel', finishResize);

  shadow.getElementById('parent').addEventListener('click', () => {
    if (selected?.parentElement && selected.parentElement !== host) {
      selectElement(selected.parentElement);
    }
  });

  shadow.getElementById('reset').addEventListener('click', () => {
    if (!selected) return;
    selected.style.removeProperty('width');
    selected.style.removeProperty('height');
    selected.style.removeProperty('box-sizing');
    delete saved[selector];
    store();
    update();
  });

  shadow.getElementById('close').addEventListener('click', () => {
    setSelectionMode(false);
    hideSelection();
  });

  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, true);

  new MutationObserver(() => {
    if (selected) update();
  }).observe(document.documentElement || document, { childList: true, subtree: true });
})();