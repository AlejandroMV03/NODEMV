/* src/componentes/views/EditorView.jsx */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css';
import { useReactToPrint } from 'react-to-print';
import { suscribirNota, registrarPresencia, retirarPresencia, suscribirPresencia } from '../../servicios/notas';
import { guardarVersion } from '../../servicios/historial'; 
import TimeMachine from '../TimeMachine';
import BlotFormatter from 'quill-blot-formatter';

// --- CONFIGURACIÓN GLOBAL ---
let blotFormatterRegistrado = false;
try {
    const Quill = ReactQuill.Quill;
    if (Quill) {
        try {
            if (!Quill.imports['modules/blotFormatter']) {
                Quill.register('modules/blotFormatter', BlotFormatter);
            }
            blotFormatterRegistrado = true;
        } catch (e) { console.warn("⚠️ Error BlotFormatter:", e); }

        const BaseImage = Quill.import('formats/image');
        class Image extends BaseImage {
            static formats(domNode) { return { ...super.formats(domNode), style: domNode.getAttribute('style') }; }
            format(name, value) { if (name === 'style') this.domNode.setAttribute('style', value); else super.format(name, value); }
        }
        Quill.register(Image, true);
    }
} catch (error) { console.error("Error Quill:", error); }

export default function EditorView({ user, nota, onGuardar, onVolver, readOnly }) {
  const [titulo, setTitulo] = useState(nota ? nota.titulo : '');
  const [contenido, setContenido] = useState(nota ? nota.contenido : '');
  const [etiqueta, setEtiqueta] = useState(nota ? nota.etiqueta : 'General');
  
  // UI
  const [mostrandoGaleria, setMostrandoGaleria] = useState(false);
  const [mostrandoTimeMachine, setMostrandoTimeMachine] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [autoGuardado, setAutoGuardado] = useState(true);
  const [ultimoGuardado, setUltimoGuardado] = useState("Sin cambios recientes");
  const [icono] = useState("📝"); 
  
  // Presencia
  const [usuariosActivos, setUsuariosActivos] = useState([]);

  // REFERENCIAS (Para el temporizador)
  const quillRef = useRef(null);
  const printRef = useRef(null);
  const isLocalChange = useRef(false);
  const isFirstLoad = useRef(true);
  
  // Guardamos el estado actual en refs para que el setInterval pueda leerlo
  // sin necesidad de reiniciarse cada vez que escribes.
  const tituloRef = useRef(titulo);
  const contenidoRef = useRef(contenido);

  // Mantenemos las refs actualizadas
  useEffect(() => { tituloRef.current = titulo; }, [titulo]);
  useEffect(() => { contenidoRef.current = contenido; }, [contenido]);

  // 1. ESCUCHA DE DATOS Y PRESENCIA
  useEffect(() => {
      if (nota?.id) {
          const unsubNota = suscribirNota(nota.id, (data) => {
              if (isLocalChange.current) { isLocalChange.current = false; return; }
              if (data.titulo !== titulo) setTitulo(data.titulo);
              if (data.contenido !== contenido) setContenido(data.contenido);
              if (data.etiqueta !== etiqueta) setEtiqueta(data.etiqueta);
          });

          if (user) registrarPresencia(nota.id, user);

          const unsubPresencia = suscribirPresencia(nota.id, (usuarios) => {
              const otros = usuarios.filter(u => u.uid !== user?.uid);
              setUsuariosActivos(otros);
          });

          return () => {
              unsubNota();
              if (unsubPresencia) unsubPresencia();
              if (user) retirarPresencia(nota.id, user.uid);
          };
      }
  }, [nota?.id]);

  // 2. AUTOGUARDADO (Cada 2 segundos al escribir - Sobreescribe documento actual)
  useEffect(() => {
      if (isFirstLoad.current) { isFirstLoad.current = false; return; }
      if (!autoGuardado || readOnly || !nota?.id) return;
      const timer = setTimeout(async () => {
          setGuardando(true);
          isLocalChange.current = true;
          await onGuardar(nota.id, titulo, contenido, etiqueta, "");
          setGuardando(false);
          setUltimoGuardado("Autoguardado " + new Date().toLocaleTimeString());
      }, 2000);
      return () => clearTimeout(timer);
  }, [titulo, contenido, etiqueta, autoGuardado]);

  // 3. 🔥 HISTORIAL AUTOMÁTICO (CADA 20 MINUTOS) 🔥
  useEffect(() => {
      if (readOnly || !nota?.id) return;

      // 20 minutos = 20 * 60 * 1000 milisegundos
      const intervaloHistorial = setInterval(async () => {
          console.log("⏳ Creando punto de control automático (20 min)...");
          await guardarVersion(
              nota.id, 
              tituloRef.current, 
              contenidoRef.current, 
              user, 
              "Auto - 20min"
          );
          setUltimoGuardado("Punto de historial creado");
      }, 20 * 60 * 1000);

      return () => clearInterval(intervaloHistorial);
  }, [nota?.id]); // Solo se reinicia si cambias de documento

  // 4. 🔥 FUNCIÓN DE SALIDA INTELIGENTE 🔥
  const handleVolverConGuardado = async () => {
      // Si hay un documento válido, guardamos versión antes de salir
      if (nota?.id && !readOnly) {
          // 1. Guardado final en BD principal
          await onGuardar(nota.id, titulo, contenido, etiqueta, "");
          
          // 2. Guardado en HISTORIAL (Máquina del Tiempo)
          await guardarVersion(nota.id, titulo, contenido, user, "Auto - Al Salir");
      }
      
      // 3. Ejecutamos la salida real
      onVolver();
  };

  const handleSubmit = async () => {
    if (!titulo) return alert("El título es obligatorio");
    setGuardando(true);
    isLocalChange.current = true;
    await onGuardar(nota?.id, titulo, contenido, etiqueta, ""); 
    setGuardando(false);
    setUltimoGuardado("Guardado manualmente");
  };

  const handleRestaurarVersion = async (versionAntigua) => {
      setTitulo(versionAntigua.titulo);
      setContenido(versionAntigua.contenido);
      isLocalChange.current = true;
      await onGuardar(nota.id, versionAntigua.titulo, versionAntigua.contenido, etiqueta, "");
      alert("✅ Documento restaurado con éxito.");
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: titulo || "Documento",
  });

  const imageHandler = () => {
    const url = prompt("Pegar URL de la imagen:");
    if (url && quillRef.current) {
        const quill = quillRef.current.getEditor();
        quill.insertEmbed(quill.getSelection()?.index || 0, 'image', url);
    }
  };

  const modules = useMemo(() => {
    if (readOnly) return { toolbar: false };
    const config = {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                [{'list': 'ordered'}, {'list': 'bullet'}, {'list': 'check'}],
                ['link', 'image', 'video'], 
                [{ 'align': [] }],
                ['clean']
            ],
            handlers: { image: imageHandler }
        }
    };
    if (blotFormatterRegistrado) config.blotFormatter = { overlay: { style: { border: '2px solid #22c55e' } } };
    return config;
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
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-2 text-sm text-gray-400">
           {/* 🔥 BOTÓN VOLVER MODIFICADO 🔥 */}
           <button onClick={handleVolverConGuardado} className="hover:bg-white/10 p-1 rounded transition-colors text-white">⬅ Volver</button>
           <span className="text-gray-600">/</span><span className="text-gray-500">{etiqueta}</span><span className="text-gray-600">/</span>
           <span className="text-white font-medium truncate max-w-[200px]">{titulo || "Sin Título"}</span>
        </div>
        
        <div className="flex items-center gap-4">
             {/* PRESENCIA */}
             {usuariosActivos.length > 0 && (
                 <div className="flex items-center -space-x-2 mr-2">
                     {usuariosActivos.map((u, i) => (
                         <div key={i} className="relative group cursor-help">
                             {u.photoURL ? (
                                 <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full border-2 border-[#050505]" title={u.displayName} />
                             ) : (
                                 <div className="w-8 h-8 rounded-full border-2 border-[#050505] flex items-center justify-center text-xs font-bold text-black" style={{backgroundColor: u.color || '#ccc'}}>
                                     {u.displayName ? u.displayName[0].toUpperCase() : '?'}
                                 </div>
                             )}
                         </div>
                     ))}
                     <span className="text-xs text-green-500 ml-3 animate-pulse">• {usuariosActivos.length} online</span>
                 </div>
             )}

             <div className="text-right hidden md:block">
                <span className={`text-xs block font-bold ${guardando ? 'text-yellow-500' : 'text-gray-500'}`}>{guardando ? "Guardando..." : "Guardado"}</span>
                <span className="text-[10px] text-gray-600 block">{ultimoGuardado}</span>
             </div>
             
             {/* MÁQUINA DEL TIEMPO (Solo el reloj, quité el disquete manual extra) */}
             {!readOnly && nota?.id && (
                <button onClick={() => setMostrandoTimeMachine(true)} className="text-gray-400 hover:text-blue-400 text-lg" title="Ver historial de versiones">⏳</button>
             )}

             {!readOnly && nota?.id && (
                 <div className="flex items-center gap-2" title="Autoguardado">
                     <div onClick={() => setAutoGuardado(!autoGuardado)} className={`w-8 h-4 rounded-full cursor-pointer relative transition-colors ${autoGuardado ? 'bg-green-600' : 'bg-gray-700'}`}>
                         <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${autoGuardado ? 'left-4.5' : 'left-0.5'}`}></div>
                     </div>
                 </div>
             )}
             <button onClick={handlePrint} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-bold border border-gray-600 flex items-center gap-2">🖨️ PDF</button>
             {!readOnly && (
                 <button onClick={handleSubmit} className="text-sm bg-green-600 hover:bg-green-500 text-black font-bold px-4 py-1 rounded transition-all">{guardando ? '...' : 'Guardar'}</button>
             )}
        </div>
      </div>

      {/* ÁREA SCROLLEABLE */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div ref={printRef} className="bg-[#050505] min-h-screen text-white relative print-container"> 
            <div className="w-full max-w-4xl mx-auto px-8 py-12 flex flex-col print:px-0 print:py-0">
                {!readOnly && (
                    <div className="flex gap-4 mb-6 opacity-0 hover:opacity-100 transition-opacity duration-300 print:hidden">
                        <button onClick={() => { setTerminoBusqueda(""); setResultadosBusqueda([]); setMostrandoGaleria(true); }} className="text-gray-500 hover:text-white text-xs flex items-center gap-1 group"><span className="group-hover:scale-110 transition-transform">🖼️</span> Agregar Portada</button>
                    </div>
                )}
                <div className="text-6xl mb-4 select-none print:hidden">{icono}</div>
                {readOnly ? (
                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight border-b border-transparent print:text-black print:text-4xl print:border-black print:pb-2">{titulo}</h1>
                ) : (
                    <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="bg-transparent text-5xl font-bold text-white focus:outline-none w-full placeholder-gray-600 mb-6 leading-tight print:text-black print:text-4xl print:border-b-2 print:border-black" placeholder="Sin título" />
                )}
                <div className="flex items-center gap-6 mb-8 text-gray-500 text-sm border-b border-white/5 pb-4 font-mono print:hidden">
                    <div className="flex items-center gap-2"><span>📅 Creado:</span><span className="text-gray-300">Hoy</span></div>
                    <div className="flex items-center gap-2">
                        <span>🏷️ Etiqueta:</span>
                        {readOnly ? ( <span className="text-green-400">{etiqueta}</span> ) : (
                            <select value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} className="bg-transparent text-green-400 focus:outline-none cursor-pointer hover:underline appearance-none"><option value="General">General</option><option value="React">React</option><option value="JS">Javascript</option><option value="Python">Python</option><option value="Git">Git</option></select>
                        )}
                    </div>
                </div>
                <div className="flex-1 notion-editor-container pb-20 print:pb-0">
                    <ReactQuill ref={quillRef} theme={readOnly ? "bubble" : "snow"} value={contenido} onChange={setContenido} modules={modules} readOnly={readOnly} placeholder='Escribe algo...' />
                </div>
            </div>
        </div>
      </div>

      {mostrandoGaleria && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMostrandoGaleria(false)}></div><div className="relative bg-[#111] border border-gray-700 w-full max-w-3xl rounded-xl shadow-2xl p-0 animate-slideUp overflow-hidden max-h-[85vh] flex flex-col"><div className="p-4 border-b border-gray-800 flex items-center justify-between"><h3 className="text-white font-bold text-lg">Buscar Imagen</h3><button onClick={() => setMostrandoGaleria(false)} className="text-gray-400 hover:text-white">✕</button></div><div className="p-4 bg-[#0a0a0a]"><form onSubmit={buscarImagenes} className="relative"><span className="absolute left-3 top-2.5 text-gray-500">🔍</span><input type="text" autoFocus placeholder="Tema..." className="w-full bg-[#1a1a1a] border border-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:border-green-500 outline-none" value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} /><button type="submit" disabled={!terminoBusqueda} className="absolute right-2 top-1.5 bg-green-600 hover:bg-green-500 text-black font-bold text-xs px-3 py-1.5 rounded disabled:opacity-50">Buscar</button></form></div><div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#0f0f0f] min-h-[200px]">{!buscando && resultadosBusqueda.length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60"><span className="text-4xl mb-2">🖼️</span><p>Busca o pega URL</p></div>}{!buscando && resultadosBusqueda.length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{resultadosBusqueda.map((url, i) => (<div key={i} onClick={() => {setCover(url); setMostrandoGaleria(false);}} className="group relative h-28 rounded-lg cursor-pointer overflow-hidden border border-transparent hover:border-green-500 transition-all hover:scale-105"><img src={url} alt="Result" className="w-full h-full object-cover" loading="lazy" /></div>))}</div>}</div><div className="p-4 border-t border-gray-800 bg-[#151515]"><p className="text-xs text-gray-500 mb-2 font-bold uppercase">O pega URL:</p><input type="text" placeholder="https://..." className="w-full bg-[#050505] border border-gray-700 text-white px-3 py-2 rounded text-sm focus:border-green-500 outline-none font-mono" onKeyDown={(e) => { if(e.key === 'Enter') { setCover(e.target.value); setMostrandoGaleria(false); } }} /></div></div></div>)}

      {/* RENDERIZADO DEL MODAL DE TIME MACHINE */}
      {mostrandoTimeMachine && nota?.id && (
          <TimeMachine 
              notaId={nota.id} 
              onClose={() => setMostrandoTimeMachine(false)} 
              onRestaurar={handleRestaurarVersion} 
          />
      )}

      <style>{`
        .notion-editor-container .ql-toolbar.ql-snow { border: none !important; position: sticky; top: 0; z-index: 10; background: #050505; border-bottom: 1px solid rgba(255,255,255,0.1) !important; padding: 10px 0; opacity: 0.3; transition: opacity 0.3s; }
        .notion-editor-container:hover .ql-toolbar.ql-snow { opacity: 1; }
        .notion-editor-container .ql-container.ql-snow { border: none !important; font-family: 'Inter', sans-serif; font-size: 17px; line-height: 1.8; }
        .ql-editor { padding: 0 !important; color: #d4d4d4; min-height: 400px; }
        .ql-editor h1 { font-size: 2.2em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: white; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .ql-editor h2 { font-size: 1.8em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; color: #e5e5e5; }
        .ql-editor img { display: inline-block; cursor: pointer; } 
        
        @media print {
            @page { margin: 20mm; size: auto; }
            body { background-color: white !important; -webkit-print-color-adjust: exact; }
            body > *:not(.print-container) { display: none !important; }
            .print-container { background-color: white !important; color: black !important; position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; min-height: auto; }
            .print-container * { font-family: 'Georgia', 'Times New Roman', serif !important; color: black !important; }
            .ql-editor span[style*="background-color"] { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            input[type="text"] { font-size: 24pt !important; border: none !important; border-bottom: 2px solid black !important; margin-bottom: 20px !important; }
            .ql-editor { color: black !important; font-size: 12pt !important; line-height: 1.5 !important; padding: 0 !important; overflow: visible !important; }
            .ql-editor p { margin-bottom: 10px; orphans: 3; widows: 3; }
            .ql-toolbar { display: none !important; }
            img { max-width: 100% !important; page-break-inside: avoid; break-inside: avoid; }
            h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
        }
      `}</style>
    </div>
  );
}