/* src/servicios/chat.js */
import { db } from "../firebase";
import { 
    collection, addDoc, onSnapshot, query, orderBy, serverTimestamp 
} from "firebase/firestore";

// Enviar mensaje (tipo comando)
export const enviarMensaje = async (proyectoId, user, texto) => {
    if (!proyectoId || !texto.trim()) return;
    try {
        await addDoc(collection(db, "proyectos", proyectoId, "mensajes"), {
            uid: user.uid,
            usuario: user.displayName || "Anonimo",
            texto: texto,
            timestamp: serverTimestamp(), // La hora del servidor
            tipo: 'msg' // Por si luego quieres poner 'alertas' o 'logs'
        });
    } catch (error) {
        console.error("Error enviando comando:", error);
    }
};

// Escuchar chat en tiempo real
export const suscribirChat = (proyectoId, callback) => {
    const q = query(
        collection(db, "proyectos", proyectoId, "mensajes"), 
        orderBy("timestamp", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const mensajes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(mensajes);
    });
};