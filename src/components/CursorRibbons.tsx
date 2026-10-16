import { useEffect, useState } from 'react';
import Ribbons from './vendor/Ribbons';
import '../styles/cursor-ribbons.css';

export default function CursorRibbons() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setEnabled(pointer.matches && !motion.matches);
    pointer.addEventListener('change', sync);
    motion.addEventListener('change', sync);
    sync();
    return () => {
      pointer.removeEventListener('change', sync);
      motion.removeEventListener('change', sync);
    };
  }, []);
  return (
    <div className="cursor-ribbons" data-pointer-effects data-effect="ribbons" aria-hidden="true" hidden={!enabled}>
      {enabled && <Ribbons colors={['#67c6e3', '#9c88ee', '#e69bb8']} thickness={14} length={1.2} spread={8} stiffness={0.5} bounce={0.25} shape="comet" softness={0.18} fade opacity={0.82} dpr={1.25} style={{}}/>}
    </div>
  );
}
