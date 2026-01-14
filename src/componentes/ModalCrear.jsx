/* src/componentes/ModalCrear.jsx */
import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // Los estilos del editor

export default function ModalCrear({ onClose, onGuardar, notaAEditar }) {
  // Si viene "notaAEditar", usamos sus datos. Si no, empezamos vacíos.
  const [titulo, setTitulo] = useState(notaAEditar ? notaAEditar.titulo : '');
  const [contenido, setContenido] = useState(notaAEditar ? notaAEditar.contenido : '');
  const [etiqueta, setEtiqueta] = useState(notaAEditar ? notaAEditar.etiqueta : 'General');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo || !contenido) return;

    setGuardando(true);
    // Enviamos el ID también (si existe) para saber que es una edición
    await onGuardar(notaAEditar?.id, titulo, contenido, etiqueta);
    setGuardando(false);
    onClose();
  };

  // Configuración de la barra de herramientas del editor (El "Word")
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'code-block'],
      ['clean']
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-green-500/30 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.1)] p-6 animate-fadeIn flex flex-col max-h-[90vh]">
        
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-green-500">_</span> 
          {notaAEditar ? 'EDITAR_ENTRADA' : 'NUEVA_ENTRADA'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col overflow-hidden">
          
          {/* Título */}
          <input 
            type="text" 
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white focus:border-green-500 focus:outline-none font-bold text-lg"
            placeholder="Título del Documento"
            autoFocus
          />

          {/* Etiquetas */}
          <div className="flex gap-2 flex-wrap">
            {['General', 'React', 'JS', 'Python', 'Git', 'Base de Datos'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setEtiqueta(tag)}
                className={`px-3 py-1 text-xs rounded border transition-all ${etiqueta === tag ? 'bg-green-500 text-black border-green-500 font-bold' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* EDITOR TIPO WORD (React Quill) */}
          <div className="flex-1 overflow-y-auto bg-white rounded text-black editor-container">
            <ReactQuill 
              theme="snow"
              value={contenido}
              onChange={setContenido}
              modules={modules}
              className="h-full"
              placeholder="Escribe aquí como si fuera Word..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={guardando}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-black font-bold rounded transition-all disabled:opacity-50"
            >
              {guardando ? 'PROCESANDO...' : 'GUARDAR CAMBIOS 💾'}
            </button>
          </div>

        </form>
      </div>

      {/* Un poco de CSS extra para ajustar el editor oscuro/claro */}
      <style>{`
        .editor-container .ql-container { height: 85%; font-size: 16px; }
        .editor-container .ql-toolbar { background: #f3f4f6; border-bottom: 1px solid #ccc; }
      `}</style>
    </div>
  );
}