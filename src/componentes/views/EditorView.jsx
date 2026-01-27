/* src/componentes/views/EditorView.jsx */
import '../../quillSetup';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';


// Esto carga los colores de las palabras reservadas (const, function, etc.)
import 'highlight.js/styles/atom-one-dark.css';

import { useReactToPrint } from 'react-to-print';
import { suscribirNota, registrarPresencia, retirarPresencia, suscribirPresencia } from '../../servicios/notas';
import { guardarVersion } from '../../servicios/historial';
import TimeMachine from '../TimeMachine';

export default function EditorView({ user, nota, onGuardar, onVolver, readOnly }) {
    const [titulo, setTitulo] = useState(nota ? nota.titulo : '');
    const [contenido, setContenido] = useState(nota ? nota.contenido : '');
    const [etiqueta, setEtiqueta] = useState(nota ? nota.etiqueta : 'General');

    // UI States
    const [mostrandoGaleria, setMostrandoGaleria] = useState(false);
    const [mostrandoTimeMachine, setMostrandoTimeMachine] = useState(false);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [autoGuardado, setAutoGuardado] = useState(true);
    const [ultimoGuardado, setUltimoGuardado] = useState('Sin cambios recientes');
    const [icono] = useState("📝");
    const [usuariosActivos, setUsuariosActivos] = useState([]);

    const quillRef = useRef(null);
    const printRef = useRef(null);
    const isLocalChange = useRef(false);
    const isFirstLoad = useRef(true);

    const tituloRef = useRef(titulo);
    const contenidoRef = useRef(contenido);

    useEffect(() => { tituloRef.current = titulo; }, [titulo]);
    useEffect(() => { contenidoRef.current = contenido; }, [contenido]);

    // --- SUSCRIPCIONES ---
    useEffect(() => {
        if (!nota?.id) return;

        const unsubNota = suscribirNota(nota.id, (data) => {
            if (isLocalChange.current) {
                isLocalChange.current = false;
                return;
            }
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
    }, [nota?.id]);

    // --- AUTOGUARDADO ---
    useEffect(() => {
        if (isFirstLoad.current) { isFirstLoad.current = false; return; }
        if (!autoGuardado || readOnly || !nota?.id) return;

        const timer = setTimeout(async () => {
            setGuardando(true);
            isLocalChange.current = true;
            await onGuardar(nota.id, titulo, contenido, etiqueta, '');
            setGuardando(false);
            setUltimoGuardado('Autoguardado ' + new Date().toLocaleTimeString());
        }, 2000);

        return () => clearTimeout(timer);
    }, [titulo, contenido, etiqueta, autoGuardado]);

    // --- HISTORIAL AUTOMÁTICO ---
    useEffect(() => {
        if (readOnly || !nota?.id) return;
        const intervalo = setInterval(async () => {
            await guardarVersion(nota.id, tituloRef.current, contenidoRef.current, user, 'Auto - 20min');
            setUltimoGuardado('Punto de historial creado');
        }, 20 * 60 * 1000);
        return () => clearInterval(intervalo);
    }, [nota?.id]);

    // --- HANDLERS ---
    const handleVolverConGuardado = async () => {
        if (nota?.id && !readOnly) {
            await onGuardar(nota.id, titulo, contenido, etiqueta, '');
            await guardarVersion(nota.id, titulo, contenido, user, 'Auto - Al salir');
        }
        onVolver();
    };

    const handleSubmit = async () => {
        if (!titulo) return alert('El título es obligatorio');
        setGuardando(true);
        isLocalChange.current = true;
        await onGuardar(nota?.id, titulo, contenido, etiqueta, '');
        setGuardando(false);
        setUltimoGuardado('Guardado manualmente');
    };

    const handleRestaurarVersion = async (version) => {
        setTitulo(version.titulo);
        setContenido(version.contenido);
        isLocalChange.current = true;
        await onGuardar(nota.id, version.titulo, version.contenido, etiqueta, '');
        alert('Documento restaurado');
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: titulo || 'Documento'
    });

    const imageHandler = () => {
        const url = prompt('Pegar URL de la imagen');
        if (url && quillRef.current) {
            const quill = quillRef.current.getEditor();
            quill.insertEmbed(quill.getSelection()?.index || 0, 'image', url);
        }
    };

    const buscarImagenes = (e) => {
        e.preventDefault(); if (!terminoBusqueda) return;
        setBuscando(true);
        const nuevasImagenes = Array.from({ length: 12 }).map((_, i) => `https://loremflickr.com/1200/400/${encodeURIComponent(terminoBusqueda)}?lock=${i + 1}`);
        setTimeout(() => { setResultadosBusqueda(nuevasImagenes); setBuscando(false); }, 800);
    };

    // --- CONFIGURACIÓN QUILL ---
    const modules = useMemo(() => {
        if (readOnly) return { toolbar: false };
        return {
            syntax: false, // Deshabilita el coloreado
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'], // Eliminado code-block
                    [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
                    ['link', 'image', 'video'],
                    [{ align: [] }],
                    ['clean']
                ],
                handlers: { image: imageHandler }
            },
            blotFormatter: {}
        };
    }, [readOnly]);

    return (
        <div className="flex flex-col h-full bg-[#050505] animate-fadeIn relative">

            {/* BARRA SUPERIOR */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-20 print:hidden">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <button onClick={handleVolverConGuardado} className="hover:bg-white/10 p-1 rounded transition-colors text-white">⬅ Volver</button>
                    <span className="text-gray-600">/</span><span className="text-gray-500">{etiqueta}</span><span className="text-gray-600">/</span>
                    <span className="text-white font-medium truncate max-w-[200px]">{titulo || "Sin Título"}</span>
                </div>

                <div className="flex items-center gap-4">
                    {usuariosActivos.length > 0 && (
                        <div className="flex items-center -space-x-2 mr-2">
                            {usuariosActivos.map((u, i) => (
                                <div key={i} className="relative group cursor-help">
                                    {u.photoURL ? (
                                        <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full border-2 border-[#050505]" title={u.displayName} />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full border-2 border-[#050505] flex items-center justify-center text-xs font-bold text-black" style={{ backgroundColor: u.color || '#ccc' }}>
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

            {/* ÁREA DE EDICIÓN */}
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
                                {readOnly ? (<span className="text-green-400">{etiqueta}</span>) : (
                                    <select value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} className="bg-transparent text-green-400 focus:outline-none cursor-pointer hover:underline appearance-none"><option value="General">General</option><option value="React">React</option><option value="JS">Javascript</option><option value="Python">Python</option><option value="Git">Git</option></select>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 notion-editor-container pb-20 print:pb-0">
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
            </div>

            {/* MODAL DE GALERÍA */}
            {mostrandoGaleria && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMostrandoGaleria(false)}></div><div className="relative bg-[#111] border border-gray-700 w-full max-w-3xl rounded-xl shadow-2xl p-0 animate-slideUp overflow-hidden max-h-[85vh] flex flex-col"><div className="p-4 border-b border-gray-800 flex items-center justify-between"><h3 className="text-white font-bold text-lg">Buscar Imagen</h3><button onClick={() => setMostrandoGaleria(false)} className="text-gray-400 hover:text-white">✕</button></div><div className="p-4 bg-[#0a0a0a]"><form onSubmit={buscarImagenes} className="relative"><span className="absolute left-3 top-2.5 text-gray-500">🔍</span><input type="text" autoFocus placeholder="Tema..." className="w-full bg-[#1a1a1a] border border-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:border-green-500 outline-none" value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} /><button type="submit" disabled={!terminoBusqueda} className="absolute right-2 top-1.5 bg-green-600 hover:bg-green-500 text-black font-bold text-xs px-3 py-1.5 rounded disabled:opacity-50">Buscar</button></form></div><div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#0f0f0f] min-h-[200px]">{!buscando && resultadosBusqueda.length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60"><span className="text-4xl mb-2">🖼️</span><p>Busca o pega URL</p></div>}{!buscando && resultadosBusqueda.length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{resultadosBusqueda.map((url, i) => (<div key={i} onClick={() => { imageHandler(url); setMostrandoGaleria(false); }} className="group relative h-28 rounded-lg cursor-pointer overflow-hidden border border-transparent hover:border-green-500 transition-all hover:scale-105"><img src={url} alt="Result" className="w-full h-full object-cover" loading="lazy" /></div>))}</div>}</div><div className="p-4 border-t border-gray-800 bg-[#151515]"><p className="text-xs text-gray-500 mb-2 font-bold uppercase">O pega URL:</p><input type="text" placeholder="https://..." className="w-full bg-[#050505] border border-gray-700 text-white px-3 py-2 rounded text-sm focus:border-green-500 outline-none font-mono" onKeyDown={(e) => { if (e.key === 'Enter') { const quill = quillRef.current.getEditor(); quill.insertEmbed(quill.getSelection()?.index || 0, 'image', e.target.value); setMostrandoGaleria(false); } }} /></div></div></div>)}

            {mostrandoTimeMachine && nota?.id && (
                <TimeMachine
                    notaId={nota.id}
                    onClose={() => setMostrandoTimeMachine(false)}
                    onRestaurar={handleRestaurarVersion}
                />
            )}


            <style>{`
        /* 1. FORZAR FONDO OSCURO EN EL BLOQUE DE CÓDIGO */
        .ql-snow .ql-editor pre.ql-syntax {
            background-color: #1e1e1e !important; /* Fondo negro suave (VS Code style) */
            color: #ff0000ff !important;             /* Texto base gris claro */
            border: 1px solid #333 !important;
            border-radius: 8px !important;
            padding: 15px !important;
            font-family: 'Fira Code', 'Consolas', monospace !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
            overflow-x: auto; /* Scroll horizontal si el código es largo */
        }

        /* 2. ELIMINAR EL FONDO BLANCO MOLESTO (GLITCH FIX) */
        .ql-snow .ql-editor pre.ql-syntax span {
            background-color: transparent !important;
        }

        /* 3. COLORES DE SINTAXIS (MANUALES PARA ASEGURAR QUE SE VEAN) */
        /* Si highlight.js falla al cargar el CSS, esto lo respalda */
        .hljs-keyword, .hljs-selector-tag, .hljs-built_in, .hljs-name, .hljs-tag {
            color: #c678dd !important; /* Morado (const, let, function) */
        }
        .hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-addition {
            color: #98c379 !important; /* Verde (Strings) */
        }
        .hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta {
            color: #7f848e !important; /* Gris (Comentarios) */
            font-style: italic;
        }
        .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-title, .hljs-section, .hljs-doctag, .hljs-type, .hljs-name, .hljs-strong {
            font-weight: bold;
        }
        .hljs-number {
            color: #d19a66 !important; /* Naranja (Números) */
        }
        .hljs-function, .hljs-class, .hljs-title {
            color: #61afef !important; /* Azul (Funciones) */
        }

        /* 4. ESTILO GENERAL DEL EDITOR (NOTION LIKE) */
        /* Barra de herramientas flotante y transparente */
        .notion-editor-container .ql-toolbar.ql-snow { 
            border: none !important; 
            position: sticky; 
            top: 0; 
            z-index: 50; 
            background: rgba(5, 5, 5, 0.95); /* Casi negro, un poco transparente */
            backdrop-filter: blur(5px);
            border-bottom: 1px solid rgba(255,255,255,0.1) !important; 
            padding: 12px 0; 
            transition: opacity 0.3s; 
        }
        
        /* Ocultar iconos de la barra si no se usa (opcional, aquí se ve siempre un poco) */
        .notion-editor-container .ql-toolbar.ql-snow button {
            color: #a0a0a0 !important;
        }
        .notion-editor-container .ql-toolbar.ql-snow button:hover {
            color: #ffffff !important;
        }
        .notion-editor-container .ql-toolbar.ql-snow .ql-picker {
            color: #a0a0a0 !important;
        }

        /* Área de texto */
        .notion-editor-container .ql-container.ql-snow { 
            border: none !important; 
            font-family: 'Inter', system-ui, sans-serif; 
            font-size: 16px; 
            line-height: 1.8; 
        }

        /* --- PERSONALIZACIÓN DE LOS SELECTORES (DROPDOWNS) --- */
        /* Color del texto/icono en la barra (estado cerrado) */
        .ql-snow .ql-picker {
            color: #d4d4d4 !important; 
        }
        .ql-snow .ql-picker-label {
            color: #d4d4d4 !important; 
        }
        /* Icono de la flechita (stroke) */
        .ql-snow .ql-picker-label svg polygon {
            stroke: #d4d4d4 !important;
        }

        /* Contenedor de las opciones (el despliegue) */
        .ql-snow .ql-picker-options {
            background-color: rgba(5, 5, 5, 0.95) !important; /* Fondo oscuro casi negro */
            backdrop-filter: blur(10px); /* Efecto glass */
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 8px !important;
            padding: 10px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8) !important;
        }

        /* Elementos individuales dentro del despliegue */
        .ql-snow .ql-picker-item {
            color: #a0a0a0 !important; /* Gris claro por defecto */
            padding: 4px 8px !important;
            border-radius: 4px;
            transition: all 0.2s;
        }

        /* Hover sobre las opciones */
        .ql-snow .ql-picker-item:hover {
            color: #ffffff !important;
            background-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        /* Opción seleccionada */
        .ql-snow .ql-picker-item.ql-selected {
            color: #4ade80 !important; /* Verde (coincidiendo con tu tema) */
            font-weight: bold;
        }
        
        .ql-editor { 
            padding: 0 !important; 
            color: #e0e0e0; 
            min-height: 60vh; 
        }

        /* Títulos */
        .ql-editor h1 { font-size: 2.5em; font-weight: 800; margin-top: 1.5em; margin-bottom: 0.5em; color: white; border-bottom: 1px solid #333; padding-bottom: 15px; }
        .ql-editor h2 { font-size: 2em; font-weight: 700; margin-top: 1.2em; margin-bottom: 0.5em; color: #f0f0f0; }
        .ql-editor h3 { font-size: 1.5em; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; color: #d4d4d4; }
        
        /* Imágenes */
        .ql-editor img { 
            display: block; 
            margin: 20px auto;
            max-width: 100%;
            border-radius: 8px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        } 

        /* Scrollbar personalizada para el código */
        pre.ql-syntax::-webkit-scrollbar {
            height: 8px;
            background-color: #1e1e1e;
        }
        pre.ql-syntax::-webkit-scrollbar-thumb {
            background-color: #444;
            border-radius: 4px;
        }
        
        /* IMPRESIÓN */
        @media print {
            @page { margin: 20mm; size: auto; }
            body { background-color: white !important; -webkit-print-color-adjust: exact; }
            body > *:not(.print-container) { display: none !important; }
            .print-container { background-color: white !important; color: black !important; position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; min-height: auto; }
            .ql-editor { color: black !important; font-size: 12pt !important; }
            .ql-toolbar { display: none !important; }
            /* En impresión, el código se ve claro */
            .ql-snow .ql-editor pre.ql-syntax {
                background-color: #f5f5f5 !important;
                color: black !important;
                border: 1px solid #ccc !important;
            }
        }
      `}</style>
        </div>
    );
}