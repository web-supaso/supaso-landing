import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY_SOFIA_V2;

const SYSTEM_INSTRUCTION = `Eres S.O.F.I.A., la asistente virtual oficial del Sindicato Único de Profesionales de Ambiente y Seguridad Ocupacional (SUPASO) de Argentina.
Eres una mujer locutora en tono institucional, formal pero siempre "tuteas" al usuario (hablas de "vos" o "te").

REGLA DE ORO DE PRIVACIDAD:
Si el usuario denuncia a su empleador, jefes, empresas, o menciona (Accidente, Sanción, Parada de Planta, ART, Superintendencia, ISO, Matrícula), TU PRIMERA ORACIÓN DEBE SER EXACTAMENTE ESTA:
"Toda la información que compartas aquí es 100% confidencial y protegida por el sindicato."

BASE DE CONOCIMIENTO GENERAL:
- SUPASO: Sindicato Nacional en Argentina.
- Cuota: 2,5% sueldo bruto (relación dependencia), varía para el resto.
- Beneficios: Descuentos, legales, turismo, salud.
- Textos legales: No transcribas leyes enormes, diles que las encontrarán en la sección Legislación de la web.

REGLAS DE RESPUESTA:
1. Respuestas DIRECTAS y CORTAS. Máximo 4 oraciones.
2. NUNCA uses markdown (ni asteriscos, ni negritas). Solo texto plano.
3. ESTRICTO: NO cortes las respuestas por la mitad. NO digas "no tengo información", "soy una IA", "no encuentro". Si te preguntan algo fuera de tu base de conocimiento, o te piden un dato muy puntual que no sabes, responde EXACTA y ÚNICAMENTE de esta manera: "Para brindarte una respuesta certera y acorde a las leyes vigentes, nuestro equipo de legales debe evaluar tu caso de forma personalizada. Por favor, indicá tus datos debajo para que un Secretario de SUPASO se contacte con vos a la brevedad." y SIEMPRE agrega la etiqueta final: [PEDIR_DATOS]
`;

import { supabase } from "./supabaseClient";

export async function askGemini(chatHistory, newText) {
    if (!apiKey) return "Disculpa, ha ocurrido un error de conexión con la inteligencia central de SUPASO. [PEDIR_DATOS]";

    try {
        const newTextCleaned = newText.replace(/\bsu paso\b/gi, "SUPASO").replace(/\bsu pazo\b/gi, "SUPASO");
        const userTextoLimpio = newTextCleaned.toLowerCase();

        // 1. Fase RAG (Búsqueda en Cerebro Supabase)
        // Traemos todo de la tabla porque por ahora son pocos registros.
        // Después, con más de 100 registros, usaríamos vectores pgvector.
        const { data: knowledge, error: kError } = await supabase
            .from("sofia_knowledge")
            .select("tema, palabras_claves, contenido");

        let contextoEspecial = "";

        if (!kError && knowledge && knowledge.length > 0) {
            // Buscamos si alguna palabra clave de la base coincide con lo que tipeó el usuario
            const documentosRelevantes = knowledge.filter(doc => {
                const keywords = doc.palabras_claves.split(",").map(k => k.trim().toLowerCase());
                return keywords.some(k => userTextoLimpio.includes(k) && k.length > 3);
            });

            if (documentosRelevantes.length > 0) {
                contextoEspecial = "\n\n*** DIRECTIVA ABSOLUTA: EL USUARIO ESTÁ PREGUNTANDO ALGO QUE TENEMOS EN LA BASE OFICIAL DE LA INSTITUCIÓN. RESPONDE EXCLUSIVAMENTE CON LA SIGUIENTE INFO (puedes ser breve y no transcribir todo, pero contesta usando esto): ***\n\n";
                documentosRelevantes.forEach(doc => {
                    contextoEspecial += `TEMA: ${doc.tema}\nTEXTO: ${doc.contenido}\n\n`;
                });
            }
        }

        const currentSystemInstruction = SYSTEM_INSTRUCTION + contextoEspecial;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: currentSystemInstruction,
            generationConfig: {
                temperature: 0.15, // Mantenerlo bajo 0.15 para que sea estricto con las leyes
                maxOutputTokens: 600,
            }
        });

        // Combinar el historial anterior en texto plano para que Gemini tenga contexto sin romper 
        // la regla estricta de Google de "alternancia de roles" (user->model->user).
        const historyText = chatHistory.slice(-8).map(msg => {
            const label = msg.from === "bot" ? "S.O.F.I.A:" : "Usuario:";
            return `${label} ${msg.text.replace(/\[PEDIR_DATOS\]/g, "").trim()}`;
        }).join("\n");

        const prompt = `HISTORIAL DE LA CONVERSACIÓN:\n${historyText}\n\nUsuario dice: ${newText}`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Disculpa la demora, tuve un problema validando la directiva de seguridad. Para no perder más tiempo y resolver tu consulta sin demoras, dejame exactamente tu nombre y teléfono para contactarnos de forma personal. [PEDIR_DATOS]";
    }
}
