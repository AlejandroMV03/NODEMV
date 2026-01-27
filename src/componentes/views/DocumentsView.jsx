import React, { useState, useEffect } from 'react';

export default function DocumentsView({ adjuntos = [], onUpdateAdjuntos, readOnly }) {
  // Estado para el modal de "Agregar Nuevo"
  const [isModalOpen, setModalOpen] = useState(false);
  const [nuevoLink, setNuevoLink] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  
  // Estado para el visor de documentos
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  // --- LÓGICA PARA AGREGAR ---
  const handleAgregar = (e) => {
    e.preventDefault();
    if (!nuevoLink || !nuevoNombre) return;

    // Detectar tipo para el icono
    let tipo = "link";
    const urlLower = nuevoLink.toLowerCase();
    if (urlLower.includes('pdf')) tipo = "pdf";
    if (urlLower.includes('doc') || urlLower.includes('drive.google') || urlLower.includes('docs.google')) tipo = "word";
    if (urlLower.match(/\.(jpeg|jpg|gif|png)/)) tipo = "image";

    const nuevoDoc = {
      nombre: nuevoNombre,
      url: nuevoLink,
      tipo: tipo,
      fecha: new Date().toISOString()
    };

    // Actualizamos la lista llamando a la función del padre
    const nuevaLista = [...adjuntos, nuevoDoc];
    onUpdateAdjuntos(nuevaLista);
    
    // Limpieza
    setNuevoLink('');
    setNuevoNombre('');
    setModalOpen(false);
  };

  // --- LÓGICA PARA ELIMINAR ---
  const handleEliminar = (index) => {
    if (!confirm("¿Seguro que quieres quitar este documento?")) return;
    const nuevaLista = [...adjuntos];
    nuevaLista.splice(index, 1);
    onUpdateAdjuntos(nuevaLista);
  };

  // --- ICONOS SEGÚN TIPO ---
  const getIcono = (tipo) => {
    switch (tipo) {
      case 'pdf': return '🟥'; // O un icono SVG de PDF
      case 'word': return '🟦'; // O un icono SVG de Word
      case 'image': return '🖼️';
      default: return '🔗';
    }
  };

  return (
    <div className="flex-1 bg-[#050505] p-8 min-h-screen text-white animate-fadeIn">
      
      {/* CABECERA */}
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Documentación</h2>
          <p className="text-sm text-gray-500 font-mono">Recursos y archivos del proyecto</p>
        </div>
        {!readOnly && (
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-green-600 hover:bg-green-500 text-black font-bold px-4 py-2 rounded flex items-center gap-2 transition-all"
          >
            <span>+</span> Nuevo Documento
          </button>
        )}
      </div>

      {/* GRID DE DOCUMENTOS */}
      {adjuntos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-xl text-gray-500">
          <span className="text-4xl mb-4">📂</span>
          <p>No hay documentos adjuntos todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adjuntos.map((doc, i) => (
            <div key={i} className="group bg-[#111] border border-white/5 hover:border-green-500/50 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-green-900/10 flex flex-col justify-between">
              
              {/* Parte Superior: Icono y Nombre */}
              <div className="flex items-start gap-4 mb-4 cursor-pointer" onClick={() => setArchivoSeleccionado(doc)}>
                <div className="text-4xl bg-[#1a1a1a] w-16 h-16 flex items-center justify-center rounded-lg">
                  {getIcono(doc.tipo)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-gray-200 truncate" title={doc.nombre}>{doc.nombre}</h3>
                  <span className="text-xs text-gray-500 font-mono block mt-1">{new Date(doc.fecha).toLocaleDateString()}</span>
                  <span className="text-[10px] text-green-500 bg-green-900/20 px-1.5 py-0.5 rounded mt-2 inline-block">
                    {doc.tipo.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                <button 
                  onClick={() => setArchivoSeleccionado(doc)}
                  className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded transition-colors"
                >
                  👁️ Ver
                </button>
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1.5 rounded transition-colors"
                >
                  🔗 Abrir
                </a>
                {!readOnly && (
                  <button 
                    onClick={() => handleEliminar(i)}
                    className="text-xs bg-red-600/10 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded transition-colors"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL PARA AGREGAR LINK --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151515] border border-white/10 w-full max-w-md rounded-xl p-6 shadow-2xl animate-scaleIn">
            <h3 className="text-xl font-bold text-white mb-4">Agregar Documento</h3>
            
            <form onSubmit={handleAgregar} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase font-bold">Nombre del archivo</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Ej: Especificación de Requisitos.pdf" 
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded p-3 text-white focus:border-green-500 outline-none"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase font-bold">Enlace (Drive, Dropbox, URL)</label>
                <input 
                  type="text" 
                  placeholder="https://..." 
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded p-3 text-white focus:border-green-500 outline-none font-mono text-sm"
                  value={nuevoLink}
                  onChange={(e) => setNuevoLink(e.target.value)}
                />
                <p className="text-[10px] text-gray-600 mt-2">ℹ️ Pega el enlace público de Google Drive o de tu archivo online.</p>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-black font-bold py-2 rounded transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VISOR DE DOCUMENTOS (GOOGLE VIEWER) --- */}
      {archivoSeleccionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-6xl h-[90vh] bg-[#111] border border-white/10 rounded-xl flex flex-col overflow-hidden relative shadow-2xl">
            {/* Header del Visor */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#151515]">
              <div className="flex items-center gap-3 text-white font-medium">
                <span className="text-2xl">{getIcono(archivoSeleccionado.tipo)}</span>
                <span>{archivoSeleccionado.nombre}</span>
              </div>
              <button 
                onClick={() => setArchivoSeleccionado(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >✕</button>
            </div>
            
            {/* Iframe Viewer */}
            <div className="flex-1 bg-[#1a1a1a] relative">
               {archivoSeleccionado.tipo === 'image' ? (
                  <div className="w-full h-full flex items-center justify-center p-10">
                      <img src={archivoSeleccionado.url} className="max-w-full max-h-full object-contain shadow-2xl rounded" alt="" />
                  </div>
               ) : (
                  <iframe 
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(archivoSeleccionado.url)}&embedded=true`} 
                    className="w-full h-full border-none"
                    title="Visor"
                  ></iframe>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}