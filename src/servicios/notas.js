/* src/servicios/notas.js */
import { db } from "../firebase";
import { 
    collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, onSnapshot, setDoc, serverTimestamp 
} from "firebase/firestore";

// --- CREAR NOTA (CORREGIDO: AHORA DEVUELVE EL ID) ---
export const crearNota = async (userId, titulo, contenido, etiqueta, proyectoId = null, carpetaId = null, cover = "") => {
    try {
        const docRef = await addDoc(collection(db, "notas"), {
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
        return docRef.id; // <--- ¡ESTO ES LO IMPORTANTE! Devolvemos el ID
    } catch (e) {
        console.error("Error al crear:", e);
        return null;
    }
};

// --- OBTENER NOTAS ---
export const obtenerNotas = async (userId) => {
    const arr = [];
    try {
        const q = query(collection(db, "notas"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => arr.push({ ...doc.data(), id: doc.id }));
        return arr;
    } catch (error) { return []; }
};

// --- OBTENER NOTAS DE PROYECTO ---
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

// --- ESCUCHAR CAMBIOS EN VIVO ---
export const suscribirNota = (notaId, callback) => {
    if (!notaId) return;
    
    const unsubscribe = onSnapshot(doc(db, "notas", notaId), (doc) => {
        if (doc.exists()) {
            callback({ ...doc.data(), id: doc.id });
        }
    });

    return unsubscribe;
};

export const registrarPresencia = async (notaId, user) => {
    if (!notaId || !user) return;
    try {
        const presenciaRef = doc(db, "notas", notaId, "presencia", user.uid);
        await setDoc(presenciaRef, {
            uid: user.uid,
            displayName: user.displayName || "Anónimo",
            photoURL: user.photoURL || "",
            email: user.email,
            color: '#' + Math.floor(Math.random()*16777215).toString(16), // Color aleatorio
            conectado: serverTimestamp()
        });
    } catch (e) { console.error("Error al registrar presencia:", e); }
};

// 2. Avisar que me fui
export const retirarPresencia = async (notaId, userId) => {
    if (!notaId || !userId) return;
    try {
        await deleteDoc(doc(db, "notas", notaId, "presencia", userId));
    } catch (e) { console.error("Error al retirar presencia:", e); }
};

// 3. Ver quiénes están (Escucha en tiempo real)
export const suscribirPresencia = (notaId, callback) => {
    if (!notaId) return;
    const q = collection(db, "notas", notaId, "presencia");
    return onSnapshot(q, (snapshot) => {
        const usuarios = [];
        snapshot.forEach(doc => usuarios.push(doc.data()));
        callback(usuarios);
    });
};