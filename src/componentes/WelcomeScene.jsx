/* src/componentes/WelcomeScene.jsx */
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Stars, Float, ContactShadows, Loader, OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

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
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.02, 16, 100]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} toneMapped={false} />
      </mesh>
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
  const { scale } = useSpring({
    scale: show ? 1 : 0,
    delay: 500,
    config: { tension: 120, friction: 14 }
  });

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <animated.group scale={scale}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.5, 0]} />
          <MeshDistortMaterial color="#00ff00" envMapIntensity={0.4} clearcoat={1} clearcoatRoughness={0} metalness={0.9} roughness={0.1} distort={0.3} speed={1.5} />
        </mesh>
        <mesh scale={[1.1, 1.1, 1.1]}>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial color="white" wireframe transparent opacity={0.3} />
        </mesh>
        <DataRings />
      </Float>
    </animated.group>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function WelcomeScene({ onEnter }) {
  const [startAnimation, setStartAnimation] = useState(false);
  const [mostrarAlerta, setMostrarAlerta] = useState(false); // Estado para el modal

  useEffect(() => {
    setTimeout(() => setStartAnimation(true), 200);
  }, []);

  // --- LÓGICA DEL BOTÓN CONTINUAR ---
  const handleContinuar = () => {
    // Verificamos si el usuario ya aceptó el disclaimer antes
    const yaVisto = localStorage.getItem('disclaimer_notemv_visto');
    
    if (yaVisto) {
        // Si ya lo vio, entra directo
        onEnter();
    } else {
        // Si es la primera vez, mostramos la alerta
        setMostrarAlerta(true);
    }
  };

  // --- LÓGICA DE ACEPTAR TERMINOS ---
  const aceptarTerminos = () => {
      // Guardamos en el navegador que ya aceptó
      localStorage.setItem('disclaimer_notemv_visto', 'true');
      setMostrarAlerta(false);
      onEnter(); // Entramos al sistema
  };

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      
      <Canvas shadows gl={{ antialias: true }}>
        <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 10, 25]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[-5, -5, 5]} intensity={10} color="#22c55e" />
            <pointLight position={[5, 5, 5]} intensity={10} color="#0ea5e9" />
            <Environment preset="city" />
            <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={1.5} />
            <CyberCore show={startAnimation} />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            <ContactShadows position={[0, -3.5, 0]} opacity={0.5} scale={10} blur={2.5} far={4} color="#22c55e" />
        </Suspense>
      </Canvas>
      
      <Loader />

      {/* --- UI / INTERFAZ --- */}
      <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none z-10">
        <div className={`flex flex-col items-center transition-all duration-1000 transform ${startAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_35px_rgba(0,255,0,0.3)]" style={{ fontFamily: '"Courier New", monospace', letterSpacing: '-5px' }}>
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
            onClick={handleContinuar}
            className={`group relative px-10 py-4 bg-transparent overflow-hidden border border-green-500/50 hover:border-green-400 transition-all duration-500 transform ${startAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 delay-500'}`}
          >
             <div className="absolute inset-0 w-full h-full bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="relative z-10 text-white font-mono text-lg tracking-widest group-hover:text-green-100">CONTINUAR</span>
             </div>
          </button>
      </div>

      {/* --- MODAL ALERTA TIPO TERMINAL (FLOTANTE) --- */}
      {mostrarAlerta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="w-full max-w-2xl bg-black border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.4)] relative p-1 transform transition-all scale-100">
                  
                  {/* Header de la Terminal */}
                  <div className="bg-red-900/30 border-b border-red-600/50 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <span className="text-red-500 text-xs font-mono animate-pulse">● REC</span>
                          <span className="text-red-400 text-xs font-mono tracking-widest">SYSTEM_WARNING.exe</span>
                      </div>
                      <div className="text-red-500 text-xs font-mono">v1.0.0-beta</div>
                  </div>

                  {/* Contenido */}
                  <div className="p-8 font-mono text-sm md:text-base leading-relaxed">
                      <h2 className="text-2xl font-bold text-red-500 mb-6 tracking-wider glitch-text">⚠️ ADVERTENCIA DE DESARROLLO</h2>
                      
                      <p className="text-gray-300 mb-4">
                          <strong className="text-white">NOTEMV</strong> se encuentra actualmente en <span className="text-yellow-400">FASE BETA/DESARROLLO</span>.
                      </p>
                      
                      <div className="border-l-2 border-yellow-500 pl-4 my-6 italic text-yellow-200/80">
                          "Te recomendamos no añadir archivos personales críticos por el momento. El sistema está en constantes modificaciones de arquitectura."
                      </div>

                      <p className="text-gray-400 mb-6">
                          Existe la posibilidad de reinicio de base de datos o pérdida de información durante las actualizaciones. Al continuar, aceptas que el equipo de desarrollo <strong className="text-red-400">no se hace responsable</strong> por la pérdida de datos ingresados durante esta etapa.
                      </p>

                      <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-red-900/30">
                          {/* Botón ACEPTAR */}
                          <button 
                              onClick={aceptarTerminos}
                              className="bg-red-600 hover:bg-red-500 text-black font-bold py-3 px-8 text-sm uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                          >
                              [ ACEPTAR RIESGO Y CONTINUAR ]
                          </button>
                      </div>
                  </div>

                  {/* Decoración de esquinas */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>
              </div>
          </div>
      )}

    </div>
  );
}