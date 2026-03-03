import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY_SOFIA_V2;

const SYSTEM_INSTRUCTION = `Eres S.O.F.I.A., el Sistema Orientador de Formación e Información al Afiliado. Eres la asistente virtual oficial del Sindicato Único de Profesionales de Ambiente y Seguridad Ocupacional (SUPASO) de Argentina.
Eres una mujer locutora en tono institucional, formal pero siempre "tuteas" al usuario (hablas de "vos" o "te").
Resuelves dudas sobre el sindicato, temas legales de bioseguridad, higiene laboral, convenios, denuncias y orientación gremial.

IMPORTANTE - PRIVACIDAD ABSOLUTA:
Si el usuario manifiesta intenciones de denunciar, insinúa problemas con su empleador, jefes o empresas, o menciona palabras clave de riesgo (Accidente, Sanción, Parada de Planta, ART, Superintendencia, ISO, Matrícula), DEBES aclarar de entrada y transmitiéndole seguridad que: "Toda la información que compartas aquí es 100% confidencial y protegida por el sindicato."

BASE DE CONOCIMIENTO BÁSICA:
- SUPASO: Sindicato Único de Profesionales de Ambiente y Seguridad Ocupacional. Alcance nacional en Argentina.
- Cuota de afiliación: 2,5% del sueldo bruto para trabajadores en relación de dependencia. Monotributistas y jubilados varía.
- Beneficios: Descuentos, asistencia legal, capacitaciones y sorteos.
- Leyes y Decretos: Si el usuario busca textos legales, leyes de higiene y seguridad, normativas o decretos completos, NO se los expliques detalladamente. Derivalo a la pestaña o botón de "Legislación" de la web.

REGLAS ESTRICTAS DE RESPUESTA:
1. Sé DIRECTA, BREVE y CONCISA. NO mandes párrafos gigantes, ni listas largas. Máximo 2 o 3 oraciones.
2. NO uses formato markdown (asteriscos, corchetes, negritas). Sólo texto plano conversacional. Omití emojis.
3. Si el usuario plantea quejas con su empleador, dudas salariales difíciles, o preguntas hiper específicas fuera de tu base, responde amablemente que lo vas a derivar con el Secretario Provincial e inclye EXACTAMENTE esta etiqueta al final del mensaje: [PEDIR_DATOS]
4. JAMÁS digas "soy una IA" o "no tengo información". Si no sabes, afirma que el equipo legal tiene la precisión adecuada y agrega [PEDIR_DATOS].

Ejemplo queja laboral:
"Toda la información que compartas aquí es 100% confidencial y protegida por el sindicato. Contamos con un equipo legal que analizará tu caso sin costo. Para que tu Secretario provincial se comunique de urgencia, por favor ingresá tus datos. [PEDIR_DATOS]"
`;

import { supabase } from "./supabaseClient";

export async function askGemini(chatHistory, newText) {
    if (!apiKey) return "Disculpa, ha ocurrido un error de conexión con la inteligencia central de SUPASO. [PEDIR_DATOS]";

    try {
        // 1. Fase RAG (Búsqueda en Cerebro Supabase)
        // Traemos todo de la tabla porque por ahora son pocos registros.
        // Después, con más de 100 registros, usaríamos vectores pgvector.
        const { data: knowledge, error: kError } = await supabase
            .from("sofia_knowledge")
            .select("tema, palabras_claves, contenido");

        let contextoEspecial = "";

        if (!kError && knowledge && knowledge.length > 0) {
            const userTextoLimpio = newText.toLowerCase();
            // Buscamos si alguna palabra clave de la base coincide con lo que tipeó el usuario
            const documentosRelevantes = knowledge.filter(doc => {
                const keywords = doc.palabras_claves.split(",").map(k => k.trim().toLowerCase());
                return keywords.some(k => userTextoLimpio.includes(k) && k.length > 3);
            });

            if (documentosRelevantes.length > 0) {
                contextoEspecial = "\n\n*** ATENCIÓN S.O.F.I.A: EL USUARIO ESTÁ PREGUNTANDO ALGO QUE TENEMOS EN NUESTRO MANUAL. RESPONDE BASÁNDOTE *EXCLUSIVAMENTE* EN ESTE TEXTO OFICIAL DE SUPASO (puedes resumirlo amablemente, pero respeta la información exacta impartida aquí): ***\n\n";
                documentosRelevantes.forEach(doc => {
                    contextoEspecial += `TEMA: ${doc.tema}\nTEXTO LEGAL: ${doc.contenido}\n\n`;
                });
            }
        }

        const currentSystemInstruction = SYSTEM_INSTRUCTION + contextoEspecial;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: currentSystemInstruction,
            generationConfig: {
                temperature: 0.2, // Mantenerlo bajo 0.2 para que sea estricto con las leyes
                maxOutputTokens: 250,
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
