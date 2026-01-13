/* src/componentes/WelcomeScene.jsx */
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Stars, Float, ContactShadows, Loader, OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';

// --- COMPONENTE: Anillos de Datos (Networking) ---
function DataRings() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={ref}>
      {/* Anillo Exterior */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.02, 16, 100]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* Anillo Medio */}
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.8, 0.05, 16, 100]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
    </group>
  );
}

// --- COMPONENTE: El Núcleo del Procesador (CPU Core) ---
function CyberCore({ show }) {
  const meshRef = useRef();
  
  // Animación de entrada: Emerge girando y escalando
  const { scale } = useSpring({
    scale: show ? 1 : 0,
    delay: 500,
    config: { tension: 120, friction: 14 }
  });

  useFrame((state) => {
    if (meshRef.current) {
      // Rotación constante
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <animated.group scale={scale}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        
        {/* NÚCLEO SOLIDO (Distorsionado como energía) */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.5, 0]} /> {/* Forma geométrica de 20 caras */}
          <MeshDistortMaterial 
            color="#00ff00" 
            envMapIntensity={0.4} 
            clearcoat={1} 
            clearcoatRoughness={0} 
            metalness={0.9} 
            roughness={0.1}
            distort={0.3} // Se mueve como líquido/energía
            speed={1.5}
          />
        </mesh>

        {/* ESTRUCTURA WIREFRAME (La "Ingeniería" detrás) */}
        <mesh scale={[1.1, 1.1, 1.1]}>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial color="white" wireframe transparent opacity={0.3} />
        </mesh>

        {/* ANILLOS GIRATORIOS */}
        <DataRings />

      </Float>
    </animated.group>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function WelcomeScene({ onEnter }) {
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    setTimeout(() => setStartAnimation(true), 200);
  }, []);

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      
      <Canvas shadows gl={{ antialias: true }}>
        <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 10, 25]} />

            {/* ILUMINACIÓN DIGITAL */}
            <ambientLight intensity={0.5} />
            {/* Luz verde desde abajo (estilo Hacker) */}
            <pointLight position={[-5, -5, 5]} intensity={10} color="#22c55e" />
            {/* Luz azul desde arriba (estilo Servidor) */}
            <pointLight position={[5, 5, 5]} intensity={10} color="#0ea5e9" />
            
            <Environment preset="city" />
            
            {/* FONDO DE DATOS (Estrellas verdes/azules) */}
            <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={1.5} />

            {/* OBJETO PRINCIPAL */}
            <CyberCore show={startAnimation} />

            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            
            {/* Reflejo sutil abajo */}
            <ContactShadows position={[0, -3.5, 0]} opacity={0.5} scale={10} blur={2.5} far={4} color="#22c55e" />
        </Suspense>
      </Canvas>
      
      <Loader />

      {/* --- UI / INTERFAZ --- */}
      <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none z-10">
        
        {/* TÍTULO EN EL CENTRO (Sobrepuesto al núcleo con mezcla de capas) */}
        <div className={`flex flex-col items-center transition-all duration-1000 transform ${startAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <h1 
                className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_35px_rgba(0,255,0,0.3)]"
                style={{ fontFamily: '"Courier New", monospace', letterSpacing: '-5px' }}
            >
            NOTEMV
            </h1>
            <div className="h-1 w-32 bg-green-500 my-4 rounded-full shadow-[0_0_15px_#22c55e]"></div>
            <p className="text-green-400 font-bold text-xl tracking-[0.5em] uppercase text-shadow-glow">
                ALEDEV
            </p>
        </div>
      </div>

      {/* BOTÓN (Abajo) */}
      <div className="absolute bottom-16 left-0 w-full flex justify-center z-20">
          <button 
            onClick={onEnter}
            className={`group relative px-10 py-4 bg-transparent overflow-hidden border border-green-500/50 hover:border-green-400 transition-all duration-500 transform ${startAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 delay-500'}`}
          >
             {/* Fondo hover estilo Matrix */}
             <div className="absolute inset-0 w-full h-full bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
             
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="relative z-10 text-white font-mono text-lg tracking-widest group-hover:text-green-100">
                CONTINUAR
                </span>
                <span className="text-xl"></span>
             </div>
          </button>
      </div>

    </div>
  );
}