/* src/componentes/TimeMachine.jsx */
import React, { useState, useEffect } from 'react';
import { suscribirHistorial } from '../servicios/historial';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.bubble.css'; // Estilo ligero para lectura

export default function TimeMachine({ notaId, onClose, onRestaurar }) {
    const [versiones, setVersiones] = useState([]);
    const [versionSeleccionada, setVersionSeleccionada] = useState(null);

    useEffect(() => {
        const unsubscribe = suscribirHistorial(notaId, (data) => {
            setVersiones(data);
            if (data.length > 0 && !versionSeleccionada) {
                setVersionSeleccionada(data[0]); // Seleccionar la más reciente por defecto
            }
        });
        return () => unsubscribe();
    }, [notaId]);

    const handleRestaurar = () => {
        if (!versionSeleccionada) return;
        if (confirm(`¿Estás seguro de volver a la versión del ${new Date(versionSeleccionada.fecha?.seconds * 1000).toLocaleString()}? \nSe sobrescribirá lo actual.`)) {
            onRestaurar(versionSeleccionada);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn">
            <div className="w-[90%] h-[90%] bg-[#050505] border border-green-500/50 rounded-xl shadow-[0_0_50px_rgba(34,197,94,0.1)] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="h-14 border-b border-green-900/30 flex items-center justify-between px-6 bg-[#0a0a0a]">
                    <h2 className="text-xl font-mono text-green-400 flex items-center gap-2">
                        <span className="animate-spin-slow">⏳</span> TIME_MACHINE_v1.0
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white font-mono">[ SALIR ]</button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    
                    {/* LISTA LATERAL (Timeline) */}
                    <div className="w-1/3 border-r border-green-900/30 bg-[#080808] overflow-y-auto custom-scrollbar p-4">
                        <h3 className="text-xs text-gray-500 font-bold mb-4 uppercase tracking-widest">Puntos de Restauración</h3>
                        {versiones.length === 0 && <p className="text-gray-600 text-sm italic">No hay historial guardado.</p>}
                        
                        <div className="space-y-3">
                            {versiones.map((v) => (
                                <div 
                                    key={v.id} 
                                    onClick={() => setVersionSeleccionada(v)}
                                    className={`p-3 rounded border cursor-pointer transition-all ${versionSeleccionada?.id === v.id ? 'bg-green-900/20 border-green-500' : 'bg-[#111] border-white/5 hover:border-green-500/30'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-green-400 font-bold text-xs">
                                            {v.fecha ? new Date(v.fecha.seconds * 1000).toLocaleDateString() : 'Reciente'}
                                        </span>
                                        <span className="text-gray-500 text-[10px]">
                                            {v.fecha ? new Date(v.fecha.seconds * 1000).toLocaleTimeString() : ''}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm truncate font-mono">{v.titulo}</p>
                                    <p className="text-[10px] text-gray-600 mt-1">Editor: {v.editor}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PREVISUALIZACIÓN (Preview) */}
                    <div className="flex-1 bg-[#000] flex flex-col relative">
                        {versionSeleccionada ? (
                            <>
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    <h1 className="text-3xl font-bold text-white mb-6 border-b border-gray-800 pb-4">{versionSeleccionada.titulo}</h1>
                                    <div className="preview-container text-gray-300 font-serif">
                                        {/* Usamos Quill en modo lectura para ver el contenido tal cual */}
                                        <ReactQuill 
                                            value={versionSeleccionada.contenido} 
                                            readOnly={true} 
                                            theme="bubble"
                                        />
                                    </div>
                                </div>
                                
                                {/* Barra de Acción Inferior */}
                                <div className="h-16 border-t border-green-900/30 bg-[#0a0a0a] flex items-center justify-end px-6 gap-4">
                                    <span className="text-gray-500 text-xs">Visualizando modo solo lectura</span>
                                    <button 
                                        onClick={handleRestaurar}
                                        className="bg-green-600 hover:bg-green-500 text-black font-bold px-6 py-2 rounded text-sm transition-transform hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                    >
                                        ⏪ RESTAURAR ESTA VERSIÓN
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-600 font-mono">
                                Selecciona un punto en la línea temporal...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}