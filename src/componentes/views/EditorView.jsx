/* src/componentes/views/EditorView.jsx */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css';
import BlotFormatter from 'quill-blot-formatter';
import { suscribirNota } from '../../servicios/notas'; // <--- Importamos la escucha

// --- CONFIGURACIÓN DE QUILL (IGUAL QUE ANTES) ---
try {
    const Quill = ReactQuill.Quill;
    if (Quill && !Quill.imports['modules/blotFormatter']) {
        Quill.register('modules/blotFormatter', BlotFormatter);
        const BaseImage = Quill.import('formats/image');
        const ImageFormatAttributesList = ['alt', 'height', 'width', 'style'];
        class Image extends BaseImage {
            static formats(domNode) {
                return ImageFormatAttributesList.reduce(function(formats, attribute) {
                    if (domNode.hasAttribute(attribute)) {
                        formats[attribute] = domNode.getAttribute(attribute);
                    }
                    return formats;
                }, {});
            }
            format(name, value) {
                if (ImageFormatAttributesList.indexOf(name) > -1) {
                    if (value) { this.domNode.setAttribute(name, value); } else { this.domNode.removeAttribute(name); }
                } else { super.format(name, value); }
            }
        }
        Quill.register(Image, true);
    }
} catch (error) { console.error("Error Quill:", error); }

