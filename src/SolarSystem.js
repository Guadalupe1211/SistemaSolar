import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const SolarSystem = () => {
  const mountRef = useRef(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null); // Estado para almacenar el planeta seleccionado

  useEffect(() => {
    const currentMount = mountRef.current;

    // Escena, cámara y renderizador
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    currentMount.appendChild(renderer.domElement);

    // Controles de la cámara (OrbitControls)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = false;

    // Raycaster para detectar clics
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Cargar texturas
    const textureLoader = new THREE.TextureLoader();
    const sunTexture = textureLoader.load('textures/sun.jpg');
    const mercuryTexture = textureLoader.load('textures/mercury.jpg');
    const venusTexture = textureLoader.load('textures/venus.jpg');
    const earthTexture = textureLoader.load('textures/earth.jpg');
    const marsTexture = textureLoader.load('textures/mars.jpg');
    const jupiterTexture = textureLoader.load('textures/jupiter.jpg');
    const saturnTexture = textureLoader.load('textures/saturn.jpg');
    const uranusTexture = textureLoader.load('textures/uranus.jpg');
    const neptuneTexture = textureLoader.load('textures/neptune.jpg');

    // Crear el Sol con textura
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    // Luz brillante para el Sol
    const sunLight = new THREE.PointLight(0xffaa33, 2, 50); // Luz anaranjada intensa
    sunLight.position.set(0, 0, 0); // Posición del Sol
    scene.add(sunLight);

    // Crear efecto de resplandor para el Sol
    const sunGlowGeometry = new THREE.SphereGeometry(3.5, 32, 32);
    const sunGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        viewVector: { type: "v3", value: camera.position },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 viewVector;
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vPositionNormal), 2.0);
          gl_FragColor = vec4(1.0, 0.6, 0.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    scene.add(sunGlow);

    // Información de los planetas
    const planetData = [
      { name: 'Mercurio', texture: mercuryTexture, distance: 5, size: 0.5, speed: 0.02, rotationSpeed: 0.005, info: 'Mercurio es el planeta más cercano al Sol.' },
      { name: 'Venus', texture: venusTexture, distance: 8, size: 0.7, speed: 0.015, rotationSpeed: 0.003, info: 'Venus es el segundo planeta del sistema solar.' },
      { name: 'Tierra', texture: earthTexture, distance: 11, size: 0.9, speed: 0.01, rotationSpeed: 0.01, info: 'La Tierra es nuestro hogar y el tercer planeta del sistema solar.' },
      { name: 'Marte', texture: marsTexture, distance: 14, size: 0.8, speed: 0.0075, rotationSpeed: 0.008, info: 'Marte es conocido como el planeta rojo.' },
      { name: 'Júpiter', texture: jupiterTexture, distance: 20, size: 2.0, speed: 0.005, rotationSpeed: 0.02, info: 'Júpiter es el planeta más grande del sistema solar.' },
      { name: 'Saturno', texture: saturnTexture, distance: 25, size: 1.8, speed: 0.003, rotationSpeed: 0.02, info: 'Saturno es famoso por sus anillos.' },
      { name: 'Urano', texture: uranusTexture, distance: 30, size: 1.3, speed: 0.002, rotationSpeed: 0.015, info: 'Urano tiene un eje de rotación inclinado.' },
      { name: 'Neptuno', texture: neptuneTexture, distance: 35, size: 1.2, speed: 0.0015, rotationSpeed: 0.01, info: 'Neptuno es el planeta más alejado del Sol.' }
    ];

    // Crear planetas y órbitas con texturas
    const planets = [];
    const orbits = [];
    planetData.forEach((planet) => {
      const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32);
      const planetMaterial = new THREE.MeshBasicMaterial({ map: planet.texture });
      const mesh = new THREE.Mesh(planetGeometry, planetMaterial);
      scene.add(mesh);

      // Crear la órbita con material tenue y tono marrón con resplandor
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, planet.distance, 0, Math.PI * 2).getPoints(100)
      );
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0xA26A42, // Tono marrón
        transparent: true, // Transparencia
        opacity: 0.3 // Mayor difuminado
      });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitLine.rotation.x = Math.PI / 2; // Colocar la órbita en el plano XZ
      scene.add(orbitLine);

      planets.push({ mesh, data: planet, distance: planet.distance, speed: planet.speed, angle: 0, rotationSpeed: planet.rotationSpeed });
      orbits.push({ line: orbitLine, data: planet });
    });

    

    // Crear fondo de estrellas
    const createStars = () => {
      const starGeometry = new THREE.BufferGeometry();
      const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

      const starVertices = [];
      for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
      }

      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
    };

    createStars();

    // Posicionar la cámara
    camera.position.set(0, 40, 40);
    camera.lookAt(0, 0, 0);

    // Animar el sistema solar
    const animate = () => {
      requestAnimationFrame(animate);

      // Actualizar controles
      controls.update();

      // Rotación de los planetas
      planets.forEach((planet) => {
        planet.angle += planet.speed;
        planet.mesh.position.x = planet.distance * Math.cos(planet.angle);
        planet.mesh.position.z = planet.distance * Math.sin(planet.angle);
        planet.mesh.rotation.y += planet.rotationSpeed;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Manejar clics en los planetas o las órbitas
    const handlePlanetClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const planetIntersects = raycaster.intersectObjects(planets.map((planet) => planet.mesh));
      const orbitIntersects = raycaster.intersectObjects(orbits.map((orbit) => orbit.line));

      if (planetIntersects.length > 0) {
        const planetClicked = planets.find((planet) => planet.mesh === planetIntersects[0].object);
        setSelectedPlanet(planetClicked.data); // Mostrar información del planeta seleccionado
      } else if (orbitIntersects.length > 0) {
        const orbitClicked = orbits.find((orbit) => orbit.line === orbitIntersects[0].object);
        setSelectedPlanet(orbitClicked.data); // Mostrar información del planeta de la órbita
      }
    };

    // Agregar el evento de clic
    window.addEventListener('click', handlePlanetClick);

    // Limpiar al desmontar
    return () => {
      window.removeEventListener('click', handlePlanetClick);
      currentMount.removeChild(renderer.domElement);
      controls.dispose();
    };
  }, []);

  return (
    <div>
      <div ref={mountRef}></div>
      {selectedPlanet && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '8px'
        }}>
          <h2>{selectedPlanet.name}</h2>
          <p>{selectedPlanet.info}</p>
          <button onClick={() => setSelectedPlanet(null)}>Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default SolarSystem;
