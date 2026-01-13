/* src/App.jsx */
import React, { useState } from 'react';
import WelcomeScene from './componentes/WelcomeScene.jsx';
// Importamos las funciones de Firebase que creamos
import { auth, googleProvider, signInWithPopup, signOut } from './firebase';

// --- PANTALLA: MENSAJE DE "EN CONSTRUCCIÓN" ---
function ConstructionMessage({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Fondo decorativo sutil */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_#22c55e10_0%,_transparent_70%)]"></div>

      {/* Tarjeta de Confirmación */}
      <div className="bg-gray-900/80 backdrop-blur-md border border-green-500/30 p-8 rounded-2xl max-w-lg w-full text-center shadow-[0_0_50px_rgba(34,197,94,0.1)] z-10">
        
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
           <span className="text-3xl">🏗️</span>
        </div>

        <h2 className="text-3xl font-bold text-green-400 mb-2" style={{ fontFamily: '"Courier New", monospace' }}>
          ACCESO REGISTRADO
        </h2>
        
        <p className="text-gray-300 mb-6">
          Hola <span className="text-white font-bold">{user.displayName}</span>, hemos detectado tu interés en <strong className="text-green-400">NOTEMV</strong>.
        </p>

        <div className="bg-black/50 p-4 rounded-lg border border-gray-700 mb-6 text-left">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estado del Sistema:</p>
          <p className="text-yellow-400 font-mono text-sm">⚠ NOTEMV (En Construcción)</p>
          
          <div className="h-px w-full bg-gray-800 my-3"></div>
          
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notificación programada a:</p>
          <p className="text-green-300 font-mono text-sm break-all">{user.email}</p>
        </div>

        <p className="text-sm text-gray-400 mb-8">
          Nuestros ingenieros están trabajando en el núcleo. Recibirás un correo prioritario en cuanto el sistema esté 100% operativo.
        </p>

        <button 
          onClick={onLogout}
          className="text-gray-500 hover:text-white text-sm underline transition-colors"
        >
          Cerrar sesión / Volver al inicio
        </button>
      </div>

    </div>
  );
}

// --- APP PRINCIPAL ---
function App() {
  const [user, setUser] = useState(null); // Guardamos los datos del usuario logueado
  const [loading, setLoading] = useState(false);

  // Función que se ejecuta al dar click en "INITIALIZE_SESSION"
  const handleLogin = async () => {
    setLoading(true);
    try {
      // 1. Abrimos el popup de Google
      const result = await signInWithPopup(auth, googleProvider);
      // 2. Si sale bien, guardamos al usuario
      setUser(result.user);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Error de conexión con el núcleo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <>
      {/* SI TENEMOS USUARIO --> Muestra mensaje de "Trabajando en ello" */}
      {user ? (
        <ConstructionMessage user={user} onLogout={handleLogout} />
      ) : (
        /* SI NO --> Muestra la escena 3D */
        <WelcomeScene onEnter={handleLogin} />
      )}
      
      {/* Overlay de carga simple mientras abre Google */}
      {loading && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <p className="text-green-500 font-mono animate-pulse">ESTABLECIENDO ENLACE SEGURO...</p>
        </div>
      )}
    </>
  );
}

export default App;