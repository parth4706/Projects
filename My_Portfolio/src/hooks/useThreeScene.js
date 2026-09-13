import { useEffect } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const debounce = (fn, wait) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
};

export function useThreeScene(canvasRef, reduceMotion, setMouse) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let scene;
    let camera;
    let renderer;
    let particles;
    let heroObject;
    let floaters;
    let clock;
    let frame;
    let visualFrame = 0;
    let scrollProgress = 0;
    let sceneReady = false;
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const dragPlane = new THREE.Plane();
    const dragOffset = new THREE.Vector3();
    const dragPoint = new THREE.Vector3();
    let dragDepth = 0;
    let dragging = false;
    let activePointerId = null;
    let hasDragged = false;
    const smallScreen = () => window.innerWidth < 760;

    const glowTexture = () => {
      const size = 128;
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = textureCanvas.height = size;
      const context = textureCanvas.getContext('2d');
      const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.25, 'rgba(160,215,255,0.9)');
      gradient.addColorStop(1, 'rgba(20,40,80,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(textureCanvas);
    };

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070c, 0.045);
    camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 14);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const texture = glowTexture();
    const count = smallScreen() ? 700 : (window.innerWidth < 1200 ? 1700 : 3000);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorOne = new THREE.Color('#3b82f6');
    const colorTwo = new THREE.Color('#22d3ee');
    for (let index = 0; index < count; index += 1) {
      const radius = 42 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[index * 3 + 2] = radius * Math.cos(phi) - 8;
      const color = colorOne.clone().lerp(colorTwo, Math.random());
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ size: 0.11, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, map: texture, sizeAttenuation: true }));
    scene.add(particles);

    const icosahedron = new THREE.IcosahedronGeometry(3, 1);
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(icosahedron), new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.55 }));
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 2), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.16 }));
    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color: 0x60a5fa, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    glowSprite.scale.set(9, 9, 1);
    heroObject = new THREE.Group();
    heroObject.add(wire, core, glowSprite);
    heroObject.position.set(window.innerWidth < 860 ? 0 : 3.4, 0.2, 0);
    scene.add(heroObject);

    const updatePointer = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    };
    const getPointerPoint = (event, target) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.ray.intersectPlane(dragPlane, target);
    };
    const pointerDown = (event) => {
      if (event.button !== 0) return;
      if (event.target.closest?.('a, button, input, textarea, select')) return;
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(heroObject, true)[0];
      if (!hit) return;
      dragDepth = heroObject.position.z;
      dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), heroObject.position);
      if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
      dragOffset.subVectors(heroObject.position, dragPoint);
      dragging = true;
      hasDragged = true;
      activePointerId = event.pointerId;
      if (event.target.setPointerCapture) event.target.setPointerCapture(event.pointerId);
      event.preventDefault();
    };
    const pointerMove = (event) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      if (!getPointerPoint(event, dragPoint)) return;
      const targetPosition = dragPoint.clone().add(dragOffset);
      targetPosition.z = dragDepth;
      heroObject.position.copy(targetPosition);
      event.preventDefault();
    };
    const pointerUp = (event) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      dragging = false;
      activePointerId = null;
      if (event.target.releasePointerCapture && event.target.hasPointerCapture?.(event.pointerId)) event.target.releasePointerCapture(event.pointerId);
    };
    window.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
    window.addEventListener('pointercancel', pointerUp);

    floaters = new THREE.Group();
    const floaterCount = smallScreen() ? 4 : 9;
    for (let index = 0; index < floaterCount; index += 1) {
      const geometry = new THREE.IcosahedronGeometry(0.18 + Math.random() * 0.32, 0);
      const mesh = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }));
      mesh.position.set((Math.random() - 0.5) * 32, (Math.random() - 0.5) * 22, (Math.random() - 0.5) * 30 - 14);
      mesh.userData.speed = 0.05 + Math.random() * 0.12;
      floaters.add(mesh);
    }
    scene.add(floaters);
    clock = new THREE.Clock();
    sceneReady = true;

    const resize = debounce(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (!hasDragged) heroObject.position.x = window.innerWidth < 860 ? 0 : 3.4;
    }, 180);
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!sceneReady) return;
      const time = clock.getElapsedTime();
      const { x: mouseX, y: mouseY } = setMouse.current;
      const mx = reduceMotion ? 0 : mouseX;
      const my = reduceMotion ? 0 : mouseY;
      heroObject.rotation.y = time * 0.12 + mx * 0.3;
      heroObject.rotation.x = time * 0.05 + my * 0.2;
      particles.rotation.y = time * 0.014 + scrollProgress * 0.5;
      floaters.children.forEach((floater) => { floater.rotation.x += floater.userData.speed * 0.01; floater.rotation.y += floater.userData.speed * 0.015; });
        camera.position.x += (mx * 1.1 - camera.position.x) * 0.045;
        camera.position.y += (-my * 0.7 - camera.position.y) * 0.045;
      camera.position.z += (14 - camera.position.z) * 0.045;
      camera.lookAt(0, 0, 0);
      if (visualFrame % 2 === 0) {
        const visuals = [];
        const projected = new THREE.Vector3();
        const addVisual = (position, radius) => {
          projected.copy(position).project(camera);
          if (projected.z < -1 || projected.z > 1) return;
          visuals.push({ x: (projected.x + 1) * window.innerWidth * 0.5, y: (1 - projected.y) * window.innerHeight * 0.5, radius });
        };
        const heroPosition = new THREE.Vector3();
        heroObject.getWorldPosition(heroPosition);
        addVisual(heroPosition, Math.min(window.innerWidth, window.innerHeight) * 0.16);
        floaters.children.forEach((floater) => {
          const floaterPosition = new THREE.Vector3();
          floater.getWorldPosition(floaterPosition);
          addVisual(floaterPosition, 22);
        });
        for (let index = 0; index < positions.length; index += 60) {
          const particlePosition = new THREE.Vector3(positions[index], positions[index + 1], positions[index + 2]);
          particles.localToWorld(particlePosition);
          addVisual(particlePosition, 10);
        }
        window.dispatchEvent(new CustomEvent('scene-visuals', { detail: visuals }));
      }
      visualFrame += 1;
      renderer.render(scene, camera);
    };
    animate();
    window.addEventListener('resize', resize);
    const scrollHandler = () => { scrollProgress = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    return () => {
      sceneReady = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
      window.removeEventListener('pointercancel', pointerUp);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose());
      });
      texture.dispose();
      renderer.dispose();
      gsap.killTweensOf(canvas);
    };
  }, [canvasRef, reduceMotion, setMouse]);
}
