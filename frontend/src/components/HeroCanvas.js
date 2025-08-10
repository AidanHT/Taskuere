import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const HeroCanvas = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 5, 5);
    scene.add(dir);

    // Floating TorusKnot
    const torusGeom = new THREE.TorusKnotGeometry(1.2, 0.35, 200, 32);
    const torusMat = new THREE.MeshStandardMaterial({ color: 0xff4081, metalness: 0.6, roughness: 0.2 });
    const torus = new THREE.Mesh(torusGeom, torusMat);
    scene.add(torus);

    // Sparkle field (Points)
    const count = 1500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      positions[i3 + 0] = (Math.random() - 0.5) * 40;
      positions[i3 + 1] = (Math.random() - 0.5) * 40;
      positions[i3 + 2] = (Math.random() - 0.5) * 40;
    }
    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.03 });
    const stars = new THREE.Points(starGeom, starMat);
    scene.add(stars);

    let rafId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      torus.rotation.x += delta * 0.6;
      torus.rotation.y += delta * 0.8;
      stars.rotation.y += delta * 0.1;
      stars.rotation.x += delta * 0.02;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
      torusGeom.dispose();
      torusMat.dispose();
      starGeom.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
};

export default HeroCanvas;

