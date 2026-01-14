/* src/componentes/DashboardLayout.jsx */
import React, { useState } from 'react';
import { crearNota, actualizarNota } from '../servicios/notas'; 

// --- IMPORTAMOS LAS VISTAS ---
import DashboardHome from './views/DashboardHome';
import ProjectsView from './views/ProjectsView';
import SnippetsView from './views/SnippetsView';
import EditorView from './views/EditorView';
import TrashView from './views/TrashView'; // <--- 1. IMPORTAMOS LA NUEVA VISTA

// Iconos
const TerminalIcon = () => <span>_</span>;
const FolderIcon = () => <span>📁</span>;
const CodeIcon = () => <span>📝</span>;
const TrashIcon = () => <span>🗑️</span>; // <--- ICONO PAPELERA

export default function DashboardLayout({ user, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [notaActiva, setNotaActiva] = useState(null);

  const handleAbrirEditor = (nota = null) => {
    setNotaActiva(nota); 
    setCurrentView('editor'); 
  };

  const handleGuardarDesdeEditor = async (id, titulo, contenido, etiqueta, cover) => { // <--- Agregamos 'cover' aquí
    let exito = false;
    if (id) {
        // Al editar
        exito = await actualizarNota(id, titulo, contenido, etiqueta, cover);
    } else {
        // Al crear (userId, titulo, contenido, etiqueta, proyectoId=null, carpetaId=null, cover)
        exito = await crearNota(user.uid, titulo, contenido, etiqueta, null, null, cover);
    }

    if (exito) {
        setCurrentView('dashboard'); 
        setNotaActiva(null);
    } else {
        alert("Error al guardar (Revisa si la imagen es muy pesada)");
    }
};

  const renderContent = () => {
      switch(currentView) {
          case 'dashboard': return <DashboardHome user={user} onEdit={handleAbrirEditor} />;
          case 'editor': return <EditorView nota={notaActiva} onGuardar={handleGuardarDesdeEditor} onVolver={() => setCurrentView('dashboard')} />;
          case 'projects': return <ProjectsView user={user} />;
          case 'snippets': return <SnippetsView />;
          case 'trash': return <TrashView user={user} />; // <--- 2. RUTA DE PAPELERA
          default: return <DashboardHome user={user} onEdit={handleAbrirEditor} />;
      }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-gray-300 font-mono overflow-hidden">
      
      {/* SIDEBAR */}
      {currentView !== 'editor' && (
        <aside className="w-64 bg-[#0a0a0a] border-r border-green-500/20 flex flex-col p-4">
            <div className="mb-8 flex items-center gap-2 text-green-400 font-bold tracking-widest">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> NOTEMV_OS
            </div>

            <nav className="flex-1 space-y-2">
            <div onClick={() => setCurrentView('dashboard')} className={`px-4 py-2 cursor-pointer flex items-center gap-3 transition-colors ${currentView === 'dashboard' ? 'bg-green-500/10 text-green-400 border-l-2 border-green-500' : 'hover:bg-white/5'}`}><TerminalIcon /> Dashboard</div>
            <div onClick={() => setCurrentView('projects')} className={`px-4 py-2 cursor-pointer flex items-center gap-3 transition-colors ${currentView === 'projects' ? 'bg-purple-500/10 text-purple-400 border-l-2 border-purple-500' : 'hover:bg-white/5'}`}><FolderIcon /> Mis Proyectos</div>
            <div onClick={() => setCurrentView('snippets')} className={`px-4 py-2 cursor-pointer flex items-center gap-3 transition-colors ${currentView === 'snippets' ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500' : 'hover:bg-white/5'}`}><CodeIcon /> Snippets</div>
            
            {/* 3. BOTÓN PAPELERA */}
            <div onClick={() => setCurrentView('trash')} className={`mt-8 px-4 py-2 cursor-pointer flex items-center gap-3 transition-colors text-red-400 hover:text-red-300 ${currentView === 'trash' ? 'bg-red-900/20 border-l-2 border-red-500' : 'hover:bg-white/5'}`}>
                <TrashIcon /> Papelera
            </div>
            </nav>

            <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-4">
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-green-500/50" />
                <div className="text-xs"><p className="text-white font-bold">{user.displayName}</p><p className="text-gray-500">Dev_Admin</p></div>
            </div>
            <button onClick={onLogout} className="w-full py-1 text-xs text-red-400 hover:text-red-300 border border-red-900/30 hover:bg-red-900/20 rounded transition-all">[ DISCONNECT ]</button>
            </div>
        </aside>
      )}

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col relative transition-all duration-300">
        {currentView !== 'editor' && <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>}
        {currentView !== 'editor' && (
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#050505]/50 backdrop-blur-sm z-10">
            <h2 className="text-xl text-white"><span className="text-green-500">root</span><span className="text-gray-600">/</span>{currentView}</h2>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded border border-white/10 text-sm text-gray-500 min-w-[300px]"><span>🔍</span> <span>Buscar...</span></div>
            </header>
        )}
        <div className={`flex-1 overflow-y-auto z-0 ${currentView === 'editor' ? 'p-0' : 'p-8'}`}>{renderContent()}</div>
      </main>
    </div>
  );
}