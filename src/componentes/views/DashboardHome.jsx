/* src/componentes/views/DashboardHome.jsx */
import React, { useState, useEffect } from 'react';
// 1. IMPORTAMOS LA FUNCIÓN PARA MOVER A PAPELERA
import { obtenerNotas, moverNotaAPapelera } from '../../servicios/notas'; 

export default function DashboardHome({ user, onEdit }) {
  const [notas, setNotas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarNotasDeLaNube();
  }, []);

  const cargarNotasDeLaNube = async () => {
    if (user && user.uid) {
      const todasLasNotas = await obtenerNotas(user.uid);
      
      // Filtramos: Solo notas sueltas (sin proyecto) y que NO estén en la papelera
      const notasSueltas = todasLasNotas.filter(nota => !nota.proyectoId && !nota.enPapelera);
      
      setNotas(notasSueltas);
      setCargando(false);
    }
  };

  // 2. FUNCIÓN PARA ELIMINAR (MOVER A PAPELERA)
  const handleEliminar = async (e, nota) => {
    e.stopPropagation(); // IMPORTANTE: Para que no se abra el editor al dar click en borrar
    
    if(confirm("¿Mover esta nota a la papelera?")) {
        await moverNotaAPapelera(nota.id, true); // true = enviar a basura
        cargarNotasDeLaNube(); // Recargamos la lista para que desaparezca
    }
  };

  return (
    <div className="animate-fadeIn h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-green-400">~/notas_rapidas</h2>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">
             Total: {notas.length}
          </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
        
        {/* BOTÓN CREAR */}
        <div 
          onClick={() => onEdit(null)} 
          className="group h-64 border border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-green-400 hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer bg-[#0a0a0a]"
        >
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">+</span>
            <span className="text-sm tracking-wider">NUEVA NOTA RÁPIDA</span>
        </div>

        {/* LISTA DE NOTAS */}
        {cargando ? (
          <p className="text-gray-500 animate-pulse mt-10 col-span-full text-center">Escaneando notas personales...</p>
        ) : (
          notas.map((nota) => (
            <div 
                key={nota.id} 
                onClick={() => onEdit(nota)} 
                className="bg-[#0f0f0f] border border-white/10 p-6 rounded-xl hover:border-green-500/30 transition-all group relative overflow-hidden animate-slideUp cursor-pointer h-64 flex flex-col hover:-translate-y-1 shadow-lg"
            >
                {/* DECORACIÓN: Pin (Arriba a la derecha) */}
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity text-green-500 pointer-events-none">
                  📌
                </div>

                {/* BOTÓN DE BORRAR (Arriba a la derecha, más visible al hacer hover) */}
                <button 
                    onClick={(e) => handleEliminar(e, nota)}
                    className="absolute top-2 right-10 p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                    title="Mover a Papelera"
                >
                    🗑️
                </button>

                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 pr-8">{nota.titulo}</h3>
                
                {/* Contenido */}
                <div 
                    className="text-sm text-gray-400 line-clamp-5 flex-1 overflow-hidden opacity-70"
                    dangerouslySetInnerHTML={{ __html: nota.contenido }}
                />

                <div className="mt-4 flex gap-2 pt-3 border-t border-gray-800/50 items-center justify-between">
                   <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 font-mono">
                      {nota.etiqueta || 'General'}
                   </span>
                   <span className="text-[10px] text-gray-600">
                      {nota.fecha?.seconds ? new Date(nota.fecha.seconds * 1000).toLocaleDateString() : 'Hoy'}
                   </span>
                </div>
            </div>
          ))
        )}

        {!cargando && notas.length === 0 && (
            <div className="col-span-full py-10 text-center text-gray-600">
                <p>No tienes notas rápidas.</p>
                <p className="text-xs mt-1">Usa este espacio para apuntes temporales.</p>
            </div>
        )}
      </div>
    </div>
  );
}