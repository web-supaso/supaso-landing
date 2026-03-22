import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY_SOFIA_V2;

const SYSTEM_INSTRUCTION = `Eres S.O.F.I.A., una asistente virtual empática, dulce y servicial de SUPASO.Tu tono es formal, profesional y usas el 'vos' rioplatense(sin jerga ni lunfardo).

TU OBJETIVO: Resolver dudas de forma amable. Aunque el usuario diga que no tiene más dudas o se despida, tu misión es obtener sus datos para que un asesor humano le dé la bienvenida oficial. Siempre debés cerrar pidiendo nombre y teléfono con la etiqueta: [PEDIR_DATOS].

LIMITACIÓN DE ALCANCE:
Orientá sobre afiliación, beneficios y consultas LABORALES generales. 
Si el usuario se despide o dice "gracias" o "nada más", respondé:
"Ha sido un verdadero placer asistirte. Para que podamos mantener este canal de comunicación abierto y un asesor de SUPASO te brinde una bienvenida formal, por favor déjanos tu contacto. [PEDIR_DATOS]"

REGLA DE PRIVACIDAD: Si mencionan accidentes, sanciones o ART, iniciá con: "Toda la información que compartas aquí es 100% confidencial y protegida por el sindicato."

REGLAS DE RESPUESTA:
1. Sé concisa(máx 3 oraciones).
2. Priorizá responder la duda.Solo añade[PEDIR_DATOS] si el usuario lo solicita explícitamente o si la complejidad excede tu capacidad de respuesta automática.
3. No uses markdown(negritas, listas, etc.).`;


import { supabase } from "./supabaseClient";

const genAI = new GoogleGenerativeAI(apiKey);

export async function askGemini(chatHistory, newText) {
    if (!apiKey) return "Disculpa, ha ocurrido un error de conexión con la inteligencia central de SUPASO. [PEDIR_DATOS]";

    const newTextCleaned = newText.replace(/\bsu paso\b/gi, "SUPASO").replace(/\bsu pazo\b/gi, "SUPASO");
    const userTextoLimpio = newTextCleaned.toLowerCase();

    // 1. Fase RAG (Búsqueda en Cerebro Supabase)
    let contextoEspecial = "";
    try {
        const { data: knowledge, error: kError } = await supabase
            .from("sofia_knowledge")
            .select("tema, palabras_claves, contenido");

        if (!kError && knowledge && knowledge.length > 0) {
            const documentosRelevantes = knowledge.filter(doc => {
                const keywords = doc.palabras_claves.split(",").map(k => k.trim().toLowerCase());
                return keywords.some(k => userTextoLimpio.includes(k));
            });
            if (documentosRelevantes.length > 0) {
                contextoEspecial = "\n\n*** COMUNICADO OFICIAL DE SUPASO ***\n";
                documentosRelevantes.forEach(doc => {
                    contextoEspecial += `[INFO]: ${doc.contenido} \n`;
                });
            }
        }
    } catch (ragErr) {
        console.error("RAG Error:", ragErr);
    }

    const currentSystemInstruction = SYSTEM_INSTRUCTION + contextoEspecial;

    // Historial compacto
    const historyText = chatHistory.slice(-5).map(msg => {
        const label = msg.from === "bot" ? "S.O.F.I.A:" : "Usuario:";
        return `${label} ${msg.text.slice(0, 300)} `;
    }).join("\n");

    const prompt = `INSTRUCCIONES DEL SISTEMA: \n${currentSystemInstruction} \n\nHISTORIAL DE LA CONVERSACIÓN: \n${historyText} \n\nUsuario dice: ${newText} `;

    // Configuración común
    const baseConfig = {
        systemInstruction: currentSystemInstruction,
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ]
    };

    // INTENTO 1: Gemini 3.1 Pro Preview (Estado del arte)
    try {
        console.log("Intentando con Gemini 3.1 Pro Preview...");
        const model = genAI.getGenerativeModel({ ...baseConfig, model: "gemini-3.1-pro-preview" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.warn("Gemini 3.1 Pro falló o está saturado:", error.message);

        // Si es un error de cuota (429) o saturación, intentamos el fallback automático a 3.1 Flash-Lite
        if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("503")) {
            try {
                console.log("Iniciando Fallback automático a Gemini 3.1 Flash-Lite (Más rápido y eficiente)...");
                const fallbackModel = genAI.getGenerativeModel({ ...baseConfig, model: "gemini-3.1-flash-lite-preview" });
                const result = await fallbackModel.generateContent(prompt);
                return result.response.text();
            } catch (fallbackError) {
                console.error("Fallo definitivo con Gemini 3.1:", fallbackError);
            }
        }

        // Si falló por otra cosa o el fallback también falló
        return "Disculpa la demora, tuve un problema validando la directiva de seguridad. Para no perder más tiempo y resolver tu consulta sin demoras, dejame exactamente tu nombre y teléfono para contactarnos de forma personal. [PEDIR_DATOS]";
    }
}
