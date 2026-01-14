/* src/componentes/ProjectChat.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { enviarMensaje, suscribirChat } from '../../servicios/chat';

export default function ProjectChat({ proyectoId, user }) {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState([]);
    const [input, setInput] = useState("");
    const [tieneNotificacion, setTieneNotificacion] = useState(false); 
    
    const bottomRef = useRef(null); 
    const isFirstLoad = useRef(true); 
    
    const abiertoRef = useRef(abierto);

    useEffect(() => {
        abiertoRef.current = abierto;
        if (abierto) {
            setTieneNotificacion(false); 
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
    }, [abierto]);

    useEffect(() => {
        if (!proyectoId) return;

        const unsubscribe = suscribirChat(proyectoId, (msgs) => {
            setMensajes(prevMsgs => {
                if (msgs.length > prevMsgs.length && !abiertoRef.current && !isFirstLoad.current) {
                    setTieneNotificacion(true);
                }
                return msgs;
            });

            if (isFirstLoad.current) isFirstLoad.current = false;
        });

        return () => unsubscribe();
    }, [proyectoId]); 

    useEffect(() => {
        if (abierto) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [mensajes, abierto]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        await enviarMensaje(proyectoId, user, input);
        setInput("");
    };

    // --- VISTA CERRADA (BOTÓN FLOTANTE) ---
    if (!abierto) {
        return (
            <button 
                onClick={() => setAbierto(true)}
                // CORRECCIÓN: Quitamos 'relative' del final porque 'fixed' ya hace el trabajo
                className="fixed bottom-6 right-6 bg-black border border-green-500 text-green-500 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-110 transition-transform z-50 font-mono text-xl"
            >
                {/* PUNTITO ROJO */}
                {tieneNotificacion && (
                    <span className="absolute top-0 right-0 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-black"></span>
                    </span>
                )}
                
                {'>_'}
            </button>
        );
    }

    // --- VISTA ABIERTA (TERMINAL) ---
    return (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-black/95 border border-green-500 rounded-lg shadow-2xl flex flex-col z-50 font-mono text-sm overflow-hidden animate-slideUp backdrop-blur-sm">
            
            {/* Barra de Título */}
            <div className="bg-green-900/20 border-b border-green-500/50 p-2 flex justify-between items-center cursor-move">
                <span className="text-green-400 text-xs tracking-widest">root@chat:~/{proyectoId.slice(0,6)}</span>
                <button onClick={() => setAbierto(false)} className="text-green-600 hover:text-green-300 hover:bg-green-900/50 px-2 rounded">x</button>
            </div>

            {/* Área de Logs */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-2">
                <div className="text-gray-500 italic text-xs mb-4">
                    # Conexión establecida segura (SSH-2.0)<br/>
                    # Iniciando protocolo de comunicación...
                </div>

                {mensajes.map((msg) => {
                    const esMio = msg.uid === user.uid;
                    return (
                        <div key={msg.id} className="flex flex-col animate-fadeIn">
                            <span className={`text-[10px] ${esMio ? 'text-blue-400' : 'text-purple-400'}`}>
                                {esMio ? 'root' : msg.usuario.toLowerCase().replace(' ', '_')}@local:~$
                            </span>
                            <span className="text-green-300 break-words pl-2">
                                {msg.texto}
                            </span>
                        </div>
                    );
                })}
                <div ref={bottomRef}></div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-2 border-t border-green-500/30 bg-black flex items-center gap-2">
                <span className="text-green-500 animate-pulse">{'>'}</span>
                <input 
                    autoFocus
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent text-white outline-none placeholder-green-800"
                    placeholder="Escribir comando..."
                />
            </form>
        </div>
    );
}