import { useEffect } from 'react';
import { gsap } from 'gsap';

export function useTilt(ref, max, enabled) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return undefined;
    const move = (event) => { const rect = element.getBoundingClientRect(); const px = (event.clientX - rect.left) / rect.width - 0.5; const py = (event.clientY - rect.top) / rect.height - 0.5; gsap.to(element, { rotateY: px * max, rotateX: -py * max, duration: 0.45, ease: 'power2.out', transformPerspective: 700 }); };
    const leave = () => gsap.to(element, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
    element.addEventListener('mousemove', move); element.addEventListener('mouseleave', leave);
    return () => { element.removeEventListener('mousemove', move); element.removeEventListener('mouseleave', leave); gsap.killTweensOf(element); };
  }, [ref, max, enabled]);
}
