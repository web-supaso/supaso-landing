// src/components/Sofia.jsx
// S.O.F.I.A. — Sistema Orientador de Formación e Información al Afiliado
// Web Speech API (síntesis + reconocimiento), tooltip proactivo, Supabase lead capture
// NOTA: Make.com se conecta a la tabla `leads_sofia` en Supabase para disparar
// el flujo de bienvenida y acompañamiento vía WhatsApp de forma automática.

import { useState, useRef, useEffect, useCallback } from "react";
import {
    MessageSquare, X, Send, Phone, CheckCircle2, Bot,
    ChevronRight, Mic, MicOff, Volume2, VolumeX,
} from "lucide-react";
import { insertLead } from "../lib/supabaseClient";

// ─── Mensaje de bienvenida (síntesis + chat) ─────────────────────────────────
// WELCOME_TEXT: SUPASO se escribe con mayúsculas en pantalla pero como
// "Supaso" en el texto hablado para que el TTS lo lea como nombre propio.
const WELCOME_TEXT =
    "Hola, soy Sofía, el Sistema Orientador de Formación e Información al Afiliado de Supaso. ¿En qué te puedo ayudar hoy? ¿Querés iniciar tu proceso de afiliación?";

const INITIAL_MESSAGES = [
    {
        id: 0,
        from: "bot",
        text: "👋 Hola, soy Sofía — el Sistema Orientador de Formación e Información al Afiliado de SUPASO.",
    },
    {
        id: 1,
        from: "bot",
        text: "Estoy aquí para guiarte. ¿Sos profesional de Seguridad Ocupacional, Ambiente o Calidad? Te ayudo a iniciar tu afiliación. 🛡️",
    },
];

// ─── Helper: normaliza texto para TTS ────────────────────────────────────────
// Convierte siglas en mayúsculas a forma pronunciable para el motor TTS.
// "SUPASO" → "Supaso" (nombre propio, no deletreado)
function toSpoken(text) {
    return text
        .replace(/\bSUPASO\b/g, "Supaso")
        .replace(/\bS\.O\.F\.I\.A\.\b/g, "Sofía")
        .replace(/\bSRT\b/g, "S R T")
        .replace(/\bQR\b/g, "código Q R");
}

// ─── Síntesis de voz — voz femenina latinoamericana ──────────────────────────
// Prioridad: es-AR femenina → es-US femenina → es-MX femenina
// → cualquier voz latina → excluye es-ES (acento de España)
function speak(rawText, onEnd) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const text = toSpoken(rawText);
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.94;
    utter.pitch = 1.2;   // Tono más alto → voz femenina
    utter.volume = 1;

    const LATAM_LANGS = ["es-AR", "es-US", "es-MX", "es-CL", "es-CO", "es-419"];
    const FEMALE_PATTERN = /female|woman|femenin|paulina|mónica|monica|luciana|valentina|camila|sofía|sofia|maria|renata|conchita/i;

    const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        let chosen = null;

        // 1. Nombres explícitos de voces femeninas dulces latinas o preferidas
        const PREFERRED_NAMES = [
            "google español de estados", // Google Español de EEUU (femenina, natural, latino)
            "sabina",                    // Microsoft Sabina (es-MX)
            "paulina",                   // Paulina (es-MX / Apple)
            "luciana",                   // Luciana
            "google español",            // Google Español (femenina por defecto en Chrome)
            "mónica", "monica",          // Mónica (es-ES / Apple)
            "helena",                    // Microsoft Helena (es-ES) 
        ];

        for (const name of PREFERRED_NAMES) {
            chosen = voices.find(v => v.name.toLowerCase().includes(name));
            if (chosen) break;
        }

        // 2. Si no encontró ninguna de las explícitas, buscar usando patrones rigurosos excluyendo masculinas
        if (!chosen) {
            const MALE_NAMES = /male|man|masculino|tomas|tomás|raul|raúl|pablo|jorge|diego|carlos/i;
            const FEMALE_PATTERN = /female|woman|femenin|paulina|mónica|monica|luciana|valentina|camila|sofía|sofia|maria|renata|conchita|helena|sabina/i;
            const LATAM_LANGS = ["es-AR", "es-US", "es-MX", "es-CO", "es-CL", "es-419"];

            // 2a. Mujer latina explícita
            chosen = voices.find(
                (v) => LATAM_LANGS.includes(v.lang) && FEMALE_PATTERN.test(v.name) && !MALE_NAMES.test(v.name)
            );

            // 2b. Cualquier mujer en español
            if (!chosen) {
                chosen = voices.find(
                    (v) => v.lang.startsWith("es") && FEMALE_PATTERN.test(v.name) && !MALE_NAMES.test(v.name)
                );
            }

            // 2c. Algún latinoamericano que no tenga nombre de varón explícito
            if (!chosen) {
                chosen = voices.find(
                    (v) => LATAM_LANGS.includes(v.lang) && !MALE_NAMES.test(v.name)
                );
            }

            // 2d. Algún español que no sea varón
            if (!chosen) {
                chosen = voices.find((v) => v.lang.startsWith("es") && !MALE_NAMES.test(v.name));
            }

            // 2e. Último absoluto: cualquier español
            if (!chosen) {
                chosen = voices.find((v) => v.lang.startsWith("es"));
            }
        }

        if (chosen) {
            utter.voice = chosen;
            utter.lang = chosen.lang;
        } else {
            utter.lang = "es-AR";
        }

        if (onEnd) utter.onend = onEnd;
        window.speechSynthesis.speak(utter);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
        trySpeak();
    } else {
        window.speechSynthesis.addEventListener("voiceschanged", trySpeak, { once: true });
    }
}

