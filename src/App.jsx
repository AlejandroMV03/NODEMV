/* src/App.jsx */
import React, { useState } from 'react';
import WelcomeScene from './componentes/WelcomeScene.jsx';
// 1. IMPORTAMOS EL NUEVO DISEÑO (Asegúrate de haber creado el archivo DashboardLayout.jsx)
import DashboardLayout from './componentes/DashboardLayout.jsx'; 
import { auth, googleProvider, signInWithPopup, signOut } from './firebase';

// --- APP PRINCIPAL ---
function App() {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(false);

  // Login con Google
  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <>
      {/* LÓGICA DEL SISTEMA: */}
      
      {/* CASO A: SI YA INICIÓ SESIÓN --> Muestra el Dashboard Hacker */}
      {user ? (
        <DashboardLayout user={user} onLogout={handleLogout} />
      ) : (
        /* CASO B: SI NO HA ENTRADO --> Muestra el Núcleo 3D */
        <WelcomeScene onEnter={handleLogin} />
      )}
      
      {/* Pantalla de carga (Overlay) */}
      {loading && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <p className="text-green-500 font-mono animate-pulse">ESTABLECIENDO ENLACE SEGURO...</p>
        </div>
      )}
    </>
  );
}

export default App;