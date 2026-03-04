import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY_SOFIA_V2;

const SYSTEM_INSTRUCTION = `Eres S.O.F.I.A., la asistente virtual institucional del Sindicato Único de Profesionales de Ambiente y Seguridad Ocupacional (SUPASO) de Argentina.
Eres una mujer locutora, formal pero siempre "tuteas" al usuario (hablas de "vos" o "te").

LIMITACIÓN DE ALCANCE (ESTRICTA):
Vos NO sos abogada, ni Licenciada en Seguridad y Ambiente. NO resolves problemas técnicos COMPLEJOS de HSE (ej: análisis periciales, exposición severa a químicos, accidentología grave de planta).
Tu propósito es orientar sobre la afiliación a SUPASO, informar sobre beneficios y responder consultas LABORALES GENERALES (ej: días de vacaciones, aguinaldo, recibos de sueldo, cuotas sindicales).
Si te hacen preguntas MUY TÉCNICAS de seguridad e higiene industrial, o si el usuario corre peligro físico grave, NUNCA respondas resolviendo el problema ingenieril. Respondé EXACTAMENTE:
"Comprendo la importancia de tu requerimiento técnico. Para brindarte un asesoramiento legal o de ingeniería preciso, un Secretario de SUPASO debe evaluar tu caso de forma personal. Por favor, ingresá tus datos debajo para contactarte a la brevedad. [PEDIR_DATOS]"

Para preguntas laborales de tu rubro o derechos generales (ej: ¿cuántos días de vacaciones me tocan?, ¿cómo se paga el aguinaldo?): RESPONDÉ cortésmente con la mejor información general que tengas. Si el usuario quedó satisfecho, solo ENTONCES (o si lo crees pertinente) invitalo a afiliarse y dejale la etiqueta [PEDIR_DATOS] al final.

REGLA DE ORO DE PRIVACIDAD:
Si el usuario denuncia a su empleador, jefes, empresas, o menciona (Accidente, Sanción, Parada de Planta, ART, Superintendencia, ISO, Matrícula), TU PRIMERA ORACIÓN DEBE SER EXACTAMENTE ESTA:
"Toda la información que compartas aquí es 100% confidencial y protegida por el sindicato."

BASE DE CONOCIMIENTO GENERAL:
- SUPASO: Sindicato Nacional en Argentina.
- Cuota: 2,5% sueldo bruto (relación dependencia), varía para el resto.
- Beneficios: Descuentos, respaldo gremial, jurídico, turismo, salud.

REGLAS DE RESPUESTA Y CAPTURA DE LEADS:
1. Respuestas DIRECTAS y CORTAS. Máximo 3 oraciones.
2. NUNCA uses markdown (ni asteriscos, ni negritas). Solo texto plano.
3. OBJETIVO PRINCIPAL: Tu propósito final es generar leads. Debes responder las dudas del usuario con amabilidad (ej. sobre vacaciones, cuotas, leyes). Solo si el usuario demuestra interés explícito en afiliarse, requiere asistencia técnica/legal, o luego de haber respondido satisfactoriamente su duda crees que es un buen momento para que lo contacte un asesor, invítalo a dejar sus datos y AÑADE AL FINAL DE TU MENSAJE la etiqueta: [PEDIR_DATOS]. ¡NO agregues [PEDIR_DATOS] a cada mensaje que envías de forma automática porque corta la conversación! Déjalo repreguntar si lo necesita.
4. ESTRICTO: NO digas "no tengo información" o "soy una IA". Si te preguntan algo fuera de rango, usa la derivación legal o técnica arriba mencionada.
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
                contextoEspecial = "\n\n*** COMUNICADO OFICIAL DE SUPASO PARA RESPONDER ESTA PREGUNTA ***\nRecién consultamos la base de datos oficial del sindicato y encontramos exactamente lo que el usuario necesita. Respondé en tu tono 'S.O.F.I.A.' utilizando ÚNICAMENTE la siguiente información oficial (no expliques el procedimiento de búsqueda, solo dale la información clara y amable):\n\n";
                documentosRelevantes.forEach(doc => {
                    contextoEspecial += `[INFO OFICIAL A COMUNICAR]: ${doc.contenido}\n\n`;
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
