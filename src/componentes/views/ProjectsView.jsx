/* src/componentes/views/ProjectsView.jsx */
import React, { useState, useEffect } from 'react';
import { 
    crearProyecto, obtenerProyectos, crearCarpeta, obtenerCarpetas, 
    moverItemAPapelera, actualizarProyecto, agregarColaborador, 
    actualizarRolColaborador, eliminarColaborador, 
    suscribirProyecto 
} from '../../servicios/proyectos';
import { crearNota, obtenerNotas, actualizarNota, moverNota, moverNotaAPapelera, obtenerNotasDeProyecto } from '../../servicios/notas';
import KanbanBoard from '../KanbanBoard';
import EditorView from './EditorView';
import ProjectChat from './ProjectChat';


export default function ProjectsView({ user }) {
    // --- ESTADOS ---
    const [proyectos, setProyectos] = useState([]);
    const [misProyectos, setMisProyectos] = useState([]);
    const [proyectosCompartidos, setProyectosCompartidos] = useState([]);

    const [proyectoActivo, setProyectoActivo] = useState(null);
    const [tabActivo, setTabActivo] = useState('docs');
    const [carpetaActual, setCarpetaActual] = useState(null);
    const [ruta, setRuta] = useState([]); 
    const [items, setItems] = useState([]); 
    
    // ESTADO DEL EDITOR
    const [docEditando, setDocEditando] = useState(null);

    // MODALES
    const [creandoProyecto, setCreandoProyecto] = useState(false);
    const [creandoCarpetaModal, setCreandoCarpetaModal] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [modalCompartir, setModalCompartir] = useState(false);
    const [modalGestionarEquipo, setModalGestionarEquipo] = useState(false);
    const [emailInvitado, setEmailInvitado] = useState("");
    const [rolInvitado, setRolInvitado] = useState("visor");
    const [editandoProyectoModal, setEditandoProyectoModal] = useState(false);
    const [proyectoAEditar, setProyectoAEditar] = useState(null);
    const [editNombre, setEditNombre] = useState("");
    const [editDescripcion, setEditDescripcion] = useState("");
    const [editRepoUrl, setEditRepoUrl] = useState("");
    const [modalMover, setModalMover] = useState(false);
    const [archivoAMover, setArchivoAMover] = useState(null);
    const [proyectoDestino, setProyectoDestino] = useState("");
    const [carpetaDestinoId, setCarpetaDestinoId] = useState(""); 
    const [carpetasDestino, setCarpetasDestino] = useState([]); 
    const [menuContextual, setMenuContextual] = useState({ visible: false, x: 0, y: 0, item: null, tipo: '' });

    // PERMISOS
    const puedeEditar = proyectoActivo?.miRol === 'owner' || proyectoActivo?.miRol === 'editor';
    const esDueno = proyectoActivo?.miRol === 'owner';

    // --- EFECTOS ---
    useEffect(() => { if(user && user.email) cargarProyectos(); }, [user]);
    
    // Carga de contenido: SOLO si NO estamos editando para evitar parpadeos
    useEffect(() => { 
        if(proyectoActivo && tabActivo === 'docs' && !docEditando) {
            cargarContenidoActual(); 
        }
    }, [proyectoActivo, carpetaActual, tabActivo, docEditando]);

    useEffect(() => { if(proyectoDestino) cargarCarpetasDelDestino(proyectoDestino); }, [proyectoDestino]);
    
    useEffect(() => {
        const closeMenu = () => setMenuContextual({ ...menuContextual, visible: false });
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, [menuContextual]);

    // ESCUCHA EN TIEMPO REAL (Seguridad)
    useEffect(() => {
        if (!proyectoActivo || !user) return;
        const unsubscribe = suscribirProyecto(proyectoActivo.id, (datosFrescos) => {
            if (!datosFrescos) {
                alert("El proyecto ha sido eliminado.");
                setProyectoActivo(null);
                cargarProyectos();
                return;
            }
            let nuevoRol = 'visor'; 
            if (datosFrescos.userId === user.uid) {
                nuevoRol = 'owner';
            } else {
                const yoEnLaLista = datosFrescos.colaboradores?.find(c => c.email === user.email);
                if (yoEnLaLista) {
                    nuevoRol = yoEnLaLista.rol;
                } else {
                    alert("Ya no tienes acceso a este proyecto.");
                    setProyectoActivo(null);
                    cargarProyectos();
                    return;
                }
            }
            setProyectoActivo(prev => ({ ...prev, ...datosFrescos, miRol: nuevoRol }));
        });
        return () => unsubscribe();
    }, [proyectoActivo?.id]);

    // --- CARGAS ---
    const cargarProyectos = async () => {
        const data = await obtenerProyectos(user.uid, user.email);
        const activos = data.filter(p => !p.enPapelera);
        setProyectos(activos);
        setMisProyectos(activos.filter(p => p.miRol === 'owner'));
        setProyectosCompartidos(activos.filter(p => p.miRol !== 'owner'));
    };

    const cargarCarpetasDelDestino = async (pId) => { const carpetas = await obtenerCarpetas(pId, null); setCarpetasDestino(carpetas); };

    const cargarContenidoActual = async () => {
        if(!user || !proyectoActivo) return;
        const carpetaId = carpetaActual ? carpetaActual.id : null;
        const carpetas = await obtenerCarpetas(proyectoActivo.id, carpetaId);
        const todasLasNotas = await obtenerNotasDeProyecto(proyectoActivo.id);
        const docsFiltrados = todasLasNotas.filter(n => (n.carpetaId || null) === carpetaId && !n.enPapelera);
        const carpetasFiltradas = carpetas.filter(c => !c.enPapelera);
        setItems([...carpetasFiltradas, ...docsFiltrados]);
    };

    // --- ACCIONES ---
    const handleCrearProyecto = async (e) => {
        e.preventDefault(); if(!nuevoNombre) return;
        await crearProyecto(user.uid, user.email, nuevoNombre, "Sin descripción");
        setNuevoNombre(""); setCreandoProyecto(false); cargarProyectos();
    };

    const handleCrearCarpeta = async (e) => {
        e.preventDefault(); if(!nuevoNombre) return;
        await crearCarpeta(proyectoActivo.id, nuevoNombre, carpetaActual?.id || null);
        setNuevoNombre(""); setCreandoCarpetaModal(false); cargarContenidoActual();
    };

   
    const handleGuardarDoc = async (id, titulo, contenido, etiqueta, cover) => {
        if (id) {
            // Si ya tiene ID, solo actualizamos en silencio
            await actualizarNota(id, titulo, contenido, etiqueta, cover);
        } else {
            // Si es nuevo, lo creamos y OBTENEMOS EL ID
            const nuevoId = await crearNota(
                user.uid, 
                titulo, 
                contenido, 
                etiqueta, 
                proyectoActivo.id, 
                carpetaActual ? carpetaActual.id : null, 
                cover
            );

            // ¡ACTUALIZAMOS EL ESTADO! 
            // Así el editor sabe que ya no es "nuevo" y deja de duplicar/reiniciar
            if (nuevoId) {
                setDocEditando({
                    id: nuevoId,
                    titulo,
                    contenido,
                    etiqueta,
                    cover,
                    proyectoId: proyectoActivo.id,
                    carpetaId: carpetaActual ? carpetaActual.id : null
                });
            }
        }
        // NO llamamos a cargarContenidoActual() aquí para no mover la pantalla
    };

    // Función para cerrar manualmente (Botón Volver)
    const cerrarEditor = () => {
        setDocEditando(null); // Cerramos el editor
        cargarContenidoActual(); // Refrescamos la lista de archivos
    };

    // --- GESTIÓN DE EQUIPO ---
    const handleInvitar = async (e) => {
        e.preventDefault(); if(!emailInvitado) return;
        await agregarColaborador(proyectoActivo.id, emailInvitado, rolInvitado);
        const urlPlataforma = window.location.origin;
        const mensaje = `Hola! 🚀 Te invito a colaborar en "${proyectoActivo.nombre}".\nAccede: ${urlPlataforma}`;
        try { await navigator.clipboard.writeText(mensaje); alert("Invitación enviada y enlace copiado."); } catch (err) { alert("Usuario agregado."); }
        setModalCompartir(false); setEmailInvitado(""); 
    };

    const cambiarRolUsuario = async (email, nuevoRol) => {
        if (confirm(`¿Cambiar rol de ${email} a ${nuevoRol}?`)) {
            await actualizarRolColaborador(proyectoActivo.id, email, nuevoRol);
        }
    };

    const quitarUsuario = async (email) => {
        if (confirm(`¿Seguro que quieres eliminar a ${email} del proyecto?`)) {
            await eliminarColaborador(proyectoActivo.id, email);
        }
    };

    // --- MENÚS ---
    const abrirModalEdicion = (e) => {
        e.stopPropagation(); 
        const proyecto = menuContextual.item || proyectoActivo;
        if(!proyecto) return;
        if(proyecto.miRol === 'visor') { alert("Solo editores pueden modificar el proyecto"); return; }
        setProyectoAEditar(proyecto); setEditNombre(proyecto.nombre); setEditDescripcion(proyecto.descripcion || ""); setEditRepoUrl(proyecto.repoUrl || "");
        setEditandoProyectoModal(true); setMenuContextual({ ...menuContextual, visible: false });
    };

    const guardarEdicionProyecto = async (e) => {
        e.preventDefault(); if(!editNombre) return;
        await actualizarProyecto(proyectoAEditar.id, { nombre: editNombre, descripcion: editDescripcion, repoUrl: editRepoUrl });
        setEditandoProyectoModal(false);
    };

    const abrirMenuContextual = (e, item, tipo = 'archivo') => {
        e.stopPropagation(); setMenuContextual({ visible: true, x: e.pageX, y: e.pageY, item: item, tipo: tipo });
    };

    const enviarAPapelera = async () => {
        const { item, tipo } = menuContextual; if(!item) return;
        if(!puedeEditar) { alert("No tienes permisos."); return; }
        if (tipo === 'proyecto') {
             if(!esDueno) { alert("Solo el dueño puede eliminar."); return; }
             if(confirm(`¿Eliminar proyecto?`)) { await moverItemAPapelera('proyectos', item.id); cargarProyectos(); if(proyectoActivo?.id === item.id) setProyectoActivo(null); }
        } else {
            if(item.tipo === 'folder') await moverItemAPapelera('carpetas', item.id); else await moverNotaAPapelera(item.id);
            cargarContenidoActual();
        }
    };

    const abrirModalMover = () => {
        if(!puedeEditar) { alert("No tienes permisos."); return; }
        setArchivoAMover(menuContextual.item); setProyectoDestino(proyectoActivo.id); setCarpetaDestinoId(""); setModalMover(true);
    };
    
    const ejecutarMover = async () => {
        if(!archivoAMover || !proyectoDestino) return;
        await moverNota(archivoAMover.id, proyectoDestino, carpetaDestinoId || null);
        setModalMover(false); setArchivoAMover(null); cargarContenidoActual();
    };

    // IMPORTANTE: onVolver usa cerrarEditor
    if (docEditando) {
        return (
            <div className="relative h-full w-full">
                <EditorView 
                    user={user} // Pasamos el usuario para los avatares
                    nota={docEditando === 'nuevo' ? null : docEditando} 
                    onGuardar={handleGuardarDoc} 
                    onVolver={cerrarEditor} 
                    readOnly={!puedeEditar} 
                />
                {/* 💬 AQUÍ ESTÁ EL CHAT FLOTANTE, DISPONIBLE MIENTRAS EDITAS */}
                <ProjectChat proyectoId={proyectoActivo.id} user={user} />
            </div>
        );
    }

    if (proyectoActivo) {
        return (
            <div className="h-full flex flex-col animate-fadeIn relative">
                {/* HEADER PROYECTO */}
                <div className="border-b border-white/10 pb-6 mb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <button onClick={() => { setProyectoActivo(null); setCarpetaActual(null); setRuta([]); }} className="text-gray-500 hover:text-white text-sm mb-2">⬅ Volver</button>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <span className="text-purple-500">📂</span> {proyectoActivo.nombre}
                                <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${proyectoActivo.miRol === 'owner' ? 'border-yellow-500 text-yellow-500' : 'border-blue-500 text-blue-500'}`}>{proyectoActivo.miRol === 'owner' ? 'Dueño' : proyectoActivo.miRol}</span>
                            </h1>
                            <p className="text-gray-400 text-sm mt-2">{proyectoActivo.descripcion}</p>
                        </div>
                        <div className="flex gap-4 items-center">
                            {esDueno && (
                                <div className="flex gap-2">
                                    <button onClick={() => setModalCompartir(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-2"><span>🔗</span> Invitar</button>
                                    <button onClick={() => setModalGestionarEquipo(true)} className="bg-[#222] border border-gray-600 hover:bg-[#333] text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-2"><span>👥</span> Equipo</button>
                                </div>
                            )}
                            <button onClick={(e) => { setMenuContextual({item: proyectoActivo, tipo: 'proyecto'}); abrirModalEdicion(e); }} className="text-gray-500 hover:text-white text-sm underline">Editar Info</button>
                            <div className="flex bg-[#111] p-1 rounded-lg border border-white/5">
                                <button onClick={() => setTabActivo('docs')} className={`px-4 py-1 rounded text-sm ${tabActivo === 'docs' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Archivos</button>
                                <button onClick={() => setTabActivo('kanban')} className={`px-4 py-1 rounded text-sm ${tabActivo === 'kanban' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Tareas</button>
                            </div>
                        </div>
                    </div>
                    
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {tabActivo === 'kanban' ? <KanbanBoard proyectoId={proyectoActivo.id} readOnly={!puedeEditar} /> : (
                        <>
                            <div className="flex items-center justify-between mb-4 px-2 h-10 border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-sm text-gray-400"><span onClick={() => {setRuta([]); setCarpetaActual(null);}} className="hover:text-white cursor-pointer hover:underline">Inicio</span>{ruta.map((folder) => (<React.Fragment key={folder.id}><span>/</span><span className="text-white font-bold">{folder.nombre}</span></React.Fragment>))}</div>
                                {puedeEditar && <div className="flex items-center gap-2"><button onClick={() => { setNuevoNombre(""); setCreandoCarpetaModal(true); }} className="text-xs text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/10 border border-transparent hover:border-yellow-500/30 px-3 py-1.5 rounded flex items-center gap-2"><span>📁+</span> Nueva Carpeta</button><button onClick={() => setDocEditando('nuevo')} className="text-xs text-gray-400 hover:text-blue-400 hover:bg-blue-900/10 border border-transparent hover:border-blue-500/30 px-3 py-1.5 rounded flex items-center gap-2"><span>📝+</span> Nuevo Doc</button></div>}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto h-full pr-2 pb-10 custom-scrollbar content-start">
                                {items.length === 0 && <div className="col-span-full py-20 text-center text-gray-600 italic border border-dashed border-gray-800 rounded-lg">Carpeta vacía</div>}
                                {items.map(item => (<div key={item.id} onClick={() => item.tipo === 'folder' ? (item => { setRuta([...ruta, item]); setCarpetaActual(item); })(item) : setDocEditando(item)} className={`relative p-3 rounded border cursor-pointer group flex flex-col justify-between h-28 hover:-translate-y-1 transition-all ${item.tipo === 'folder' ? 'bg-[#111] border-white/5 hover:border-yellow-500/40' : 'bg-[#0f0f0f] border-white/5 hover:border-blue-500/40'}`}><div className="flex justify-between items-start"><div className="text-2xl opacity-80">{item.tipo === 'folder' ? '📁' : '📄'}</div>{puedeEditar && <div onClick={(e) => abrirMenuContextual(e, item, 'archivo')} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white hover:bg-white/10 rounded px-1.5 transition-all z-10 text-xs">•••</div>}</div><div><h4 className="font-bold text-gray-300 truncate text-xs mb-1">{item.nombre || item.titulo}</h4><p className="text-[10px] text-gray-600">{item.tipo === 'folder' ? 'Carpeta' : 'Documento'}</p></div></div>))}
                            </div>
                        </>
                    )}
                </div>

                {/* MODALES */}
                {modalGestionarEquipo && (<div className="fixed inset-0 bg-black/90 z-[75] flex items-center justify-center backdrop-blur-sm" onClick={(e) => e.stopPropagation()}><div className="bg-[#111] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl p-6 animate-slideUp"><div className="flex justify-between items-center mb-6"><h3 className="text-white font-bold text-lg flex items-center gap-2">👥 Gestionar Equipo</h3><button onClick={() => setModalGestionarEquipo(false)} className="text-gray-400 hover:text-white">✕</button></div><div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar"><div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-yellow-500/20"><div><p className="text-sm font-bold text-white">{proyectoActivo.ownerEmail}</p><p className="text-[10px] text-yellow-500">Propietario</p></div><span className="text-xl">👑</span></div>{proyectoActivo.colaboradores?.map((colab, index) => (<div key={index} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded border border-gray-800"><div className="flex-1"><p className="text-sm font-bold text-white truncate w-40" title={colab.email}>{colab.email}</p><p className="text-[10px] text-gray-500">Agregado: {new Date(colab.fecha?.seconds * 1000).toLocaleDateString()}</p></div><div className="flex items-center gap-2"><select value={colab.rol} onChange={(e) => cambiarRolUsuario(colab.email, e.target.value)} className={`text-xs px-2 py-1 rounded outline-none border cursor-pointer ${colab.rol === 'editor' ? 'bg-blue-900/30 text-blue-400 border-blue-900' : 'bg-gray-800 text-gray-400 border-gray-700'}`}><option value="visor">👁️ Visor</option><option value="editor">✏️ Editor</option></select><button onClick={() => quitarUsuario(colab.email)} className="text-red-500 hover:bg-red-900/20 p-1.5 rounded transition-colors" title="Eliminar del proyecto">🗑️</button></div></div>))}{(!proyectoActivo.colaboradores || proyectoActivo.colaboradores.length === 0) && (<p className="text-center text-gray-600 text-xs py-4">No hay colaboradores aún.</p>)}</div><div className="mt-6 pt-4 border-t border-gray-800 text-center"><button onClick={() => { setModalGestionarEquipo(false); setModalCompartir(true); }} className="text-blue-400 text-sm hover:underline">+ Agregar nueva persona</button></div></div></div>)}
                {modalCompartir && (<div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center"><div className="bg-[#111] p-6 rounded-xl border border-blue-500/30 w-96 animate-slideUp"><h3 className="text-white font-bold mb-4 flex items-center gap-2"><span className="text-blue-500">👤</span> Invitar Colaborador</h3><p className="text-xs text-gray-400 mb-4 bg-gray-900 p-2 rounded border border-gray-700">Se generará un enlace de invitación.</p><label className="text-xs text-gray-500 uppercase font-bold">Correo</label><input autoFocus type="email" value={emailInvitado} onChange={e => setEmailInvitado(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-2 rounded mb-4 focus:border-blue-500 outline-none" placeholder="correo@ejemplo.com" /><label className="text-xs text-gray-500 uppercase font-bold">Permisos</label><select value={rolInvitado} onChange={e => setRolInvitado(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-2 rounded mb-6 focus:border-blue-500 outline-none"><option value="visor">👀 Visor</option><option value="editor">✏️ Editor</option></select><div className="flex justify-end gap-2"><button onClick={() => setModalCompartir(false)} className="text-gray-400 text-sm px-3">Cancelar</button><button onClick={handleInvitar} className="bg-blue-600 text-white font-bold px-4 py-1 rounded text-xs">Copiar Link</button></div></div></div>)}
                {creandoCarpetaModal && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"><form onSubmit={handleCrearCarpeta} className="bg-[#111] p-6 rounded-xl border border-yellow-500/30 w-80"><h3 className="text-white font-bold mb-4 text-sm">Nueva Carpeta</h3><input autoFocus value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} className="w-full bg-black border border-gray-700 text-white p-2 rounded mb-4 outline-none focus:border-yellow-500 text-sm" placeholder="Nombre..." /><div className="flex justify-end gap-2"><button type="button" onClick={() => setCreandoCarpetaModal(false)} className="text-gray-400 text-xs px-3">Cancelar</button><button type="submit" className="bg-yellow-600 text-black font-bold px-4 py-1 rounded text-xs">Crear</button></div></form></div>)}
                {modalMover && (<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={(e) => e.stopPropagation()}><div className="bg-[#111] p-6 rounded-xl border border-blue-500/30 w-96 animate-fadeIn"><h3 className="text-white font-bold mb-4">Mover a...</h3><select value={proyectoDestino} onChange={(e) => setProyectoDestino(e.target.value)} className="w-full bg-black border border-gray-700 text-white p-2 rounded mb-4 outline-none">{proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select><select value={carpetaDestinoId} onChange={(e) => setCarpetaDestinoId(e.target.value)} className="w-full bg-black border border-gray-700 text-white p-2 rounded mb-6 outline-none"><option value="">(Raíz)</option>{carpetasDestino.map(c => <option key={c.id} value={c.id}>📁 {c.nombre}</option>)}</select><div className="flex justify-end gap-2"><button onClick={() => setModalMover(false)} className="text-gray-400 text-sm px-3">Cancelar</button><button onClick={ejecutarMover} className="bg-blue-600 text-white font-bold px-4 py-1 rounded">Mover</button></div></div></div>)}
                {editandoProyectoModal && (<div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center backdrop-blur-sm" onClick={(e) => e.stopPropagation()}><div className="bg-[#111] p-8 rounded-xl border border-purple-500/30 w-full max-w-lg shadow-2xl animate-slideUp"><h3 className="text-white font-bold mb-6 text-xl flex items-center gap-2"><span className="text-purple-500">⚙️</span> Editar Proyecto</h3><form onSubmit={guardarEdicionProyecto} className="space-y-4"><div><label className="text-xs text-gray-500 uppercase font-bold">Nombre</label><input required value={editNombre} onChange={e => setEditNombre(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-purple-500" /></div><div><label className="text-xs text-gray-500 uppercase font-bold">Descripción</label><textarea value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-purple-500 h-24 resize-none" placeholder="Descripción..." /></div><div><label className="text-xs text-gray-500 uppercase font-bold">URL Repositorio</label><input type="url" value={editRepoUrl} onChange={e => setEditRepoUrl(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-blue-400 p-3 rounded mt-1 outline-none focus:border-blue-500 font-mono text-sm" placeholder="https://..." /></div><div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setEditandoProyectoModal(false)} className="text-gray-400 text-sm px-4 py-2 hover:text-white">Cancelar</button><button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded transition-colors">Guardar</button></div></form></div></div>)}
                {menuContextual.visible && (<div className="fixed bg-[#1a1a1a] border border-gray-700 rounded shadow-xl py-1 z-[60] w-48 animate-fadeIn" style={{ top: menuContextual.y, left: menuContextual.x }} onClick={(e) => e.stopPropagation()}>{menuContextual.tipo === 'proyecto' && (<><button onClick={abrirModalEdicion} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2">✏ Editar Información</button><div className="h-px bg-gray-700 my-1"></div></>)}{menuContextual.tipo === 'archivo' && !menuContextual.item.tipo && (<button onClick={abrirModalMover} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2">📦 Mover a...</button>)}<button onClick={enviarAPapelera} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-900/20 flex items-center gap-2">🗑️ Papelera</button></div>)}
<ProjectChat proyectoId={proyectoActivo.id} user={user} />            
            </div>
        );
    }

    // LISTA PRINCIPAL
    return (
        <div className="animate-fadeIn h-full flex flex-col overflow-y-auto pb-10 custom-scrollbar pr-2">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold text-green-400">/var/www/proyectos</h2><button onClick={() => { setNuevoNombre(""); setCreandoProyecto(true); }} className="bg-green-600 hover:bg-green-500 text-black font-bold px-4 py-2 rounded text-sm transition-transform hover:scale-105">+ PROYECTO</button></div>
            <h3 className="text-white font-bold mb-4 text-lg border-b border-gray-800 pb-2">Mis Proyectos</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">{misProyectos.map(p => (<div key={p.id} onClick={() => setProyectoActivo(p)} className="bg-[#0f0f0f] border border-white/5 p-6 rounded-xl hover:bg-[#151515] hover:border-purple-500/30 transition-all cursor-pointer group relative"><div onClick={(e) => abrirMenuContextual(e, p, 'proyecto')} className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all z-10">•••</div><div className="w-14 h-14 bg-purple-900/20 rounded-xl flex items-center justify-center text-3xl mb-4">🚀</div><h3 className="text-xl font-bold text-white mb-1">{p.nombre}</h3><p className="text-sm text-gray-500 line-clamp-2">{p.descripcion}</p></div>))}</div>
            {proyectosCompartidos.length > 0 && (<><h3 className="text-white font-bold mb-4 text-lg border-b border-gray-800 pb-2 flex items-center gap-2">Compartidos conmigo <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">{proyectosCompartidos.length}</span></h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{proyectosCompartidos.map(p => (<div key={p.id} onClick={() => setProyectoActivo(p)} className="bg-[#0a0a0a] border border-blue-900/20 p-6 rounded-xl hover:bg-[#111] hover:border-blue-500/50 transition-all cursor-pointer group relative"><div className="absolute top-2 right-2 text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{p.miRol === 'visor' ? '👁️ Visor' : '✏️ Editor'}</div><div className="w-14 h-14 bg-blue-900/10 rounded-xl flex items-center justify-center text-3xl mb-4">👥</div><h3 className="text-xl font-bold text-white mb-1">{p.nombre}</h3><p className="text-xs text-gray-500 mb-2">De: {p.ownerEmail}</p><p className="text-sm text-gray-400 line-clamp-2">{p.descripcion}</p></div>))}</div></>)}
            {creandoProyecto && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"><form onSubmit={handleCrearProyecto} className="bg-[#111] p-6 rounded-xl border border-green-500/30 w-96"><h3 className="text-white font-bold mb-4">Nombrar Proyecto</h3><input autoFocus value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} className="w-full bg-black border border-gray-700 text-white p-2 rounded mb-4 focus:border-green-500 outline-none" placeholder="Nombre..." /><div className="flex justify-end gap-2"><button type="button" onClick={() => setCreandoProyecto(false)} className="text-gray-400 text-sm px-3">Cancelar</button><button type="submit" className="bg-green-600 text-black font-bold px-4 py-1 rounded">Crear</button></div></form></div>)}
            {editandoProyectoModal && (<div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center backdrop-blur-sm" onClick={(e) => e.stopPropagation()}><div className="bg-[#111] p-8 rounded-xl border border-purple-500/30 w-full max-w-lg shadow-2xl animate-slideUp"><h3 className="text-white font-bold mb-6 text-xl flex items-center gap-2"><span className="text-purple-500">⚙️</span> Editar Proyecto</h3><form onSubmit={guardarEdicionProyecto} className="space-y-4"><div><label className="text-xs text-gray-500 uppercase font-bold">Nombre</label><input required value={editNombre} onChange={e => setEditNombre(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-purple-500" /></div><div><label className="text-xs text-gray-500 uppercase font-bold">Descripción</label><textarea value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-white p-3 rounded mt-1 outline-none focus:border-purple-500 h-24 resize-none" placeholder="Descripción..." /></div><div><label className="text-xs text-gray-500 uppercase font-bold">URL Repositorio</label><input type="url" value={editRepoUrl} onChange={e => setEditRepoUrl(e.target.value)} className="w-full bg-[#050505] border border-gray-700 text-blue-400 p-3 rounded mt-1 outline-none focus:border-blue-500 font-mono text-sm" placeholder="https://..." /></div><div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setEditandoProyectoModal(false)} className="text-gray-400 text-sm px-4 py-2 hover:text-white">Cancelar</button><button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded transition-colors">Guardar</button></div></form></div></div>)}
            {menuContextual.visible && (<div className="fixed bg-[#1a1a1a] border border-gray-700 rounded shadow-xl py-1 z-[60] w-48 animate-fadeIn" style={{ top: menuContextual.y, left: menuContextual.x }} onClick={(e) => e.stopPropagation()}>{menuContextual.tipo === 'proyecto' && (<><button onClick={abrirModalEdicion} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2">✏ Editar Información</button><div className="h-px bg-gray-700 my-1"></div></>)}{menuContextual.tipo === 'archivo' && !menuContextual.item.tipo && (<button onClick={abrirModalMover} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2">📦 Mover a...</button>)}<button onClick={enviarAPapelera} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-900/20 flex items-center gap-2">🗑️ Papelera</button></div>)}
        </div>
    );
}