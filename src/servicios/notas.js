/* src/servicios/notas.js */
import { db } from "../firebase";
import { 
    collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, onSnapshot 
} from "firebase/firestore";

// --- CREAR NOTA ---
export const crearNota = async (userId, titulo, contenido, etiqueta, proyectoId = null, carpetaId = null, cover = "") => {
    try {
        await addDoc(collection(db, "notas"), {
            userId,
            titulo,
            contenido,
            etiqueta: etiqueta || "General",
            proyectoId, 
            carpetaId,   
            cover: cover || "",
            fecha: new Date(),
            enPapelera: false
        });
        return true;
    } catch (e) {
        console.error("Error al crear:", e);
        return false;
    }
};

// --- OBTENER NOTAS (Para el Dashboard - Solo mis notas) ---
export const obtenerNotas = async (userId) => {
    const arr = [];
    try {
        const q = query(collection(db, "notas"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => arr.push({ ...doc.data(), id: doc.id }));
        return arr;
    } catch (error) { return []; }
};

// --- OBTENER NOTAS DE PROYECTO (¡ESTA ES LA QUE FALTABA!) ---
// Esta función es vital para la vista de proyectos compartidos
export const obtenerNotasDeProyecto = async (proyectoId) => {
    const arr = [];
    try {
        const q = query(collection(db, "notas"), where("proyectoId", "==", proyectoId));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => arr.push({ ...doc.data(), id: doc.id }));
        return arr;
    } catch (error) { 
        console.error("Error al obtener notas del proyecto:", error);
        return []; 
    }
};

// --- ACTUALIZAR CONTENIDO ---
export const actualizarNota = async (notaId, titulo, contenido, etiqueta, cover = "") => {
    try {
        const notaRef = doc(db, "notas", notaId);
        await updateDoc(notaRef, {
            titulo, 
            contenido, 
            etiqueta, 
            cover: cover || "", 
            fechaEdicion: new Date()
        });
        return true;
    } catch (error) {
        return false;
    }
};

// --- MOVER DE CARPETA ---
export const moverNota = async (notaId, nuevoProyectoId, nuevaCarpetaId) => {
    try {
        const notaRef = doc(db, "notas", notaId);
        await updateDoc(notaRef, { proyectoId: nuevoProyectoId, carpetaId: nuevaCarpetaId || null });
        return true;
    } catch (error) { return false; }
};

// --- PAPELERA ---
export const moverNotaAPapelera = async (notaId, estado = true) => {
    try {
        const notaRef = doc(db, "notas", notaId);
        await updateDoc(notaRef, { enPapelera: estado }); 
        return true;
    } catch (error) { return false; }
};

export const eliminarNotaFisicamente = async (notaId) => {
    try {
        await deleteDoc(doc(db, "notas", notaId));
        return true;
    } catch (error) { return false; }
};

// --- NUEVO: ESCUCHAR CAMBIOS EN VIVO DE UNA NOTA ---
export const suscribirNota = (notaId, callback) => {
    if (!notaId) return;
    
    // onSnapshot se queda escuchando cambios en la BD
    const unsubscribe = onSnapshot(doc(db, "notas", notaId), (doc) => {
        if (doc.exists()) {
            // Cuando algo cambia, ejecutamos el 'callback' con los nuevos datos
            callback({ ...doc.data(), id: doc.id });
        }
    });

    // Devolvemos la función para desconectarse (para no dejar zombies escuchando)
    return unsubscribe;
};