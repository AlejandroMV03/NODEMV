/* src/componentes/views/TrashView.jsx */
import React, { useState, useEffect } from 'react';
import { obtenerNotas, eliminarNotaFisicamente, moverNotaAPapelera } from '../../servicios/notas';
import { obtenerProyectos, eliminarItemFisicamente, moverItemAPapelera } from '../../servicios/proyectos';

export default function TrashView({ user }) {
    const [itemsBasura, setItemsBasura] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if(user) cargarBasura();
    }, [user]);

    const cargarBasura = async () => {
        // Obtenemos TODO y filtramos lo que tenga enPapelera === true
        const notas = await obtenerNotas(user.uid);
        const proyectos = await obtenerProyectos(user.uid);
        
        // (Nota: Para carpetas sería más complejo traer todas de golpe, por ahora nos enfocamos en Proyectos y Notas)
        
        const basuraNotas = notas.filter(n => n.enPapelera === true).map(n => ({...n, tipo: 'nota', coleccion: 'notas'}));
        const basuraProyectos = proyectos.filter(p => p.enPapelera === true).map(p => ({...p, tipo: 'proyecto', coleccion: 'proyectos'}));

        setItemsBasura([...basuraProyectos, ...basuraNotas]);
        setCargando(false);
    };

    const handleRestaurar = async (item) => {
        if (confirm(`¿Restaurar "${item.titulo || item.nombre}"?`)) {
            if(item.tipo === 'nota') await moverNotaAPapelera(item.id, false);
            else await moverItemAPapelera(item.coleccion, item.id, false);
            cargarBasura();
        }
    };

    const handleEliminarDefinitivo = async (item) => {
        if (confirm(`⚠ ¿ELIMINAR DEFINITIVAMENTE "${item.titulo || item.nombre}"? \nEsta acción no se puede deshacer.`)) {
            if(item.tipo === 'nota') await eliminarNotaFisicamente(item.id);
            else await eliminarItemFisicamente(item.coleccion, item.id);
            cargarBasura();
        }
    };

    return (
        <div className="animate-fadeIn p-8">
            <h2 className="text-2xl font-bold text-red-500 mb-6 flex items-center gap-2">
                🗑️ Papelera de Reciclaje
            </h2>

            {cargando ? <p className="text-gray-500">Buscando archivos eliminados...</p> : (
                <div className="space-y-4">
                    {itemsBasura.length === 0 && (
                        <p className="text-gray-600">La papelera está vacía. ¡Buen trabajo manteniendo el orden!</p>
                    )}

                    {itemsBasura.map(item => (
                        <div key={item.id} className="bg-[#111] border border-red-900/30 p-4 rounded flex justify-between items-center group hover:bg-[#150505] transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl grayscale opacity-50">{item.tipo === 'proyecto' ? '🚀' : '📄'}</span>
                                <div>
                                    <h4 className="text-gray-300 font-bold decoration-slice line-through opacity-70">
                                        {item.nombre || item.titulo}
                                    </h4>
                                    <p className="text-xs text-red-400">Eliminado</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleRestaurar(item)}
                                    className="px-3 py-1 text-xs border border-green-900 text-green-500 rounded hover:bg-green-900/20"
                                >
                                    ♻ Restaurar
                                </button>
                                <button 
                                    onClick={() => handleEliminarDefinitivo(item)}
                                    className="px-3 py-1 text-xs bg-red-900/20 text-red-500 rounded hover:bg-red-600 hover:text-white transition-all"
                                >
                                    ✕ Eliminar Siempre
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}