// ─── Hook: reconocimiento de voz ──────────────────────────────────────────────
function useSpeechRecognition({ onResult, onError }) {
    const recognitionRef = useRef(null);
    const [isListening, setIsListening] = useState(false);

    const startListening = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            onError?.("Tu navegador no soporta reconocimiento de voz.");
            return;
        }
        const rec = new SR();
        rec.lang = "es-AR";
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onerror = (e) => {
            setIsListening(false);
            if (e.error === "network") {
                onError?.("Error de red con el servicio de voz. (Chrome/Edge recomendados)");
            } else if (e.error === "not-allowed" || e.error === "service-not-allowed") {
                onError?.("Por favor, permite el acceso al micrófono en tu navegador.");
            } else if (e.error !== "no-speech") {
                onError?.("Error de micrófono: " + e.error);
            }
        };
        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            onResult?.(transcript);
        };

        recognitionRef.current = rec;
        rec.start();
    }, [onResult, onError]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    return { isListening, startListening, stopListening };
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Sofia() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState("chat"); // 'chat' | 'form' | 'success'
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechError, setSpeechError] = useState(null);
    const [hasSpoken, setHasSpoken] = useState(false); // primer open
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipDismissed, setTooltipDismissed] = useState(false);
    const chatEndRef = useRef(null);
    const whatsappRef = useRef(null);

    // ── Auto-scroll a último mensaje ──────────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, step]);

    // ── Foco en input WhatsApp al aparecer ───────────────────────────────────
    useEffect(() => {
        if (step === "form") {
            setTimeout(() => whatsappRef.current?.focus(), 200);
        }
    }, [step]);

    // ── Tooltip proactivo (3 s después de cargar) ────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!open && !tooltipDismissed) setShowTooltip(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [open, tooltipDismissed]);

    // Ocultar tooltip cuando se abre el widget
    useEffect(() => {
        if (open) setShowTooltip(false);
    }, [open]);

    // ── Síntesis al primer open ───────────────────────────────────────────────
    useEffect(() => {
        if (open && !hasSpoken) {
            setHasSpoken(true);
            // Pequeño delay para que el widget termine de renderizar
            setTimeout(() => {
                setIsSpeaking(true);
                speak(WELCOME_TEXT, () => setIsSpeaking(false));
            }, 600);
        }
    }, [open, hasSpoken]);

    // ── Detener síntesis al cerrar ────────────────────────────────────────────
    const handleClose = () => {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        setOpen(false);
    };

    // ── Toggle síntesis manual ────────────────────────────────────────────────
    const toggleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis?.cancel();
            setIsSpeaking(false);
        } else {
            const lastBot = [...messages].reverse().find((m) => m.from === "bot");
            if (lastBot) {
                setIsSpeaking(true);
                speak(lastBot.text, () => setIsSpeaking(false));
            }
        }
    };

    // ── Reconocimiento de voz ─────────────────────────────────────────────────
    const { isListening, startListening, stopListening } = useSpeechRecognition({
        onResult: (transcript) => {
            setInputText(transcript);
            setSpeechError(null);
        },
        onError: (msg) => setSpeechError(msg),
    });

    const toggleMic = () => {
        if (isListening) stopListening();
        else startListening();
    };

    // ── Enviar mensaje de texto ───────────────────────────────────────────────
    const handleSendText = (e) => {
        e?.preventDefault();
        const text = inputText.trim();
        if (!text) return;

        const userMsg = { id: Date.now(), from: "user", text };
        setMessages((prev) => [...prev, userMsg]);
        setInputText("");

        // Lógica de respuesta simple
        const lower = text.toLowerCase();
        setTimeout(() => {
            let botReply;
            if (
                lower.includes("afiliar") ||
                lower.includes("unirme") ||
                lower.includes("quiero ser") ||
                lower.includes("cómo me afilio") ||
                lower.includes("como me afilio")
            ) {
                botReply =
                    "¡Excelente! Para darte una atención personalizada, por favor dejame tu número de WhatsApp. Un asesor de SUPASO te va a contactar en breve. 📱";
                setMessages((prev) => [
                    ...prev,
                    { id: Date.now() + 1, from: "bot", text: botReply },
                ]);
                setIsSpeaking(true);
                speak(botReply, () => setIsSpeaking(false));
                setTimeout(() => setStep("form"), 700);
            } else if (
                lower.includes("beneficio") ||
                lower.includes("descuento")
            ) {
                botReply =
                    "¡Tenemos más de 200 prestadores en todo el país! Salud, turismo, farmacia, capacitación y más, con descuentos exclusivos para afiliados SUPASO. 🎁 ¿Te gustaría afiliarte para acceder a todos?";
                setMessages((prev) => [
                    ...prev,
                    { id: Date.now() + 1, from: "bot", text: botReply },
                ]);
                setIsSpeaking(true);
                speak(botReply, () => setIsSpeaking(false));
            } else if (
                lower.includes("ley") ||
                lower.includes("norma") ||
                lower.includes("srt") ||
                lower.includes("legal")
            ) {
                botReply =
                    "SUPASO trabaja bajo el marco de la Ley 19.587 y sus decretos reglamentarios, manteniendo actualizada la matriz normativa SRT para todos nuestros afiliados. 📋";
                setMessages((prev) => [
                    ...prev,
                    { id: Date.now() + 1, from: "bot", text: botReply },
                ]);
                setIsSpeaking(true);
                speak(botReply, () => setIsSpeaking(false));
            } else if (
                lower.includes("credencial") ||
                lower.includes("carnet")
            ) {
                botReply =
                    "Tu credencial digital SUPASO tiene código QR verificable en tiempo real, con vigencia legal ante inspecciones de la SRT y organismos de control. ¿Querés iniciar tu trámite?";
                setMessages((prev) => [
                    ...prev,
                    { id: Date.now() + 1, from: "bot", text: botReply },
                ]);
                setIsSpeaking(true);
                speak(botReply, () => setIsSpeaking(false));
            } else {
                botReply =
                    "Entendí tu consulta. Para brindarte una atención personalizada y conectarte con un asesor de SUPASO, dejame tu número de WhatsApp. ¡Te contactamos enseguida! 📞";
                setMessages((prev) => [
                    ...prev,
                    { id: Date.now() + 1, from: "bot", text: botReply },
                ]);
                setIsSpeaking(true);
                speak(botReply, () => setIsSpeaking(false));
                setTimeout(() => setStep("form"), 700);
            }
        }, 600);
    };

    // ── Botón "Quiero afiliarme" ──────────────────────────────────────────────
    const handleStartForm = () => {
        const botText =
            "¡Perfecto! Para darte una atención personalizada, por favor dejame tu número de WhatsApp con código de área. Un asesor te contactará en breve. 📱";
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), from: "user", text: "Quiero afiliarme a SUPASO." },
            { id: Date.now() + 1, from: "bot", text: botText },
        ]);
        setIsSpeaking(true);
        speak(botText, () => setIsSpeaking(false));
        setTimeout(() => setStep("form"), 700);
    };

    // ── Submit WhatsApp a Supabase ─────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!whatsapp || whatsapp.replace(/\D/g, "").length < 7) {
            setError("Por favor ingresá un número de WhatsApp válido.");
            return;
        }
        setLoading(true);
        try {
            const { error: supaErr } = await insertLead(whatsapp);
            if (supaErr) throw new Error(supaErr.message);

            const successText = `¡Tu solicitud fue registrada! Un asesor de SUPASO se pondrá en contacto al ${whatsapp} en breve. ¡Bienvenido al respaldo de élite! 💪`;
            setMessages((prev) => [
                ...prev,
                { id: Date.now(), from: "user", text: `Mi WhatsApp es: ${whatsapp}` },
                { id: Date.now() + 1, from: "bot", text: "✅ " + successText },
            ]);
            setIsSpeaking(true);
            speak(successText, () => setIsSpeaking(false));
            setStep("success");
        } catch (err) {
            console.error("Error insertando lead:", err);
            setError("Error al enviar. Por favor intentá de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Anchor para scroll */}
            <div id="sofia" className="h-px" />

            {/* ── FAB + Tooltip proactivo ────────────────────────────────────────── */}
            <div className="fixed bottom-8 right-6 z-50 flex flex-col items-end gap-3">

                {/* Tooltip proactivo */}
                {showTooltip && !open && (
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl border border-dark/10 px-4 py-3 flex items-start gap-2 max-w-[220px]"
                        style={{
                            animation: "tooltipBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                        }}
                    >
                        <style>{`
              @keyframes tooltipBounce {
                from { opacity: 0; transform: translateY(12px) scale(0.92); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
                        {/* Flecha hacia abajo */}
                        <div
                            className="absolute -bottom-[8px] right-6 w-4 h-4 bg-white border-r border-b border-dark/10 rotate-45"
                            style={{ zIndex: 1 }}
                        />
                        <Bot size={18} className="text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-dark text-xs font-medium leading-snug">
                            👋 ¡Hola! Soy Sofía<br />
                            <span className="text-dark/60">¿Te ayudo a afiliarte?</span>
                        </p>
                        <button
                            onClick={() => { setShowTooltip(false); setTooltipDismissed(true); }}
                            className="text-dark/30 hover:text-dark/70 transition-colors flex-shrink-0 ml-1"
                            aria-label="Cerrar tooltip"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* FAB */}
                <button
                    id="sofia-fab"
                    onClick={() => setOpen((v) => !v)}
                    aria-label="Abrir S.O.F.I.A."
                    className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 btn-magnetic text-white relative"
                >
                    {open ? <X size={24} /> : <MessageSquare size={24} />}
                    {/* Pulse ring */}
                    {!open && (
                        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30 pointer-events-none" />
                    )}
                </button>
            </div>

            {/* ── Chat Widget ───────────────────────────────────────────────────── */}
            {open && (
                <div
                    className="fixed bottom-28 right-6 z-50 w-[370px] max-w-[calc(100vw-24px)] rounded-3xl overflow-hidden shadow-2xl shadow-dark/30 border border-dark/10 flex flex-col"
                    style={{ height: "560px" }}
                >
                    {/* Header */}
                    <div className="bg-dark px-5 py-4 flex items-center gap-3 flex-shrink-0">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <Bot size={20} className="text-primary" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-dark" />
                        </div>
                        <div className="flex-1">
                            <div className="text-white font-bold text-sm">S.O.F.I.A.</div>
                            <div className="text-white/40 text-[10px] leading-tight flex items-center gap-1.5">
                                {isSpeaking ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                                        <span className="text-primary">Hablando…</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                                        <span>Sistema Orientador · SUPASO</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Botón silenciar/hablar */}
                        <button
                            onClick={toggleSpeak}
                            className={`p-2 rounded-xl transition-all ${isSpeaking
                                ? "bg-primary/20 text-primary"
                                : "text-white/40 hover:text-white hover:bg-white/10"
                                }`}
                            aria-label={isSpeaking ? "Silenciar" : "Reproducir último mensaje"}
                            title={isSpeaking ? "Silenciar" : "Reproducir último mensaje"}
                        >
                            {isSpeaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>

                        {/* Cerrar */}
                        <button
                            onClick={handleClose}
                            className="text-white/40 hover:text-white transition-colors p-1.5"
                            aria-label="Cerrar S.O.F.I.A."
                            id="sofia-close"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#f8f9fb]">
                        {messages.map((msg) =>
                            msg.from === "bot" ? (
                                <div key={msg.id} className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Bot size={13} className="text-primary" />
                                    </div>
                                    <div className="chat-bubble-bot">{msg.text}</div>
                                </div>
                            ) : (
                                <div key={msg.id} className="flex justify-end">
                                    <div className="chat-bubble-user">{msg.text}</div>
                                </div>
                            )
                        )}

                        {/* CTA — step: chat */}
                        {step === "chat" && (
                            <div className="flex flex-col gap-2 mt-1">
                                <button
                                    onClick={handleStartForm}
                                    id="sofia-start-btn"
                                    className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 btn-magnetic"
                                >
                                    <ChevronRight size={16} />
                                    Quiero afiliarme
                                </button>
                                <a
                                    href="https://app-supaso.vercel.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id="sofia-portal-btn"
                                    className="w-full py-2 rounded-xl border border-dark/15 text-dark/70 text-sm font-medium text-center hover:border-primary/40 transition-colors"
                                >
                                    Ya soy afiliado → Portal
                                </a>
                                <a
                                    href="https://app-supaso.vercel.app/#afiliados"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id="sofia-alta-afiliados-btn"
                                    className="w-full py-2 rounded-xl border border-dark/15 text-dark/70 text-sm font-medium text-center hover:border-primary/40 transition-colors"
                                >
                                    Alta de Afiliados
                                </a>
                                <a
                                    href="https://app-supaso.vercel.app/#prestadores"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id="sofia-alta-comercios-btn"
                                    className="w-full py-2 rounded-xl border border-primary/20 text-primary/70 text-sm font-medium text-center hover:border-primary/50 transition-colors"
                                >
                                    Alta de Comercios / Prestadores
                                </a>
                            </div>
                        )}

                        {/* Formulario WhatsApp — step: form */}
                        {step === "form" && (
                            <form
                                onSubmit={handleSubmit}
                                className="mt-1 bg-white rounded-2xl p-4 border border-dark/10 shadow-sm flex flex-col gap-3"
                            >
                                <p className="text-dark/60 text-xs leading-relaxed">
                                    Ingresá tu número sin 0 ni 15 · Ej:{" "}
                                    <span className="font-mono text-dark">11 4567 8901</span>
                                </p>
                                <div className="flex items-center gap-2 border border-dark/15 rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors">
                                    <Phone size={16} className="text-dark/40 flex-shrink-0" />
                                    <input
                                        id="sofia-whatsapp-input"
                                        ref={whatsappRef}
                                        type="tel"
                                        placeholder="Ej: 11 5012 3456"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        className="flex-1 outline-none text-sm text-dark placeholder:text-dark/30 bg-transparent"
                                        maxLength={20}
                                    />
                                </div>
                                {error && <p className="text-danger text-xs px-1">{error}</p>}
                                <button
                                    type="submit"
                                    id="sofia-submit-btn"
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 btn-magnetic disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                                            </svg>
                                            Enviando…
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Solicitar afiliación
                                        </>
                                    )}
                                </button>
                                <p className="text-dark/30 text-[10px] text-center leading-tight">
                                    Tu número sólo se usará para contactarte por WhatsApp.<br />
                                    Sin spam. Nunca compartimos tus datos.
                                </p>
                            </form>
                        )}

                        {/* Éxito — step: success */}
                        {step === "success" && (
                            <div className="mt-1 bg-white rounded-2xl p-5 border border-success/20 text-center flex flex-col items-center gap-3">
                                <CheckCircle2 size={40} className="text-success" />
                                <div>
                                    <p className="font-bold text-dark text-sm">¡Solicitud recibida!</p>
                                    <p className="text-dark/50 text-xs mt-1 leading-relaxed">
                                        Pronto un asesor de SUPASO te contactará al{" "}
                                        <span className="font-semibold text-dark">{whatsapp}</span>.
                                    </p>
                                </div>
                                <a
                                    href="https://app-supaso.vercel.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary text-xs font-semibold hover:underline"
                                >
                                    Acceder al Portal de Afiliados →
                                </a>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Input de texto + micrófono */}
                    {step === "chat" && (
                        <form
                            onSubmit={handleSendText}
                            className="flex-shrink-0 bg-white border-t border-dark/8 px-3 py-3 flex items-center gap-2"
                        >
                            {/* Error de micrófono */}
                            {speechError && (
                                <div className="absolute bottom-20 left-3 right-3 bg-danger/10 border border-danger/20 rounded-xl px-3 py-2 text-danger text-xs">
                                    {speechError}
                                </div>
                            )}

                            <input
                                type="text"
                                placeholder="Escribí o usá el micrófono…"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="flex-1 text-sm text-dark placeholder:text-dark/30 outline-none bg-transparent"
                                id="sofia-text-input"
                            />

                            {/* Botón micrófono */}
                            <button
                                type="button"
                                onClick={toggleMic}
                                id="sofia-mic-btn"
                                aria-label={isListening ? "Detener micrófono" : "Activar micrófono"}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isListening
                                    ? "bg-danger/10 text-danger animate-pulse"
                                    : "bg-dark/5 text-dark/50 hover:bg-primary/10 hover:text-primary"
                                    }`}
                                title={isListening ? "Escuchando… click para detener" : "Hablar"}
                            >
                                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                            </button>

                            {/* Botón enviar */}
                            <button
                                type="submit"
                                id="sofia-send-btn"
                                disabled={!inputText.trim()}
                                className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 btn-magnetic disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                aria-label="Enviar mensaje"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="flex-shrink-0 bg-white border-t border-dark/5 px-4 py-2 flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                        <span className="text-dark/30 text-[10px]">
                            SUPASO · Automatización vía Make.com
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}
