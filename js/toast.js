/* Sathya Bio toaster - Sonner-style notifications for the static pages
 * (storefront, checkout, order status). The React app uses Sonner itself,
 * with the same palette, so notifications look alike across the site.
 *
 *   toast('Saved')                           toast.success(message, opts)
 *   toast.error(message, opts)               toast.warning / toast.info
 *   const id = toast.loading('Placing order...')
 *   toast.success('Order placed', { id })    // updates that toast in place
 *   toast.promise(promise, { loading, success, error })
 *   toast.dismiss(id)  /  toast.dismiss()    // one / all
 *   toast.flash(message, type)               // shown on the next page load
 *
 * opts: { description, duration, id, action: { label, onClick } }
 *
 * Messages are always set as text, never HTML. Toasts stack (3 visible),
 * expand on hover or tap, pause while hovered, touched or the tab is hidden,
 * swipe away, ignore exact repeats, announce to screen readers, and honour
 * prefers-reduced-motion. Motion is transform/opacity only.
 */
(() => {
  if (window.toast) return;

  const VISIBLE = 3;
  const GAP = 10;
  const PEEK = 10;
  const EXIT_MS = 320;
  const SWIPE_DISTANCE = 45;
  const FLASH_KEY = 'sbt-flash';
  const DURATIONS = { default: 4000, success: 4000, info: 4000, warning: 5000, error: 6000, loading: Infinity };

  const svg = path => `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="${path}"/></svg>`;
  const ICONS = {
    success: svg('M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z'),
    error: svg('M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z'),
    warning: svg('M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'),
    info: svg('M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z'),
    loading: '<span class="sbt-spinner" aria-hidden="true"></span>',
  };
  const CLOSE_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';

  const CSS = `
.sbt-region{position:fixed;z-index:100000;top:calc(16px + env(safe-area-inset-top,0px));right:16px;width:356px;max-width:calc(100vw - 32px);margin:0;padding:0;list-style:none;pointer-events:none;outline:none;transition:height .35s ease}
@media (max-width:640px){.sbt-region{top:calc(10px + env(safe-area-inset-top,0px));left:12px;right:12px;width:auto;max-width:none}}
.sbt-toast{--sbt-y:0px;--sbt-scale:1;--sbt-swipe-x:0px;--sbt-swipe-y:0px;position:absolute;top:0;left:0;right:0;box-sizing:border-box;display:flex;align-items:center;gap:10px;min-height:52px;padding:14px 38px 14px 14px;overflow:hidden;border-radius:14px;background:#fff;color:#0f172a;border:1px solid #e2e8f0;box-shadow:0 8px 24px rgba(15,23,42,.10),0 2px 6px rgba(15,23,42,.06);font-family:inherit;font-size:.875rem;font-weight:500;line-height:1.4;text-align:left;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;transform-origin:top center;transform:translate3d(var(--sbt-swipe-x),calc(var(--sbt-y) + var(--sbt-swipe-y)),0) scale(var(--sbt-scale));transition:transform .45s cubic-bezier(.21,1.02,.73,1),opacity .35s ease,height .35s ease,background-color .2s ease;will-change:transform}
.sbt-toast::after{content:'';position:absolute;left:0;right:0;top:100%;height:${GAP + 2}px}
.sbt-toast[data-state="entering"]{opacity:0;transform:translate3d(0,calc(-100% - 16px),0) scale(1)}
.sbt-toast[data-state="exiting"]{opacity:0;transform:translate3d(var(--sbt-swipe-x),calc(var(--sbt-y) + var(--sbt-swipe-y) - 24px),0) scale(.96);pointer-events:none}
.sbt-toast[data-swiping="true"]{transition:none}
.sbt-toast[data-front="false"][data-expanded="false"]>*{opacity:0}
.sbt-toast>*{transition:opacity .25s ease}
.sbt-icon{flex:0 0 20px;width:20px;height:20px;margin-top:0;display:flex;align-items:center;justify-content:center}
.sbt-icon svg{width:20px;height:20px}
.sbt-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.sbt-title{white-space:pre-line;overflow-wrap:anywhere}
.sbt-description{font-size:.8125rem;font-weight:400;opacity:.85;white-space:pre-line;overflow-wrap:anywhere}
.sbt-action{align-self:center;flex:0 0 auto;margin-left:4px;padding:6px 10px;border:0;border-radius:8px;background:#0f172a;color:#fff;font:inherit;font-size:.8rem;font-weight:600;cursor:pointer}
.sbt-close{position:absolute;top:8px;right:8px;width:24px;height:24px;min-width:0;min-height:0;padding:0;display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;background:transparent;color:currentColor;opacity:.5;cursor:pointer;transition:opacity .15s ease,background-color .15s ease}
.sbt-close svg{width:14px;height:14px}
.sbt-close:hover,.sbt-close:focus-visible{opacity:1;background:rgba(15,23,42,.08);outline:none}
.sbt-toast:focus-visible{outline:2px solid #16a34a;outline-offset:2px}
.sbt-toast[data-type="success"]{background:#ecfdf3;border-color:#bbf7d0;color:#166534}
.sbt-toast[data-type="error"]{background:#fef2f2;border-color:#fecaca;color:#b91c1c}
.sbt-toast[data-type="warning"]{background:#fffbeb;border-color:#fde68a;color:#b45309}
.sbt-toast[data-type="info"]{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}
.sbt-toast[data-type="loading"]{color:#334155}
.sbt-spinner{width:16px;height:16px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;opacity:.7;animation:sbt-spin .7s linear infinite}
.sbt-toast[data-pulse="true"]{animation:sbt-pulse .35s ease}
@keyframes sbt-spin{to{transform:rotate(360deg)}}
@keyframes sbt-pulse{50%{background-color:#fff}}
@media (prefers-reduced-motion:reduce){.sbt-toast,.sbt-toast>*{transition:opacity .2s ease!important}.sbt-toast[data-state="entering"],.sbt-toast[data-state="exiting"]{transform:translate3d(0,var(--sbt-y),0) scale(var(--sbt-scale))}.sbt-spinner{animation-duration:1.6s}}
`;

  let region = null;
  let list = null;
  let seq = 0;
  const items = [];
  let expanded = false;
  let touching = false;
  // Pausing is separate from expanding: a single toast has nothing to expand,
  // but must still wait while it is hovered, focused or touched.
  let hovering = false;
  let focused = false;
  let layoutQueued = false;
  let collapseTimer = 0;

  function ensureRegion() {
    if (region) return;
    const style = document.createElement('style');
    style.id = 'sbtStyles';
    style.textContent = CSS;
    document.head.appendChild(style);

    region = document.createElement('section');
    region.className = 'sbt-region';
    region.setAttribute('aria-label', 'Notifications');
    region.tabIndex = -1;
    list = document.createElement('ol');
    list.setAttribute('aria-live', 'polite');
    list.setAttribute('aria-relevant', 'additions text');
    list.style.cssText = 'margin:0;padding:0;list-style:none';
    region.appendChild(list);
    document.body.appendChild(region);

    document.addEventListener('visibilitychange', syncTimers);
    document.addEventListener('pointerdown', e => {
      // A tap outside collapses an expanded stack.
      if (expanded && !region.contains(e.target)) setExpanded(false);
    }, { passive: true });
  }

  const live = () => items.filter(i => i.state !== 'exiting');
  const paused = () => expanded || hovering || focused || touching || document.visibilityState === 'hidden';

  function queueLayout() {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(layout);
  }

  function layout() {
    layoutQueued = false;
    const shown = live();
    // Read every natural height first, then write, to avoid layout thrash.
    // Measured from the content, not the toast: a toast's own scrollHeight never
    // drops below the height it was last given, so one that moved to the front
    // of the stack stayed as tall as the toast that had been there.
    shown.forEach(i => {
      const body = i.el.querySelector('.sbt-body');
      const action = i.el.querySelector('.sbt-action');
      const content = Math.max(20, body ? body.offsetHeight : 0, action ? action.offsetHeight : 0);
      i.height = Math.max(52, content + 28 + 2); // 14px padding top and bottom, 1px borders
    });
    const frontH = shown[0] ? shown[0].height : 0;
    let offset = 0;
    shown.forEach((item, index) => {
      const el = item.el;
      const visible = index < VISIBLE;
      let y;
      let scale;
      let h;
      if (expanded) {
        y = offset;
        scale = 1;
        h = item.height;
        offset += item.height + GAP;
      } else {
        y = index * PEEK;
        scale = 1 - index * 0.05;
        h = index === 0 ? item.height : frontH;
      }
      el.dataset.front = String(index === 0);
      el.dataset.expanded = String(expanded);
      el.style.zIndex = String(100 - index);
      el.style.setProperty('--sbt-y', `${y}px`);
      el.style.setProperty('--sbt-scale', String(scale));
      el.style.height = `${h}px`;
      el.style.opacity = visible ? '' : '0';
      el.style.pointerEvents = visible ? '' : 'none';
      el.setAttribute('aria-hidden', String(!visible));
      if (item.state === 'entering') {
        // Let the entering position paint once, then slide in.
        requestAnimationFrame(() => { if (item.state === 'entering') { item.state = 'visible'; el.dataset.state = 'visible'; } });
      }
    });
    if (region) {
      region.style.height = expanded
        ? `${Math.max(0, offset - GAP)}px`
        : `${frontH ? frontH + PEEK * (Math.min(VISIBLE, shown.length) - 1) : 0}px`;
    }
  }

  function setExpanded(next) {
    if (expanded === next) return;
    // A single toast has nothing to expand.
    if (next && live().length < 2) return;
    expanded = next;
    syncTimers();
    queueLayout();
  }

  function syncTimers() {
    const now = Date.now();
    items.forEach(item => {
      if (item.state === 'exiting' || item.duration === Infinity) return;
      if (paused()) {
        if (item.timer) {
          clearTimeout(item.timer);
          item.timer = 0;
          item.remaining -= now - item.startedAt;
        }
      } else if (!item.timer) {
        item.startedAt = now;
        item.timer = setTimeout(() => dismiss(item.id), Math.max(0, item.remaining));
      }
    });
  }

  function startTimer(item) {
    clearTimeout(item.timer);
    item.timer = 0;
    item.remaining = item.duration;
    if (item.duration !== Infinity) syncTimers();
  }

  function render(item) {
    const { el, type, message, opts } = item;
    el.dataset.type = type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.replaceChildren();

    if (ICONS[type]) {
      const icon = document.createElement('span');
      icon.className = 'sbt-icon';
      icon.innerHTML = ICONS[type];
      el.appendChild(icon);
    }

    const body = document.createElement('div');
    body.className = 'sbt-body';
    const title = document.createElement('span');
    // sb-toast-text: kept so page code and tests that look for it keep working.
    title.className = 'sbt-title sb-toast-text';
    title.textContent = String(message ?? '');
    body.appendChild(title);
    if (opts.description) {
      const description = document.createElement('span');
      description.className = 'sbt-description';
      description.textContent = String(opts.description);
      body.appendChild(description);
    }
    el.appendChild(body);

    if (opts.action && opts.action.label) {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'sbt-action';
      action.textContent = opts.action.label;
      action.addEventListener('click', event => {
        opts.action.onClick?.(event);
        if (!event.defaultPrevented) dismiss(item.id);
      });
      el.appendChild(action);
    }

    if (type !== 'loading') {
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'sbt-close';
      close.setAttribute('aria-label', 'Close notification');
      close.innerHTML = CLOSE_ICON;
      close.addEventListener('click', () => dismiss(item.id));
      el.appendChild(close);
    }
  }

  function attachGestures(item) {
    const el = item.el;
    let start = null;
    let axis = null;

    // Hover means a real mouse only: phones fire a compatibility mouseenter on
    // tap but never the matching mouseleave, which left the timer paused.
    el.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(collapseTimer);
      hovering = true;
      syncTimers();
      setExpanded(true);
    });
    el.addEventListener('pointerleave', e => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(collapseTimer);
      // Short grace period, so moving between stacked toasts does not flicker.
      collapseTimer = setTimeout(() => {
        hovering = false;
        setExpanded(false);
        syncTimers();
      }, 120);
    });
    el.addEventListener('focusin', () => {
      // Keyboard focus pauses; a tap also focuses the toast, but nothing moves
      // focus away afterwards on a phone, so that must not pause it.
      if (!el.matches(':focus-visible') && !el.querySelector(':focus-visible')) return;
      focused = true;
      syncTimers();
      setExpanded(true);
    });
    el.addEventListener('focusout', e => {
      if (region.contains(e.relatedTarget)) return;
      focused = false;
      setExpanded(false);
      syncTimers();
    });
    el.addEventListener('keydown', e => { if (e.key === 'Escape') dismiss(item.id); });

    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button')) return;
      start = { x: e.clientX, y: e.clientY, t: performance.now() };
      axis = null;
      if (e.pointerType !== 'mouse') {
        touching = true;
        syncTimers();
      }
      el.setPointerCapture?.(e.pointerId);
    });

    el.addEventListener('pointermove', e => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        el.dataset.swiping = 'true';
      }
      if (axis === 'x') el.style.setProperty('--sbt-swipe-x', `${dx}px`);
      // Toasts sit at the top, so they only swipe upward.
      else el.style.setProperty('--sbt-swipe-y', `${Math.min(0, dy)}px`);
    });

    const end = e => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const elapsed = Math.max(1, performance.now() - start.t);
      const wasTap = !axis;
      start = null;
      el.dataset.swiping = 'false';
      if (touching) {
        touching = false;
        syncTimers();
      }
      const distance = axis === 'x' ? Math.abs(dx) : Math.max(0, -dy);
      if (axis && (distance > SWIPE_DISTANCE || distance / elapsed > 0.5)) {
        if (axis === 'x') el.style.setProperty('--sbt-swipe-x', `${Math.sign(dx) * (el.offsetWidth + 40)}px`);
        else el.style.setProperty('--sbt-swipe-y', `${-(el.offsetHeight + 40)}px`);
        dismiss(item.id);
        return;
      }
      el.style.setProperty('--sbt-swipe-x', '0px');
      el.style.setProperty('--sbt-swipe-y', '0px');
      // Tapping a stack on a touch screen opens it up; tapping again closes it.
      if (wasTap && e.pointerType !== 'mouse' && e.type === 'pointerup') setExpanded(!expanded);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function show(type, message, opts = {}) {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => show(type, message, opts), { once: true });
      return opts.id ?? `sbt-${++seq}`;
    }
    ensureRegion();
    const duration = opts.duration ?? DURATIONS[type] ?? DURATIONS.default;

    // Update in place.
    if (opts.id != null) {
      const existing = items.find(i => i.id === opts.id && i.state !== 'exiting');
      if (existing) {
        Object.assign(existing, { type, message, opts, duration });
        render(existing);
        startTimer(existing);
        queueLayout();
        return existing.id;
      }
    }

    // The same message already on screen: refresh it instead of stacking a copy.
    const duplicate = opts.id == null && items.find(i => i.state !== 'exiting' && i.type === type && i.message === message && (i.opts.description || '') === (opts.description || ''));
    if (duplicate) {
      items.splice(items.indexOf(duplicate), 1);
      items.unshift(duplicate);
      duplicate.el.dataset.pulse = 'false';
      requestAnimationFrame(() => { duplicate.el.dataset.pulse = 'true'; });
      startTimer(duplicate);
      queueLayout();
      return duplicate.id;
    }

    const id = opts.id ?? `sbt-${++seq}`;
    const el = document.createElement('li');
    el.className = 'sbt-toast sb-toast';
    el.tabIndex = 0;
    el.dataset.state = 'entering';
    el.dataset.front = 'true';
    el.dataset.expanded = String(expanded);
    const item = { id, el, type, message, opts, duration, state: 'entering', timer: 0, remaining: duration, startedAt: 0, height: 0 };
    render(item);
    attachGestures(item);
    items.unshift(item);
    list.prepend(el);

    // Keep the DOM small: anything beyond the visible stack is let go.
    live().slice(VISIBLE + 1).forEach(old => dismiss(old.id));

    startTimer(item);
    queueLayout();
    return id;
  }

  function dismiss(id) {
    if (id === undefined) {
      items.slice().forEach(i => dismiss(i.id));
      return;
    }
    const item = items.find(i => i.id === id);
    if (!item || item.state === 'exiting') return;
    clearTimeout(item.timer);
    item.state = 'exiting';
    item.el.dataset.state = 'exiting';
    setTimeout(() => {
      item.el.remove();
      const index = items.indexOf(item);
      if (index !== -1) items.splice(index, 1);
      if (live().length < 2 && expanded) {
        expanded = false;
        syncTimers();
      }
      queueLayout();
    }, EXIT_MS);
    queueLayout();
  }

  const toast = (message, opts) => show('default', message, opts);
  toast.success = (message, opts) => show('success', message, opts);
  toast.error = (message, opts) => show('error', message, opts);
  toast.warning = (message, opts) => show('warning', message, opts);
  toast.info = (message, opts) => show('info', message, opts);
  toast.loading = (message, opts) => show('loading', message, opts);
  toast.dismiss = dismiss;

  toast.promise = (promise, messages = {}) => {
    const id = toast.loading(messages.loading || 'Loading...');
    const pending = typeof promise === 'function' ? promise() : promise;
    const pick = (value, arg) => (typeof value === 'function' ? value(arg) : value);
    Promise.resolve(pending).then(
      result => {
        const message = pick(messages.success, result);
        if (message) show('success', message, { id });
        else dismiss(id);
      },
      error => show('error', pick(messages.error, error) || error?.message || 'Something went wrong', { id }),
    );
    return pending;
  };

  // A message for the next page, e.g. "Order placed" before redirecting.
  toast.flash = (message, type = 'success', opts = {}) => {
    try {
      const queued = JSON.parse(sessionStorage.getItem(FLASH_KEY) || '[]');
      queued.push({ message: String(message), type, description: opts.description, duration: opts.duration });
      sessionStorage.setItem(FLASH_KEY, JSON.stringify(queued.slice(-3)));
    } catch {
      /* storage unavailable: nothing to carry over */
    }
  };

  function showFlashes() {
    let queued = [];
    try {
      queued = JSON.parse(sessionStorage.getItem(FLASH_KEY) || '[]');
      sessionStorage.removeItem(FLASH_KEY);
    } catch {
      return;
    }
    queued.forEach(f => show(DURATIONS[f.type] !== undefined ? f.type : 'default', f.message, { description: f.description, duration: f.duration }));
  }

  window.toast = toast;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showFlashes, { once: true });
  else showFlashes();
})();
