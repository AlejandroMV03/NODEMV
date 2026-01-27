/* src/servicios/proyectos.js */
import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, arrayUnion, getDoc, onSnapshot } from "firebase/firestore";

// --- CREAR PROYECTO (Preparamos para compartir) ---
export const crearProyecto = async (userId, emailOwner, nombre, descripcion) => {
    try {
        await addDoc(collection(db, "proyectos"), {
            userId, // Dueño (ID)
            ownerEmail: emailOwner, // Dueño (Email) para mostrar
            nombre,
            descripcion: descripcion || "Sin descripción",
            fechaCreacion: new Date(),
            status: 'active',
            enPapelera: false,
            // AQUÍ LA MAGIA: Arrays para búsquedas rápidas
            accesos: [emailOwner], // Lista simple de emails que tienen acceso (dueño + invitados)
            colaboradores: [] // Lista detallada: { email, rol: 'editor'|'visor' }
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const actualizarTarea = async (tareaId, nuevosDatos) => {
    try {
        const tareaRef = doc(db, "tareas", tareaId);
        await updateDoc(tareaRef, {
            ...nuevosDatos,
            fechaEdicion: new Date() // Opcional: registrar cuándo se editó
        });
        return true;
    } catch (e) {
        console.error("Error al actualizar tarea:", e);
        return false;
    }
};

// --- OBTENER PROYECTOS (Míos + Compartidos) ---
export const obtenerProyectos = async (userId, userEmail) => {
    const proyectosMap = new Map(); // Usamos un Map para evitar duplicados

    try {
        // 1. BUSQUEDA TIPO A: "Mis Proyectos Originales"
        // Busca por ID de usuario (Esto recupera tu proyecto perdido)
        const q1 = query(collection(db, "proyectos"), where("userId", "==", userId));
        const snapshot1 = await getDocs(q1);
        
        snapshot1.forEach(doc => {
            const data = doc.data();
            // Si soy el dueño por ID, mi rol es 'owner' automáticamente
            proyectosMap.set(doc.id, { ...data, id: doc.id, miRol: 'owner' });
        });

        // 2. BUSQUEDA TIPO B: "Proyectos Compartidos Conmigo"
        // Busca por lista de emails (Esto recupera las colaboraciones nuevas)
        // Solo ejecutamos esto si tenemos email, por seguridad
        if (userEmail) {
            const q2 = query(collection(db, "proyectos"), where("accesos", "array-contains", userEmail));
            const snapshot2 = await getDocs(q2);
            
            snapshot2.forEach(doc => {
                const data = doc.data();
                
                // Calculamos el rol
                let miRol = 'owner';
                if (data.userId !== userId) {
                    const colaborador = data.colaboradores?.find(c => c.email === userEmail);
                    miRol = colaborador ? colaborador.rol : 'visor';
                }

                // Guardamos en el mapa (si ya estaba el proyecto por la búsqueda 1, esto lo sobrescribe/actualiza)
                proyectosMap.set(doc.id, { ...data, id: doc.id, miRol });
            });
        }

        // Convertimos el Map a Array para devolverlo
        return Array.from(proyectosMap.values());

    } catch (error) {
        console.error("Error al obtener proyectos:", error);
        return [];
    }
};

// --- INVITAR COLABORADOR ---
export const agregarColaborador = async (proyectoId, emailColaborador, rol) => {
    try {
        const proyectoRef = doc(db, "proyectos", proyectoId);
        
        // 1. Agregamos al array detallado (para saber el rol)
        await updateDoc(proyectoRef, {
            colaboradores: arrayUnion({ email: emailColaborador, rol: rol, fecha: new Date() }),
            // 2. Agregamos al array simple (para que le aparezca en su lista)
            accesos: arrayUnion(emailColaborador) 
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

// --- ACTUALIZAR PROYECTO ---
export const actualizarProyecto = async (proyectoId, nuevosDatos) => {
    try {
        const proyectoRef = doc(db, "proyectos", proyectoId);
        await updateDoc(proyectoRef, nuevosDatos); 
        return true;
    } catch (e) {
        return false;
    }
};

// --- CARPETAS ---
export const crearCarpeta = async (proyectoId, nombre, carpetaPadreId = null) => {
    try {
        await addDoc(collection(db, "carpetas"), {
            proyectoId, nombre, carpetaPadreId, tipo: 'folder', enPapelera: false, fechaCreacion: new Date()
        });
        return true;
    } catch (e) { return false; }
};

export const obtenerCarpetas = async (proyectoId, carpetaPadreId = null) => {
    const arr = [];
    try {
        const q = query(collection(db, "carpetas"), where("proyectoId", "==", proyectoId), where("carpetaPadreId", "==", carpetaPadreId));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => arr.push({ ...doc.data(), id: doc.id }));
        return arr;
    } catch (error) { return []; }
};

// --- TAREAS ---
export const crearTarea = async (proyectoId, titulo, descripcion, fechaVencimiento, prioridad, asignadoA) => {
    try {
        await addDoc(collection(db, "tareas"), {
            proyectoId, titulo, descripcion: descripcion||"", fechaVencimiento: fechaVencimiento||"", prioridad: prioridad||"media", asignadoA: asignadoA||"Sin asignar", estado: 'todo', fechaCreacion: new Date()
        });
        return true;
    } catch (e) { return false; }
};

export const obtenerTareas = async (proyectoId) => {
    const arr = [];
    try {
        const q = query(collection(db, "tareas"), where("proyectoId", "==", proyectoId));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => arr.push({ ...doc.data(), id: doc.id }));
        return arr;
    } catch (error) { return []; }
};

export const moverTarea = async (tareaId, nuevoEstado) => {
    try {
        const ref = doc(db, "tareas", tareaId);
        await updateDoc(ref, { estado: nuevoEstado });
        return true;
    } catch (e) { return false; }
};

// --- PAPELERA ---
export const moverItemAPapelera = async (coleccion, id, estado = true) => {
    try {
        const ref = doc(db, coleccion, id);
        await updateDoc(ref, { enPapelera: estado });
        return true;
    } catch (e) { return false; }
};

export const eliminarItemFisicamente = async (coleccion, id) => {
    try { await deleteDoc(doc(db, coleccion, id)); return true; } catch (e) { return false; }
};
// 1. ACTUALIZAR ROL
export const actualizarRolColaborador = async (proyectoId, emailColaborador, nuevoRol) => {
    try {
        const proyectoRef = doc(db, "proyectos", proyectoId);
        const snapshot = await getDoc(proyectoRef);
        
        if (snapshot.exists()) {
            const data = snapshot.data();
            const colaboradores = data.colaboradores || [];

            // Creamos una nueva lista modificando solo al usuario específico
            const nuevosColaboradores = colaboradores.map(c => {
                if (c.email === emailColaborador) {
                    return { ...c, rol: nuevoRol }; // Actualizamos su rol
                }
                return c;
            });

            await updateDoc(proyectoRef, { colaboradores: nuevosColaboradores });
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error al actualizar rol:", e);
        return false;
    }
};

// 2. ELIMINAR COLABORADOR
export const eliminarColaborador = async (proyectoId, emailColaborador) => {
    try {
        const proyectoRef = doc(db, "proyectos", proyectoId);
        const snapshot = await getDoc(proyectoRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            // Filtramos para quitar al usuario
            const nuevosColaboradores = data.colaboradores.filter(c => c.email !== emailColaborador);
            // También lo quitamos de la lista de acceso rápido 'accesos'
            const nuevosAccesos = data.accesos.filter(email => email !== emailColaborador);

            await updateDoc(proyectoRef, { 
                colaboradores: nuevosColaboradores,
                accesos: nuevosAccesos
            });
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error al eliminar colaborador:", e);
        return false;
    }
};
export const suscribirProyecto = (proyectoId, callback) => {
    if (!proyectoId) return;

    // Escuchamos el documento del proyecto específico
    const unsubscribe = onSnapshot(doc(db, "proyectos", proyectoId), (docSnap) => {
        if (docSnap.exists()) {
            // Devolvemos los datos frescos
            callback({ ...docSnap.data(), id: docSnap.id });
        } else {
            // Si el documento desapareció (lo borraron), devolvemos null
            callback(null);
        }
    });

    return unsubscribe;
};