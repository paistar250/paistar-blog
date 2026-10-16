const layer = document.querySelector<HTMLElement>('[data-pointer-effects]');
if (layer) {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let dispose: (() => void) | undefined;
  const sync = () => {
    dispose?.();
    dispose = undefined;
    layer.hidden = true;
    if (!finePointer.matches || reducedMotion.matches) return;
    const ring = layer.querySelector<HTMLElement>('.pointer-ring')!;
    const dot = layer.querySelector<HTMLElement>('.pointer-dot')!;
    const sparks = [...layer.querySelectorAll<HTMLElement>('.pointer-spark')];
    const ripples = [...layer.querySelectorAll<HTMLElement>('.pointer-ripple')];
    const events = new AbortController();
    const options = { passive: true, signal: events.signal };
    let frame = 0;
    let lastFrame = 0;
    let x = 0, y = 0, targetX = 0, targetY = 0;
    let started = false;
    let lastSpark = 0, sparkX = 0, sparkY = 0, sparkIndex = 0, rippleIndex = 0;
    layer.hidden = false;
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      started = false;
      layer.classList.remove('is-visible');
      for (const node of [...sparks, ...ripples]) node.getAnimations().forEach(animation => animation.cancel());
    };
    const render = (time: number) => {
      const dt = Math.min(40, time - lastFrame || 16.67);
      const ease = 1 - Math.pow(.78, dt / 16.67);
      lastFrame = time;
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      ring.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      if (Math.hypot(targetX - x, targetY - y) > .08) frame = requestAnimationFrame(render);
      else frame = 0;
    };
    const pulse = (node: HTMLElement, frames: Keyframe[], duration: number) => {
      node.getAnimations().forEach(animation => animation.cancel());
      node.animate(frames, { duration, easing: 'cubic-bezier(.2,.65,.3,1)' });
    };
    document.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') { stop(); return; }
      const element = event.target instanceof Element ? event.target : null;
      if (element?.closest('input:not([type=checkbox]),textarea,select,[contenteditable]:not([contenteditable=false]),dialog')) { stop(); return; }
      targetX = event.clientX;
      targetY = event.clientY;
      const interactive = Boolean(element?.closest('a,button,summary,label,[role=button]'));
      layer.dataset.mode = interactive ? 'link' : 'normal';
      if (!started) {
        x = targetX; y = targetY;
        sparkX = x; sparkY = y;
        started = true;
      }
      dot.style.transform = `translate3d(${targetX}px,${targetY}px,0) translate(-50%,-50%)`;
      layer.classList.add('is-visible');
      if (!frame) { lastFrame = performance.now(); frame = requestAnimationFrame(render); }
      const time = performance.now();
      if (!interactive && time - lastSpark > 75 && Math.hypot(targetX - sparkX, targetY - sparkY) > 22) {
        const spark = sparks[sparkIndex++ % sparks.length];
        pulse(spark, [
          { transform: `translate3d(${targetX - 3}px,${targetY - 3}px,0) scale(.8) rotate(0deg)`, opacity: .65 },
          { transform: `translate3d(${targetX - 7}px,${targetY - 12}px,0) scale(0) rotate(65deg)`, opacity: 0 },
        ], 480);
        sparkX = targetX; sparkY = targetY; lastSpark = time;
      }
    }, options);
    document.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || !layer.classList.contains('is-visible')) return;
      const ripple = ripples[rippleIndex++ % ripples.length];
      const pos = `translate3d(${event.clientX - 12.5}px,${event.clientY - 12.5}px,0)`;
      pulse(ripple, [
        { transform: pos + ' scale(.4)', opacity: .7 },
        { transform: pos + ' scale(2.6)', opacity: 0 },
      ], 500);
    }, options);
    document.addEventListener('pointerout', event => { if (!event.relatedTarget) stop(); }, options);
    document.addEventListener('pointercancel', stop, options);
    document.addEventListener('keydown', stop, { signal: events.signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }, { signal: events.signal });
    window.addEventListener('blur', stop, options);
    window.addEventListener('scroll', stop, options);
    window.addEventListener('resize', stop, options);
    dispose = () => { stop(); events.abort(); layer.hidden = true; };
  };
  finePointer.addEventListener('change', sync);
  reducedMotion.addEventListener('change', sync);
  sync();
}
