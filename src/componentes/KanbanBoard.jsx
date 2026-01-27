/* src/componentes/KanbanBoard.jsx */
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { crearTarea, obtenerTareas, moverTarea, actualizarTarea } from '../servicios/proyectos';

const COLUMNAS_CONFIG = {
    todo: { id: 'todo', titulo: 'POR HACER', color: 'border-t-red-500' },
    doing: { id: 'doing', titulo: 'EN PROCESO', color: 'border-t-yellow-500' },
    done: { id: 'done', titulo: 'TERMINADO', color: 'border-t-green-500' }
};


export default function KanbanBoard({ proyectoId, equipo = [] }) {
    const [tareas, setTareas] = useState([]);
    
    // --- ESTADOS CREAR ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [fecha, setFecha] = useState("");
    const [prioridad, setPrioridad] = useState("media");
    const [asignado, setAsignado] = useState("");

    // --- ESTADOS EDITAR ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [tareaEditando, setTareaEditando] = useState(null);

    useEffect(() => { cargarTareas() }, [proyectoId]);

    const cargarTareas = async () => {
        const data = await obtenerTareas(proyectoId);
        setTareas(data);
    };

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const nuevasTareas = tareas.map(t => 
            t.id === draggableId ? { ...t, estado: destination.droppableId } : t
        );
        setTareas(nuevasTareas);
        await moverTarea(draggableId, destination.droppableId);
    };

    const handleCrear = async (e) => {
        e.preventDefault();
        if(!titulo) return;
        // Si no seleccionó a nadie, ponemos "Sin asignar"
        const asignadoFinal = asignado || "Sin asignar";
        await crearTarea(proyectoId, titulo, descripcion, fecha, prioridad, asignadoFinal);
        
        setTitulo(""); setDescripcion(""); setFecha(""); setPrioridad("media"); setAsignado("");
        setIsModalOpen(false);
        cargarTareas();
    };

    const handleActualizar = async (e) => {
        e.preventDefault();
        if(!tareaEditando || !tareaEditando.titulo) return;

        await actualizarTarea(tareaEditando.id, {
            titulo: tareaEditando.titulo,
            descripcion: tareaEditando.descripcion,
            fechaVencimiento: tareaEditando.fechaVencimiento,
            prioridad: tareaEditando.prioridad,
            asignadoA: tareaEditando.asignadoA
        });

        setIsEditModalOpen(false);
        setTareaEditando(null);
        cargarTareas();
    };

    const abrirEdicion = (tarea) => {
        setTareaEditando({ ...tarea });
        setIsEditModalOpen(true);
    };

    // Helper para obtener iniciales o nombre corto
    const getNombreCorto = (email) => email ? email.split('@')[0] : '?';

    return (
        <div className="h-full flex flex-col animate-fadeIn relative">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-1">
                <p className="text-gray-400 text-sm">Gestiona el flujo de trabajo del equipo.</p>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-500 text-black font-bold px-4 py-2 rounded text-sm flex items-center gap-2 transition-transform hover:scale-105"
                >
                    + NUEVA TAREA
                </button>
            </div>

            {/* TABLERO */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-4">
                    {Object.values(COLUMNAS_CONFIG).map((col) => (
                        <Droppable key={col.id} droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`bg-[#0a0a0a] rounded-xl border-t-4 ${col.color} p-4 flex flex-col h-full shadow-lg transition-colors ${snapshot.isDraggingOver ? 'bg-[#111] ring-1 ring-white/10' : ''}`}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-gray-300 font-bold text-xs tracking-widest uppercase">{col.titulo}</h3>
                                        <span className="bg-white/10 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                                            {tareas.filter(t => t.estado === col.id).length}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[100px]">
                                        {tareas
                                            .filter(t => t.estado === col.id)
                                            .map((tarea, index) => (
                                                <Draggable key={tarea.id} draggableId={tarea.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => abrirEdicion(tarea)}
                                                            style={{ ...provided.draggableProps.style }}
                                                            className={`bg-[#151515] p-4 mb-3 rounded-r-lg border-l-4 cursor-grab hover:bg-[#1a1a1a] transition-all shadow-md group relative
                                                                ${tarea.prioridad === 'alta' ? 'border-l-red-500' : tarea.prioridad === 'baja' ? 'border-l-blue-500' : 'border-l-yellow-500'}
                                                                ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-green-500/50 rotate-2 scale-105 z-50' : ''}
                                                            `}
                                                        >
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 text-xs">✏️</div>

                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase 
                                                                    ${tarea.prioridad === 'alta' ? 'text-red-400 bg-red-900/20' : tarea.prioridad === 'baja' ? 'text-blue-400 bg-blue-900/20' : 'text-yellow-400 bg-yellow-900/20'}`}>
                                                                    {tarea.prioridad || 'Media'}
                                                                </span>
                                                                {tarea.fechaVencimiento && (
                                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1 mr-4">
                                                                        📅 {new Date(tarea.fechaVencimiento).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <h4 className="text-white font-bold text-sm mb-1">{tarea.titulo}</h4>
                                                            {tarea.descripcion && (
                                                                <p className="text-gray-500 text-xs line-clamp-2 mb-3 leading-relaxed">{tarea.descripcion}</p>
                                                            )}

                                                            <div className="flex justify-between items-center border-t border-gray-800 pt-2 mt-2">
                                                                <div className="flex items-center gap-1">
                                                                    {tarea.asignadoA && tarea.asignadoA !== "Sin asignar" ? (
                                                                        <>
                                                                            <div className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center text-[10px] font-bold border border-blue-500/30" title={tarea.asignadoA}>
                                                                                {tarea.asignadoA.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{getNombreCorto(tarea.asignadoA)}</span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-[10px] text-gray-600 italic">Sin asignar</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>

            {/* --- MODAL CREAR TAREA --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <form onSubmit={handleCrear} className="bg-[#111] p-6 rounded-xl border border-green-500/30 w-full max-w-lg shadow-2xl animate-slideUp">
                        <h3 className="text-white font-bold mb-6 text-xl border-b border-gray-800 pb-2">Nueva Tarea</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Título</label>
                                <input autoFocus required value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-green-500" placeholder="Ej: Fix Bug Login" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Prioridad</label>
                                    <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-green-500">
                                        <option value="alta">🔴 Alta</option>
                                        <option value="media">🟡 Media</option>
                                        <option value="baja">🔵 Baja</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Fecha Límite</label>
                                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-green-500" />
                                </div>
                            </div>
                            
                            
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Asignar a</label>
                                <select value={asignado} onChange={e => setAsignado(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-green-500">
                                    <option value="">-- Seleccionar miembro --</option>
                                    {equipo.map((miembro, i) => (
                                        <option key={i} value={miembro.email}>
                                            {miembro.email} {miembro.rol === 'owner' ? '(Dueño)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Descripción</label>
                                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-green-500 h-24 resize-none" placeholder="Detalles..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 text-sm px-4 py-2 hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" className="bg-green-600 hover:bg-green-500 text-black font-bold px-6 py-2 rounded transition-all transform hover:scale-105">Crear Tarea</button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- MODAL EDITAR TAREA --- */}
            {isEditModalOpen && tareaEditando && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
                    <form onSubmit={handleActualizar} className="bg-[#151515] p-6 rounded-xl border border-yellow-500/30 w-full max-w-lg shadow-2xl animate-slideUp">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
                            <h3 className="text-white font-bold text-xl">Editar Tarea</h3>
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Título</label>
                                <input required value={tareaEditando.titulo} onChange={e => setTareaEditando({...tareaEditando, titulo: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-yellow-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Prioridad</label>
                                    <select value={tareaEditando.prioridad} onChange={e => setTareaEditando({...tareaEditando, prioridad: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-yellow-500">
                                        <option value="alta">🔴 Alta</option>
                                        <option value="media">🟡 Media</option>
                                        <option value="baja">🔵 Baja</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Fecha Límite</label>
                                    <input type="date" value={tareaEditando.fechaVencimiento || ""} onChange={e => setTareaEditando({...tareaEditando, fechaVencimiento: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-yellow-500" />
                                </div>
                            </div>
                            
                            
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Asignado a</label>
                                <select value={tareaEditando.asignadoA} onChange={e => setTareaEditando({...tareaEditando, asignadoA: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-yellow-500">
                                    <option value="">-- Sin asignar --</option>
                                    {equipo.map((miembro, i) => (
                                        <option key={i} value={miembro.email}>
                                            {miembro.email} {miembro.rol === 'owner' ? '(Dueño)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Descripción</label>
                                <textarea value={tareaEditando.descripcion} onChange={e => setTareaEditando({...tareaEditando, descripcion: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-yellow-500 h-24 resize-none" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-gray-400 text-sm px-4 py-2 hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-6 py-2 rounded transition-all transform hover:scale-105">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}