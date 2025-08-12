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

    // Concentric productivity rings
    const rings = [];
    // Theme-aligned colors (primary: #2D46B9, secondary: #F50057)
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x2d46b9, metalness: 0.35, roughness: 0.35, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 3; i += 1) {
      const inner = 1.0 + i * 0.6;
      const outer = inner + 0.2;
      const ringGeom = new THREE.RingGeometry(inner, outer, 128);
      const mesh = new THREE.Mesh(ringGeom, ringMaterial.clone());
      mesh.rotation.x = Math.PI / 2;
      mesh.position.z = -i * 0.6;
      scene.add(mesh);
      rings.push(mesh);
    }

    // Orbiting nodes on rings
    const nodeGeom = new THREE.SphereGeometry(0.08, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({ color: 0xf50057, emissive: 0x40001a, emissiveIntensity: 0.1 });
    const nodes = [];
    const nodeCounts = [10, 16, 22];
    nodeCounts.forEach((count, idx) => {
      const radius = 1.1 + idx * 0.6;
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2;
        const n = new THREE.Mesh(nodeGeom, nodeMat.clone());
        n.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -idx * 0.6);
        scene.add(n);
        nodes.push({ mesh: n, baseAngle: angle, radius, layer: idx });
      }
    });

    // Background network points
    const count = 1200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      positions[i3 + 0] = (Math.random() - 0.5) * 32;
      positions[i3 + 1] = (Math.random() - 0.5) * 18;
      positions[i3 + 2] = (Math.random() - 0.5) * 24;
    }
    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.35 });
    const stars = new THREE.Points(starGeom, starMat);
    scene.add(stars);

    let rafId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      // Subtle ring rotation
      rings.forEach((r, i) => {
        r.rotation.z += delta * (0.025 + i * 0.01);
      });
      // Orbit nodes
      nodes.forEach((n, i) => {
        const speed = 0.12 + n.layer * 0.045;
        const angle = n.baseAngle + clock.elapsedTime * speed;
        n.mesh.position.x = Math.cos(angle) * n.radius;
        n.mesh.position.y = Math.sin(angle) * n.radius;
      });
      stars.rotation.y += delta * 0.06;
      stars.rotation.x += delta * 0.015;
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
      rings.forEach(r => r.geometry.dispose());
      rings.forEach(r => r.material.dispose());
      starGeom.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
};

export default HeroCanvas;

