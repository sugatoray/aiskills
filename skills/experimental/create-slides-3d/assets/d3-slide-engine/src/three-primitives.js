/**
 * Optional Three.js adapter for the slide engine.
 *
 * The module owns only reusable graphics primitives. Content, scene data, and
 * typography stay in the HTML layer. It is safe to omit this module when a
 * page needs a pure D3/SVG fallback.
 */

export function createWorld(THREE, canvas, { background = 0x0d1011 } = {}) {
  if (!THREE || !canvas) throw new TypeError("THREE and canvas are required");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setClearColor(background, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 2000);
  camera.position.set(0, 20, 52);
  camera.lookAt(0, 0, 0);
  const root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.AmbientLight(0xdceee8, 1.3));
  const key = new THREE.DirectionalLight(0x9fe9d0, 2.2);
  key.position.set(-20, 35, 35);
  scene.add(key);
  return { renderer, scene, camera, root };
}

export function addWireCube(THREE, root, { size = 1, color = 0x93dcb6, opacity = 0.8, position = [0, 0, 0] } = {}) {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.08, transparent: true, opacity });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.min(1, opacity + 0.15) }));
  mesh.add(edges);
  root.add(mesh);
  return mesh;
}

export function addNodeField(THREE, root, { nodes = [], links = [], color = 0x93dcb6 } = {}) {
  const group = new THREE.Group();
  const nodeGeometry = new THREE.SphereGeometry(0.23, 12, 8);
  const nodeMaterial = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.55 });
  for (const node of nodes) {
    const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
    mesh.position.set(node.x, node.y, node.z || 0);
    mesh.userData = { id: node.id };
    group.add(mesh);
  }
  const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.42 });
  for (const [from, to] of links) {
    const a = nodes.find((node) => node.id === from);
    const b = nodes.find((node) => node.id === to);
    if (!a || !b) continue;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x, a.y, a.z || 0),
      new THREE.Vector3(b.x, b.y, b.z || 0)
    ]);
    group.add(new THREE.Line(geometry, lineMaterial));
  }
  root.add(group);
  return group;
}

export function resizeWorld(world, width, height) {
  if (!world || !(width > 0) || !(height > 0)) return;
  world.camera.aspect = width / height;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(width, height, false);
}

export function disposeWorld(world) {
  if (!world) return;
  world.root.traverse((object) => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
    else object.material?.dispose();
  });
  world.renderer.dispose();
}
