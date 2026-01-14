/* src/componentes/KanbanBoard.jsx */
import React, { useState, useEffect } from 'react';
import { crearTarea, obtenerTareas, moverTarea } from '../servicios/proyectos';

export default function KanbanBoard({ proyectoId }) {
    const [tareas, setTareas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Estados para nueva tarea
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [fecha, setFecha] = useState("");
    const [prioridad, setPrioridad] = useState("media");
    const [asignado, setAsignado] = useState("");

    // Estado para Drag & Drop
    const [draggedTask, setDraggedTask] = useState(null);

    useEffect(() => { cargarTareas() }, [proyectoId]);

    const cargarTareas = async () => {
        const data = await obtenerTareas(proyectoId);
        setTareas(data);
    };

    const handleCrear = async (e) => {
        e.preventDefault();
        if(!titulo) return;
        
        await crearTarea(proyectoId, titulo, descripcion, fecha, prioridad, asignado);
        
        // Reset y cerrar
        setTitulo(""); setDescripcion(""); setFecha(""); setPrioridad("media"); setAsignado("");
        setIsModalOpen(false);
        cargarTareas();
    };

    // --- LÓGICA DRAG & DROP ---
    const handleDragStart = (e, tarea) => {
        setDraggedTask(tarea);
        // Efecto visual al arrastrar
        e.target.style.opacity = "0.5";
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = "1";
        setDraggedTask(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necesario para permitir soltar
    };

    const handleDrop = async (e, nuevoEstado) => {
        e.preventDefault();
        
        if (!draggedTask) return;
        if (draggedTask.estado === nuevoEstado) return; // Si lo suelta en la misma columna

        // 1. Confirmación del Usuario
        const confirmacion = window.confirm(`¿Mover "${draggedTask.titulo}" a ${nuevoEstado.toUpperCase()}?`);
        
        if (confirmacion) {
            // 2. Actualización Optimista (Visual inmediata)
            const tareasActualizadas = tareas.map(t => 
                t.id === draggedTask.id ? { ...t, estado: nuevoEstado } : t
            );
            setTareas(tareasActualizadas);

            // 3. Guardar en BD
            await moverTarea(draggedTask.id, nuevoEstado);
        }
    };

    // Filtramos columnas
    const cols = {
        todo: tareas.filter(t => t.estado === 'todo'),
        doing: tareas.filter(t => t.estado === 'doing'),
        done: tareas.filter(t => t.estado === 'done')
    };

    return (
        <div className="h-full flex flex-col animate-fadeIn relative">
            
            {/* Header del Tablero */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-400 text-sm">Arrastra las tarjetas para cambiar su estado.</p>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-500 text-black font-bold px-4 py-2 rounded text-sm flex items-center gap-2 transition-transform hover:scale-105"
                >
                    + NUEVA TAREA
                </button>
            </div>

            {/* Columnas */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-4">
                <Columna 
                    titulo="POR HACER" 
                    tareas={cols.todo} 
                    estado="todo"
                    color="border-red-500/50" 
                    onDragOver={handleDragOver} 
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                />
                <Columna 
                    titulo="EN PROCESO" 
                    tareas={cols.doing} 
                    estado="doing"
                    color="border-yellow-500/50" 
                    onDragOver={handleDragOver} 
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                />
                <Columna 
                    titulo="TERMINADO" 
                    tareas={cols.done} 
                    estado="done"
                    color="border-green-500/50" 
                    onDragOver={handleDragOver} 
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                />
            </div>

            {/* MODAL CREAR TAREA (Flotante) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <form onSubmit={handleCrear} className="bg-[#111] p-6 rounded-xl border border-green-500/30 w-full max-w-lg shadow-2xl animate-slideUp">
                        <h3 className="text-white font-bold mb-6 text-xl border-b border-gray-800 pb-2">Nueva Tarea</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Título</label>
                                <input autoFocus required value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-green-500" placeholder="Ej: Diseñar Base de Datos" />
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
                                <label className="text-xs text-gray-500 uppercase font-bold">Asignado a</label>
                                <input value={asignado} onChange={e => setAsignado(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-green-500" placeholder="Nombre del responsable..." />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Descripción</label>
                                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-green-500 h-24 resize-none" placeholder="Detalles de la tarea..." />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 text-sm px-4 py-2 hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" className="bg-green-600 hover:bg-green-500 text-black font-bold px-6 py-2 rounded transition-all transform hover:scale-105">Crear Tarea</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

// Componente de Columna (Zona de Drop)
function Columna({ titulo, tareas, estado, color, onDragOver, onDrop, onDragStart, onDragEnd }) {
    return (
        <div 
            className={`bg-[#0a0a0a] rounded-xl border-t-4 ${color} p-4 flex flex-col h-full shadow-lg transition-colors hover:bg-[#0f0f0f]`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, estado)}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-300 font-bold text-xs tracking-widest uppercase">{titulo}</h3>
                <span className="bg-white/10 text-gray-400 text-xs px-2 py-0.5 rounded-full">{tareas.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {tareas.map(t => (
                    <TarjetaTarea 
                        key={t.id} 
                        tarea={t} 
                        onDragStart={onDragStart} 
                        onDragEnd={onDragEnd} 
                    />
                ))}
                {tareas.length === 0 && (
                    <div className="h-20 border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-600 text-xs">
                        Arrastra aquí
                    </div>
                )}
            </div>
        </div>
    );
}

// Componente de Tarjeta (Elemento Draggable)
function TarjetaTarea({ tarea, onDragStart, onDragEnd }) {
    // Colores según prioridad
    const bordes = {
        alta: 'border-l-red-500',
        media: 'border-l-yellow-500',
        baja: 'border-l-blue-500'
    };
    
    const badges = {
        alta: 'text-red-400 bg-red-900/20',
        media: 'text-yellow-400 bg-yellow-900/20',
        baja: 'text-blue-400 bg-blue-900/20'
    };

    return (
        <div 
            draggable="true"
            onDragStart={(e) => onDragStart(e, tarea)}
            onDragEnd={onDragEnd}
            className={`bg-[#151515] p-4 rounded-r-lg border-l-4 ${bordes[tarea.prioridad] || 'border-l-gray-500'} cursor-grab active:cursor-grabbing hover:bg-[#1a1a1a] transition-all shadow-md group`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${badges[tarea.prioridad] || 'text-gray-400'}`}>
                    {tarea.prioridad || 'Normal'}
                </span>
                {tarea.fechaVencimiento && (
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        📅 {new Date(tarea.fechaVencimiento).toLocaleDateString()}
                    </span>
                )}
            </div>

            <h4 className="text-white font-bold text-sm mb-1">{tarea.titulo}</h4>
            
            {tarea.descripcion && (
                <p className="text-gray-500 text-xs line-clamp-2 mb-3 leading-relaxed">
                    {tarea.descripcion}
                </p>
            )}

            <div className="flex justify-between items-center border-t border-gray-800 pt-2 mt-2">
                <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-bold">
                        {tarea.asignadoA ? tarea.asignadoA.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
                        {tarea.asignadoA}
                    </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 text-[10px]">
                    ⋮
                </div>
            </div>
        </div>
    );
}