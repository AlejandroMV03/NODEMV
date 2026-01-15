/* src/servicios/historial.js */
import { db } from "../firebase";
import { 
    collection, addDoc, onSnapshot, query, orderBy, serverTimestamp 
} from "firebase/firestore";

// 1. Guardar una nueva versión (Commit)
// AÑADIMOS EL PARÁMETRO 'nombreVersion' OPCIONAL
export const guardarVersion = async (notaId, titulo, contenido, usuario, nombreVersion = "Punto de control") => {
    if (!notaId || !usuario) return;
    try {
        await addDoc(collection(db, "notas", notaId, "versiones"), {
            titulo,
            contenido,
            editor: usuario.displayName || "Alguien",
            uid: usuario.uid,
            versionNombre: nombreVersion, // Guardamos la etiqueta (Ej: "Salida", "20 min")
            fecha: serverTimestamp() 
        });
        console.log(`Historial guardado: ${nombreVersion}`);
    } catch (e) {
        console.error("Error guardando versión:", e);
    }
};

// 2. Escuchar el historial
export const suscribirHistorial = (notaId, callback) => {
    if (!notaId) return;
    
    const q = query(
        collection(db, "notas", notaId, "versiones"), 
        orderBy("fecha", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const versiones = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(versiones);
    });
};