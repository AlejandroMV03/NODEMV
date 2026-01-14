/* src/componentes/views/ProjectsView.jsx */
import React, { useState, useEffect } from 'react';
import { crearProyecto, obtenerProyectos } from '../../servicios/proyectos';
import KanbanBoard from '../KanbanBoard'; // Importamos el tablero
// Reutilizamos el EditorView que ya hicimos para los documentos del proyecto
import EditorView from './EditorView'; 
import { crearNota, obtenerNotas, actualizarNota } from '../../servicios/notas'; // Reutilizamos lógica de notas para docs

export default function ProjectsView({ user }) {
    const [proyectos, setProyectos] = useState([]);
    const [proyectoActivo, setProyectoActivo] = useState(null); // Si es null, vemos la lista. Si tiene datos, estamos DENTRO.
    const [tabActivo, setTabActivo] = useState('docs'); // 'docs' o 'kanban'
    
    // Estados para crear proyecto
    const [creando, setCreando] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState("");

    // Estados para documentos dentro del proyecto
    const [docsProyecto, setDocsProyecto] = useState([]);
    const [editorAbierto, setEditorAbierto] = useState(null);

    useEffect(() => { cargarProyectos() }, [user]);
    useEffect(() => { 
        if(proyectoActivo) cargarDocsDelProyecto();
    }, [proyectoActivo]);

    const cargarProyectos = async () => {
        if(user) setProyectos(await obtenerProyectos(user.uid));
    };

    const cargarDocsDelProyecto = async () => {
        // Truco: Usamos el ID del proyecto como si fuera un "userId" para filtrar notas, 
        // o mejor aún, filtramos notas que tengan una etiqueta especial con el ID del proyecto.
        // Para simplificar hoy: Vamos a simular que obtenemos notas filtradas por etiqueta = ID_PROYECTO
        // (En una app real haríamos un query where('proyectoId', '==', id))
        if(user) {
            const todas = await obtenerNotas(user.uid);
            // Filtramos solo las que pertenecen a este proyecto (usaremos la etiqueta para guardar el ID del proyecto por ahora)
            setDocsProyecto(todas.filter(n => n.etiqueta === proyectoActivo.id));
        }
    };

    const handleCrearProyecto = async (e) => {
        e.preventDefault();
        if(!nuevoNombre) return;
        await crearProyecto(user.uid, nuevoNombre, "Proyecto de Ingeniería");
        setNuevoNombre("");
        setCreando(false);
        cargarProyectos();
    };

    const handleGuardarDoc = async (id, titulo, contenido) => {
        // Al guardar un doc dentro de un proyecto, forzamos que la etiqueta sea el ID del proyecto
        // Así sabemos a qué carpeta pertenece.
        if (id) await actualizarNota(id, titulo, contenido, proyectoActivo.id);
        else await crearNota(user.uid, titulo, contenido, proyectoActivo.id); // La etiqueta es el ID del proyecto
        
        setEditorAbierto(null);
        cargarDocsDelProyecto();
    };

    // --- VISTA 1: DENTRO DE UN PROYECTO ---
    if (proyectoActivo) {
        if (editorAbierto || editorAbierto === 'nuevo') {
            return <EditorView 
                nota={editorAbierto === 'nuevo' ? null : editorAbierto}
                onGuardar={handleGuardarDoc}
                onVolver={() => setEditorAbierto(null)}
            />
        }

        return (
            <div className="h-full flex flex-col animate-fadeIn">
                {/* Header del Proyecto */}
                <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-center">
                    <div>
                        <button onClick={() => setProyectoActivo(null)} className="text-gray-500 hover:text-white text-sm mb-1">← Volver a mis proyectos</button>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="text-purple-500">📂</span> {proyectoActivo.nombre}
                        </h1>
                    </div>
                    {/* Pestañas */}
                    <div className="flex bg-[#111] p-1 rounded-lg">
                        <button onClick={() => setTabActivo('docs')} className={`px-4 py-1 rounded text-sm transition-all ${tabActivo === 'docs' ? 'bg-white/10 text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}>📄 Documentación</button>
                        <button onClick={() => setTabActivo('kanban')} className={`px-4 py-1 rounded text-sm transition-all ${tabActivo === 'kanban' ? 'bg-white/10 text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}>📊 Tablero Tareas</button>
                    </div>
                </div>

                {/* Contenido Pestañas */}
                <div className="flex-1 overflow-hidden">
                    {tabActivo === 'kanban' ? (
                        <KanbanBoard proyectoId={proyectoActivo.id} />
                    ) : (
                        <div className="grid grid-cols-4 gap-4">
                            {/* Botón Nuevo Doc */}
                            <div onClick={() => setEditorAbierto('nuevo')} className="border border-dashed border-gray-700 rounded-lg h-32 flex flex-col items-center justify-center text-gray-500 hover:border-purple-500 hover:text-purple-400 cursor-pointer transition-colors">
                                <span className="text-2xl">+</span>
                                <span className="text-xs">Nuevo Documento</span>
                            </div>
                            
                            {/* Lista de Docs */}
                            {docsProyecto.map(doc => (
                                <div key={doc.id} onClick={() => setEditorAbierto(doc)} className="bg-[#111] border border-white/5 p-4 rounded-lg hover:border-purple-500/50 cursor-pointer group">
                                    <div className="text-2xl mb-2">📄</div>
                                    <h4 className="font-bold text-white truncate">{doc.titulo}</h4>
                                    <p className="text-xs text-gray-500 mt-1">Última edición: Hoy</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VISTA 2: LISTA DE TODOS LOS PROYECTOS ---
    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-green-400">/var/www/proyectos</h2>
                <button onClick={() => setCreando(true)} className="bg-green-600 hover:bg-green-500 text-black font-bold px-4 py-2 rounded text-sm">
                    + NUEVO PROYECTO
                </button>
            </div>

            {/* Modal Simple Crear Proyecto */}
            {creando && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                    <form onSubmit={handleCrearProyecto} className="bg-[#111] p-6 rounded-xl border border-green-500/30 w-96">
                        <h3 className="text-white font-bold mb-4">Nombrar Carpeta del Proyecto</h3>
                        <input autoFocus value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} className="w-full bg-black border border-gray-700 text-white p-2 rounded mb-4 focus:border-green-500 outline-none" placeholder="Ej: Sistema CRM" />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setCreando(false)} className="text-gray-400 text-sm px-3">Cancelar</button>
                            <button type="submit" className="bg-green-600 text-black font-bold px-4 py-1 rounded">Crear</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proyectos.map(p => (
                    <div 
                        key={p.id} 
                        onClick={() => setProyectoActivo(p)}
                        className="bg-[#0f0f0f] border border-white/5 p-6 rounded-xl hover:bg-[#151515] hover:border-purple-500/30 transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                🚀
                            </div>
                            <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded">Activo</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{p.nombre}</h3>
                        <p className="text-sm text-gray-500">Creado el {new Date(p.fechaCreacion.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}