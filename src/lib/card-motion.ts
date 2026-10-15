const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');

for (const card of document.querySelectorAll<HTMLElement>('.post-card,.topic-tile,.category-grid>a')) {
  let frame = 0;
  const reset = () => {
    cancelAnimationFrame(frame);
    card.style.removeProperty('transform');
  };
  card.addEventListener('pointermove', (event) => {
    if (motionQuery.matches || !pointerQuery.matches || event.pointerType === 'touch') return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      const y = (event.clientY - box.top) / box.height - .5;
      card.style.transform = `perspective(1100px) translateY(-5px) rotateX(${-y * 2.4}deg) rotateY(${x * 2.4}deg)`;
    });
  }, { passive: true });
  card.addEventListener('pointerleave', reset);
  card.addEventListener('pointercancel', reset);
  motionQuery.addEventListener('change', reset);
  pointerQuery.addEventListener('change', reset);
}
