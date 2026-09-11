import { useEffect } from 'react';

export function useNetworkCanvas(canvasRef, reduceMotion) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nodes = [];
    let width = 0;
    let height = 0;
    let frame = null;
    let observer;
    let mouseX = -9999;
    let mouseY = -9999;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = Math.max(1, rect.width * dpr);
      height = canvas.height = Math.max(1, rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement);
    const count = window.innerWidth < 760 ? 24 : 46;
    for (let index = 0; index < count; index += 1) nodes.push({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 });

    const drawStatic = () => {
      context.clearRect(0, 0, width, height);
      nodes.forEach((node) => { context.beginPath(); context.fillStyle = 'rgba(147,215,255,0.9)'; context.arc(node.x, node.y, 2.6 * dpr, 0, Math.PI * 2); context.fill(); });
    };
    const tick = () => {
      frame = requestAnimationFrame(tick);
      context.clearRect(0, 0, width, height);
      nodes.forEach((node) => {
        node.x += node.vx; node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        const dx = mouseX - node.x; const dy = mouseY - node.y; const distance = Math.hypot(dx, dy);
        if (distance < 130) { node.x -= (dx / distance) * 0.7; node.y -= (dy / distance) * 0.7; }
      });
      for (let first = 0; first < nodes.length; first += 1) for (let second = first + 1; second < nodes.length; second += 1) {
        const dx = nodes[first].x - nodes[second].x; const dy = nodes[first].y - nodes[second].y; const distance = Math.hypot(dx, dy);
        if (distance < 140) { context.strokeStyle = `rgba(56,189,248,${((1 - distance / 140) * 0.5).toFixed(3)})`; context.lineWidth = dpr; context.beginPath(); context.moveTo(nodes[first].x, nodes[first].y); context.lineTo(nodes[second].x, nodes[second].y); context.stroke(); }
      }
      nodes.forEach((node) => { context.beginPath(); context.fillStyle = 'rgba(147,215,255,0.9)'; context.arc(node.x, node.y, 2.1 * dpr, 0, Math.PI * 2); context.fill(); });
    };
    const move = (event) => { const rect = canvas.getBoundingClientRect(); mouseX = (event.clientX - rect.left) * (width / rect.width); mouseY = (event.clientY - rect.top) * (height / rect.height); };
    const leave = () => { mouseX = -9999; mouseY = -9999; };
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
    if (reduceMotion) drawStatic();
    else {
      observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !frame) tick(); else if (!entry.isIntersecting && frame) { cancelAnimationFrame(frame); frame = null; } }, { threshold: 0.05 });
      observer.observe(canvas);
    }
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); resizeObserver.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); };
  }, [canvasRef, reduceMotion]);
}