export default function EditorView({ nota, onGuardar, onVolver, readOnly }) {
  // DATOS
  const [titulo, setTitulo] = useState(nota ? nota.titulo : '');
  const [contenido, setContenido] = useState(nota ? nota.contenido : '');
  const [etiqueta, setEtiqueta] = useState(nota ? nota.etiqueta : 'General');
  const [cover, setCover] = useState(nota?.cover || ""); 
  
  // ESTADOS UI
  const [mostrandoGaleria, setMostrandoGaleria] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [icono] = useState("📝"); 
  
  // ESTADOS DE GUARDADO Y SINCRONIZACIÓN
  const [guardando, setGuardando] = useState(false); // Estado visual "Guardando..."
  const [autoGuardado, setAutoGuardado] = useState(true); // Switch activado por defecto
  const [ultimoGuardado, setUltimoGuardado] = useState("Sin cambios recientes");

  const quillRef = useRef(null);
  
  // Ref para evitar bucles infinitos en la actualización remota
  const isLocalChange = useRef(false);

  // --- 1. EFECTO: ESCUCHAR CAMBIOS REMOTOS (SI OTRO COLABORADOR ESCRIBE) ---
  useEffect(() => {
      // Solo escuchamos si la nota ya existe (tiene ID)
      if (nota?.id) {
          const unsubscribe = suscribirNota(nota.id, (datosActualizados) => {
              // Si el cambio lo hice yo hace un milisegundo, no lo sobreescribo para no saltar el cursor
              if (isLocalChange.current) {
                  isLocalChange.current = false;
                  return;
              }

              // Actualizamos los estados locales con lo que viene de la BD
              if (datosActualizados.titulo !== titulo) setTitulo(datosActualizados.titulo);
              if (datosActualizados.contenido !== contenido) setContenido(datosActualizados.contenido);
              if (datosActualizados.cover !== cover) setCover(datosActualizados.cover);
              if (datosActualizados.etiqueta !== etiqueta) setEtiqueta(datosActualizados.etiqueta);
          });
          return () => unsubscribe();
      }
  }, [nota?.id]);

  // --- 2. EFECTO: AUTO-GUARDADO (DEBOUNCE) ---
  useEffect(() => {
      // Si el autoguardado está apagado, o es una nota nueva sin ID, o es solo lectura, no hacemos nada
      if (!autoGuardado || readOnly || !nota?.id) return;

      // Configuramos un temporizador de 2 segundos
      const timer = setTimeout(async () => {
          setGuardando(true);
          isLocalChange.current = true; // Marcamos que este cambio es nuestro
          await onGuardar(nota.id, titulo, contenido, etiqueta, cover);
          setGuardando(false);
          setUltimoGuardado("Guardado a las " + new Date().toLocaleTimeString());
      }, 2000); // 2000ms = 2 segundos de espera después de dejar de escribir

      // Si el usuario sigue escribiendo antes de los 2 seg, cancelamos el timer anterior
      return () => clearTimeout(timer);
  }, [titulo, contenido, etiqueta, cover, autoGuardado]); // Se ejecuta cada vez que cambia algo de esto

  // --- GUARDADO MANUAL ---
  const handleSubmit = async () => {
    if (!titulo) return alert("El título es obligatorio");
    setGuardando(true);
    isLocalChange.current = true;
    await onGuardar(nota?.id, titulo, contenido, etiqueta, cover); 
    setGuardando(false);
    setUltimoGuardado("Guardado manualmente");
  };

  const imageHandler = () => {
    const url = prompt("Pegar URL de la imagen (https://...):");
    if (url && quillRef.current) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, 'image', url);
    }
  };

  const modules = useMemo(() => {
    if (readOnly) return { toolbar: false, blotFormatter: {} };
    return {
        blotFormatter: { overlay: { style: { border: '2px solid #22c55e' } } },
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                [{'list': 'ordered'}, {'list': 'bullet'}, {'list': 'check'}],
                ['link', 'image', 'video'], 
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['clean']
            ],
            handlers: { image: imageHandler }
        }
    };
  }, [readOnly]);

  const buscarImagenes = (e) => {
      e.preventDefault(); if(!terminoBusqueda) return;
      setBuscando(true);
      const nuevasImagenes = Array.from({ length: 12 }).map((_, i) => `https://loremflickr.com/1200/400/${encodeURIComponent(terminoBusqueda)}?lock=${i + 1}`);
      setTimeout(() => { setResultadosBusqueda(nuevasImagenes); setBuscando(false); }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] animate-fadeIn relative">
      
      {/* BARRA SUPERIOR */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 text-sm text-gray-400">
           <button onClick={onVolver} className="hover:bg-white/10 p-1 rounded transition-colors text-white">⬅ Volver</button>
           <span className="text-gray-600">/</span><span className="text-gray-500">{etiqueta}</span><span className="text-gray-600">/</span>
           <span className="text-white font-medium truncate max-w-[200px]">{titulo || "Sin Título"}</span>
        </div>
        
        <div className="flex items-center gap-4">
             {/* INDICADOR DE ESTADO */}
             <div className="text-right">
                <span className={`text-xs block font-bold ${guardando ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {guardando ? "Guardando..." : "Guardado"}
                </span>
                <span className="text-[10px] text-gray-600 block">{ultimoGuardado}</span>
             </div>

             {/* SWITCH AUTOGUARDADO (Solo si no es readOnly y ya existe la nota) */}
             {!readOnly && nota?.id && (
                 <div className="flex items-center gap-2" title="Autoguardado">
                     <div 
                        onClick={() => setAutoGuardado(!autoGuardado)}
                        className={`w-8 h-4 rounded-full cursor-pointer relative transition-colors ${autoGuardado ? 'bg-green-600' : 'bg-gray-700'}`}
                     >
                         <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${autoGuardado ? 'left-4.5' : 'left-0.5'}`}></div>
                     </div>
                 </div>
             )}

             {!readOnly && (
                 <button onClick={handleSubmit} className="text-sm bg-green-600 hover:bg-green-500 text-black font-bold px-4 py-1 rounded transition-all">
                     {guardando ? '...' : 'Guardar'}
                 </button>
             )}
        </div>
      </div>

      {/* ÁREA SCROLLEABLE */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {cover && (
            <div className="group relative h-48 w-full overflow-hidden bg-gray-900">
                <img src={cover} alt="Cover" className="w-full h-full object-cover opacity-90" />
                {!readOnly && (
                    <div className="absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button onClick={() => { setTerminoBusqueda(""); setResultadosBusqueda([]); setMostrandoGaleria(true); }} className="bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded border border-white/10">Cambiar</button>
                        <button onClick={() => setCover("")} className="bg-black/60 backdrop-blur-md text-red-400 text-xs px-3 py-1 rounded border border-white/10">Quitar</button>
                    </div>
                )}
            </div>
        )}

        <div className="w-full max-w-4xl mx-auto px-8 py-12 flex flex-col min-h-screen">
            {!cover && !readOnly && (
                <div className="flex gap-4 mb-6 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => { setTerminoBusqueda(""); setResultadosBusqueda([]); setMostrandoGaleria(true); }} className="text-gray-500 hover:text-white text-xs flex items-center gap-1 group"><span className="group-hover:scale-110 transition-transform">🖼️</span> Agregar Portada</button>
                    <button className="text-gray-500 hover:text-white text-xs flex items-center gap-1 group"><span className="group-hover:scale-110 transition-transform">😊</span> Agregar Icono</button>
                </div>
            )}

            <div className="text-6xl mb-4 select-none">{icono}</div>
            
            {readOnly ? (
                <h1 className="text-5xl font-bold text-white mb-6 leading-tight border-b border-transparent">{titulo}</h1>
            ) : (
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="bg-transparent text-5xl font-bold text-white focus:outline-none w-full placeholder-gray-600 mb-6 leading-tight" placeholder="Sin título" />
            )}

            <div className="flex items-center gap-6 mb-8 text-gray-500 text-sm border-b border-white/5 pb-4 font-mono">
                <div className="flex items-center gap-2"><span>📅 Creado:</span><span className="text-gray-300">Hoy</span></div>
                <div className="flex items-center gap-2">
                    <span>🏷️ Etiqueta:</span>
                    {readOnly ? (
                        <span className="text-green-400">{etiqueta}</span>
                    ) : (
                        <select value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} className="bg-transparent text-green-400 focus:outline-none cursor-pointer hover:underline appearance-none">
                            <option value="General">General</option><option value="React">React</option><option value="JS">Javascript</option><option value="Python">Python</option><option value="Git">Git</option>
                        </select>
                    )}
                </div>
            </div>

            <div className="flex-1 notion-editor-container pb-20">
                <ReactQuill 
                    ref={quillRef} 
                    theme={readOnly ? "bubble" : "snow"} 
                    value={contenido} 
                    onChange={setContenido} 
                    modules={modules} 
                    readOnly={readOnly}
                    placeholder='Escribe algo...' 
                />
            </div>
        </div>
      </div>

      {mostrandoGaleria && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMostrandoGaleria(false)}></div>
              <div className="relative bg-[#111] border border-gray-700 w-full max-w-3xl rounded-xl shadow-2xl p-0 animate-slideUp overflow-hidden max-h-[85vh] flex flex-col">
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between"><h3 className="text-white font-bold text-lg">Buscar Imagen de Portada</h3><button onClick={() => setMostrandoGaleria(false)} className="text-gray-400 hover:text-white">✕</button></div>
                  <div className="p-4 bg-[#0a0a0a]"><form onSubmit={buscarImagenes} className="relative"><span className="absolute left-3 top-2.5 text-gray-500">🔍</span><input type="text" autoFocus placeholder="Escribe un tema..." className="w-full bg-[#1a1a1a] border border-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:border-green-500 outline-none" value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} /><button type="submit" disabled={!terminoBusqueda} className="absolute right-2 top-1.5 bg-green-600 hover:bg-green-500 text-black font-bold text-xs px-3 py-1.5 rounded disabled:opacity-50">Buscar</button></form></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#0f0f0f] min-h-[200px]">
                      {!buscando && resultadosBusqueda.length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60"><span className="text-4xl mb-2">🖼️</span><p>Busca arriba o pega URL abajo</p></div>}
                      {buscando && <div className="h-full flex flex-col items-center justify-center text-green-500"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div><p>Buscando...</p></div>}
                      {!buscando && resultadosBusqueda.length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{resultadosBusqueda.map((url, i) => (<div key={i} onClick={() => {setCover(url); setMostrandoGaleria(false);}} className="group relative h-28 rounded-lg cursor-pointer overflow-hidden border border-transparent hover:border-green-500 transition-all hover:scale-105"><img src={url} alt="Result" className="w-full h-full object-cover" loading="lazy" /></div>))}</div>}
                  </div>
                  <div className="p-4 border-t border-gray-800 bg-[#151515]"><p className="text-xs text-gray-500 mb-2 font-bold uppercase">O pega un enlace directo:</p><input type="text" placeholder="https://..." className="w-full bg-[#050505] border border-gray-700 text-white px-3 py-2 rounded text-sm focus:border-green-500 outline-none font-mono" onKeyDown={(e) => { if(e.key === 'Enter') { setCover(e.target.value); setMostrandoGaleria(false); } }} /></div>
              </div>
          </div>
      )}

      <style>{`
        .notion-editor-container .ql-toolbar.ql-snow { border: none !important; position: sticky; top: 0; z-index: 10; background: #050505; border-bottom: 1px solid rgba(255,255,255,0.1) !important; padding: 10px 0; opacity: 0.3; transition: opacity 0.3s; }
        .notion-editor-container:hover .ql-toolbar.ql-snow { opacity: 1; }
        .notion-editor-container .ql-container.ql-snow { border: none !important; font-family: 'Inter', sans-serif; font-size: 17px; line-height: 1.8; }
        .ql-editor { padding: 0 !important; color: #d4d4d4; min-height: 400px; }
        .ql-editor h1 { font-size: 2.2em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: white; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .ql-editor h2 { font-size: 1.8em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; color: #e5e5e5; }
        .ql-editor img { display: inline-block; cursor: pointer; } 
        div[style*="border: 2px solid rgb(34, 197, 94)"] { z-index: 50; }
      `}</style>
    </div>
  );
}