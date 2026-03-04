// src/components/Sofia.jsx
// S.O.F.I.A. — Sistema Orientador de Formación e Información al Afiliado
// Web Speech API (síntesis + reconocimiento), tooltip proactivo, Supabase lead capture
// NOTA: Make.com se conecta a la tabla `leads_sofia` en Supabase para disparar
// el flujo de bienvenida y acompañamiento vía WhatsApp de forma automática.

import { useState, useRef, useEffect, useCallback } from "react";
import {
    MessageSquare, X, Send, Phone, CheckCircle2, Bot,
    ChevronRight, Mic, MicOff, Volume2, VolumeX, Download,
} from "lucide-react";
import { insertLead } from "../lib/supabaseClient";
import { askGemini } from "../lib/gemini";

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días.";
    if (hour < 20) return "Buenas tardes.";
    return "Buenas noches.";
};

const getWelcomeText = () => `${getGreeting()} Soy Sofía, el Sistema Orientador de Formación e Información al Afiliado de Supaso. ¿En qué puedo ayudarte?`;

const INITIAL_MESSAGES = () => [
    {
        id: 0,
        from: "bot",
        text: `${getGreeting()} Soy Sofía, el Sistema Orientador de Formación e Información al Afiliado de SUPASO.`,
    },
    {
        id: 1,
        from: "bot",
        text: "¿En qué puedo ayudarte?",
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

// ─── Síntesis de voz (Web Speech API - Nativa y Gratuita) ─────────────────────
function speak(rawText, onEnd) {
    if (!window.speechSynthesis) {
        if (onEnd) onEnd();
        return;
    }

    // Cortar lo que esté hablando actualmente
    window.speechSynthesis.cancel();

    const text = toSpoken(rawText);
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "es-AR";
    speech.rate = 1.0;
    speech.pitch = 1.0;

    // Intentar buscar una voz femenina profesional
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoices = [
            "Google español", "Paulina", "Sabina", "Helena", "Luciana", "Monica", "Microsoft Sabina"
        ];

        let voice = voices.find(v =>
            v.lang.startsWith("es") && preferredVoices.some(p => v.name.includes(p))
        );

        if (!voice) voice = voices.find(v => v.lang.includes("es-AR"));
        if (!voice) voice = voices.find(v => v.lang.startsWith("es"));

        if (voice) speech.voice = voice;

        if (onEnd) {
            speech.onend = onEnd;
            speech.onerror = onEnd;
        }
        window.speechSynthesis.speak(speech);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices();
    } else {
        window.speechSynthesis.onvoiceschanged = loadVoices;
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
    const [formType, setFormType] = useState("default"); // 'default' | 'socio' | 'urgencia'
    const [messages, setMessages] = useState([]);
    useEffect(() => {
        setMessages(INITIAL_MESSAGES());
    }, []);
    const [inputText, setInputText] = useState("");
    const [nombre, setNombre] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [provinciaVive, setProvinciaVive] = useState("");
    const [provinciaTrabaja, setProvinciaTrabaja] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechError, setSpeechError] = useState(null);
    const [hasSpoken, setHasSpoken] = useState(false); // primer open
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipDismissed, setTooltipDismissed] = useState(false);
    const chatEndRef = useRef(null);
    const nombreRef = useRef(null);
    const whatsappRef = useRef(null);

    // ── Auto-scroll a último mensaje ──────────────────────────────────────────
    useEffect(() => {
        // Redujimos problemas de UI esperando un poco para que el render asiente el scroll
        const timer = setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 150);
        return () => clearTimeout(timer);
    }, [messages, step]);

    // ── Foco y scroll al primer input ───────────────────────────────────────
    useEffect(() => {
        if (step === "form") {
            setTimeout(() => {
                nombreRef.current?.focus();
            }, 300);
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

    // ── Helper para desbloquear micrófono post-hablar ─────────────────────────
    const handleSpeakEnd = useCallback(() => {
        setTimeout(() => setIsSpeaking(false), 500);
    }, []);

    // ── Síntesis al primer open ───────────────────────────────────────────────
    useEffect(() => {
        if (open && !hasSpoken) {
            setHasSpoken(true);
            setTimeout(() => {
                setIsSpeaking(true);
                speak(getWelcomeText(), handleSpeakEnd);
            }, 600);
        }
    }, [open, hasSpoken, handleSpeakEnd]);


    // ── Detener síntesis al cerrar ────────────────────────────────────────────
    const handleClose = () => {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        setOpen(false);
    };

    // ── Descargar Conversación ────────────────────────────────────────────────
    const handleDownloadChat = () => {
        const chatText = messages.map(m => {
            const sender = m.from === "bot" ? "S.O.F.I.A." : "Tú";
            return `${sender}: ${m.text}`;
        }).join("\n\n");

        const blob = new Blob([chatText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `conversacion_sofia_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ── Toggle síntesis manual ────────────────────────────────────────────────
    const toggleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis?.cancel();
            setIsSpeaking(false);
        } else {
            const lastBot = [...messages].reverse().find((m) => m.from === "bot");
            if (lastBot) { setIsSpeaking(true); speak(lastBot.text, handleSpeakEnd); }
        }
    };

    // ── Reconocimiento de voz ─────────────────────────────────────────────────
    const { isListening, startListening, stopListening } = useSpeechRecognition({
        onResult: (transcript) => {
            setInputText(transcript);
            setSpeechError(null);
            // Auto-send upon voice recognition result
            if (transcript && transcript.trim()) {
                // Pass transcript directly to avoid state sync issues on auto-send
                handleSendText(null, transcript);
            }
        },
        onError: (msg) => setSpeechError(msg),
    });

    // ── Timer de inactividad (45 segundos, evita bucles) ─────────────────────
    useEffect(() => {
        let timer;
        const lastMsg = messages[messages.length - 1];

        // Evitar bucle: no disparar si el último mensaje ya es de inactividad
        const isIdlePrompt = lastMsg?.text?.includes("¿Sigues ahí?");

        if (open && step === 'chat' && !isListening && !isSpeaking && lastMsg?.from === 'bot' && !isIdlePrompt) {
            timer = setTimeout(() => {
                const idleText = "¿Sigues ahí? Por favor déjame tu nombre y teléfono para que un asesor te contacte personalmente.";
                setMessages((prev) => [...prev, { id: Date.now(), from: 'bot', text: idleText }]);
                setFormType('default');
                setIsSpeaking(true);
                speak(idleText, handleSpeakEnd);
                setTimeout(() => setStep("form"), 2000);
            }, 45000); // 45 segundos
        }
        return () => clearTimeout(timer);
    }, [messages, step, isListening, isSpeaking, open, handleSpeakEnd]);

    const toggleMic = () => {
        if (isListening) stopListening();
        else startListening();
    };

    // ── Enviar mensaje de texto ───────────────────────────────────────────────
    const handleSendText = (e, autoText = null) => {
        if (e) e.preventDefault();
        const text = (autoText || inputText).trim();
        if (!text) return;

        const userMsg = { id: Date.now(), from: "user", text };
        setMessages((prev) => [...prev, userMsg]);
        setInputText("");

        const lower = text.toLowerCase();
        setTimeout(async () => {
            let botReply;
            if (
                lower.includes("afiliar") ||
                lower.includes("unirme") ||
                lower.includes("quiero ser") ||
                lower.includes("como me afilio") ||
                lower.includes("cómo me afilio")
            ) {
                // FLUJO A - Afiliación (Online, visual guide)
                botReply =
                    "Para afiliarte de forma online, haz clic en el botón 'Afiliarme' en la pantalla para completar tus datos. ¿Deseas conocer los beneficios legales o descuentos en salud mientras lo completas?";
                setMessages((prev) => [...prev, { id: Date.now() + 1, from: "bot", text: botReply }]);
                setIsSpeaking(true);
                speak(botReply, handleSpeakEnd);
                // No form needed, just directions.
            } else if (
                lower.includes("urgente") ||
                lower.includes("emergencia") ||
                lower.includes("vence")
            ) {
                // FLUJO D - Urgencia legal
                botReply =
                    "Entiendo la urgencia. Priorizaré tu consulta para que el equipo legal te contacte a la brevedad. Por favor, indícame tu nombre y teléfono.";
                setMessages((prev) => [...prev, { id: Date.now() + 1, from: "bot", text: botReply }]);
                setFormType("urgencia");
                setIsSpeaking(true);
                speak(botReply, handleSpeakEnd);
                setTimeout(() => setStep("form"), 700);
            } else if (
                lower.includes("soy socio") ||
                lower.includes("soy afiliado") ||
                lower.includes("ya estoy") ||
                lower.includes("socio activo")
            ) {
                // FLUJO C - Socio activo con problema
                botReply =
                    "Comprendo. Para que el Secretario General de tu provincia gestione este tema, indícame tu nombre completo, teléfono, provincia de residencia y provincia de trabajo.";
                setMessages((prev) => [...prev, { id: Date.now() + 1, from: "bot", text: botReply }]);
                setFormType("socio");
                setIsSpeaking(true);
                speak(botReply, handleSpeakEnd);
                setTimeout(() => setStep("form"), 700);
            } else if (
                lower.includes("beneficio") ||
                lower.includes("descuento")
            ) {
                // Info - Beneficios
                botReply =
                    "Ofrecemos descuentos en comercios, salud, asistencia legal y turismo. ¿Necesitas ayuda con tu afiliación u otra consulta?";
                setMessages((prev) => [...prev, { id: Date.now() + 1, from: "bot", text: botReply }]);
                setIsSpeaking(true);
                speak(botReply, handleSpeakEnd);
            } else if (
                lower.includes("cuota") ||
                lower.includes("costo") ||
                lower.includes("pagar")
            ) {
                // Info - Costo de Cuota
                botReply =
                    "La cuota es del 2,5% del sueldo bruto para trabajadores en relación de dependencia. Para monotributistas o jubilados, varía según la categoría. Para asesorarte personalmente, indícame tu nombre y teléfono.";
                setMessages((prev) => [...prev, { id: Date.now() + 1, from: "bot", text: botReply }]);
                setFormType("default");
                setIsSpeaking(true);
                speak(botReply, handleSpeakEnd);
                setTimeout(() => setStep("form"), 700);
            } else {
                // FLUJO B - Inteligencia de Gemini
                setMessages((prev) => [...prev, { id: "gemini_typing", from: "bot", text: "..." }]);

                try {
                    let aiReply = await askGemini(messages, text);
                    let wantsData = false;

                    if (aiReply.includes("[PEDIR_DATOS]")) {
                        wantsData = true;
                        aiReply = aiReply.replace(/\[PEDIR_DATOS\]/g, "").trim();
                    }

                    // Eliminar "escribiendo..."
                    setMessages((prev) => prev.filter(m => m.id !== "gemini_typing"));

                    setMessages((prev) => [...prev, { id: Date.now() + 1, from: "bot", text: aiReply }]);
                    if (wantsData) setFormType("default");
                    setIsSpeaking(true);
                    speak(aiReply, handleSpeakEnd);
                    if (wantsData) setTimeout(() => setStep("form"), 1500);

                } catch (err) {
                    console.error("Gemini failed", err);
                    botReply = "Entiendo y disculpa, tuve una desconexión. Necesito tu nombre y teléfono para que un asesor te contacte personalmente.";
                    setMessages((prev) => prev.filter(m => m.id !== "gemini_typing"));
                    setMessages((prev) => [...prev, { id: Date.now() + 1, from: "bot", text: botReply }]);
                    setFormType("default");
                    setIsSpeaking(true);
                    speak(botReply, handleSpeakEnd);
                    setTimeout(() => setStep("form"), 700);
                }
            }
        }, 600);
    };

    // ── Botón "Quiero afiliarme" (quick pick action) ────────────────────────
    const handleStartForm = () => {
        const botText =
            "Para afiliarte de forma online, haz clic en el botón 'Afiliarme' en la pantalla para completar tus datos. ¿Deseas conocer los beneficios legales o descuentos en salud mientras lo completas?";
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), from: "user", text: "Quiero afiliarme a SUPASO." },
            { id: Date.now() + 1, from: "bot", text: botText },
        ]);
        setIsSpeaking(true);
        speak(botText, handleSpeakEnd);
    };

    // ── Submit Lead a Supabase ──────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!nombre.trim()) {
            setError("Por favor ingresá tu nombre completo.");
            return;
        }
        if (!whatsapp || whatsapp.replace(/\D/g, "").length < 7) {
            setError("Por favor ingresá un número de teléfono válido.");
            return;
        }
        if (formType === "socio" && (!provinciaVive.trim() || !provinciaTrabaja.trim())) {
            setError("Por favor ingresá las provincias para derivarte correctamente.");
            return;
        }

        setLoading(true);
        try {
            // Separamos: enviamos el `nombre` limpiecito en la primera col, y la metadata de (estado legal u otras vars) lo metemos contiguo al teléfono si hiciera falta (para que Make lo reciba todo) o lo enviamos limpio.
            let metadataTel = whatsapp;
            if (formType === "socio") metadataTel += ` / Vive: ${provinciaVive} / Trabaja: ${provinciaTrabaja}`;
            if (formType === "urgencia") metadataTel = `[URGENTE] ${metadataTel}`;

            const { error: supaErr } = await insertLead(nombre, metadataTel);
            if (supaErr) throw new Error(supaErr.message);

            const successText = `Trámite finalizado. Gracias, ${nombre}. La Secretaría te contactará pronto. Si lo deseas, puedes descargar esta conversación utilizando el botón de descarga en la parte superior.`;
            setMessages((prev) => [
                ...prev,
                { id: Date.now(), from: "user", text: `Mis datos: ${nombre} - ${whatsapp}` },
                { id: Date.now() + 1, from: "bot", text: "✅ " + successText },
            ]);
            setIsSpeaking(true);
            speak(successText, handleSpeakEnd);
            setStep("success");

            // clear state
            setNombre("");
            setWhatsapp("");
            setProvinciaVive("");
            setProvinciaTrabaja("");
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
                            ¿Necesitas asesoramiento legal o conocer los beneficios de SUPASO?<br />
                            <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => setOpen(true)}>Haz clic para hablar conmigo.</span>
                        </p>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowTooltip(false); setTooltipDismissed(true); }}
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

                        {/* Funciones adicionales */}
                        <div className="flex items-center gap-1">
                            {/* Botón Descargar chat */}
                            <button
                                onClick={handleDownloadChat}
                                className="text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
                                aria-label="Descargar transcripción"
                                title="Descargar conversación"
                            >
                                <Download size={16} />
                            </button>

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

                        {/* Formulario Captura Lead — step: form */}
                        {step === "form" && (
                            <form
                                onSubmit={handleSubmit}
                                className="mt-1 bg-white rounded-2xl p-4 border border-dark/10 shadow-sm flex flex-col gap-3 flex-shrink-0"
                            >
                                <div className="flex flex-col gap-1 text-dark/70 text-xs">
                                    <label>Nombre y apellido</label>
                                    <input
                                        ref={nombreRef}
                                        type="text"
                                        placeholder="Tu nombre aquí"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="border border-dark/15 rounded-xl px-3 py-2 text-dark bg-transparent focus:border-primary transition-colors outline-none w-full"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1 text-dark/70 text-xs mt-1">
                                    <label>Número de teléfono (con cód. de área)</label>
                                    <div className="flex items-center gap-2 border border-dark/15 rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors">
                                        <Phone size={14} className="text-dark/40 flex-shrink-0" />
                                        <input
                                            id="sofia-whatsapp-input"
                                            ref={whatsappRef}
                                            type="tel"
                                            placeholder="11 5012 3456"
                                            value={whatsapp}
                                            onChange={(e) => setWhatsapp(e.target.value)}
                                            className="flex-1 outline-none text-sm text-dark placeholder:text-dark/30 bg-transparent w-full"
                                            maxLength={20}
                                            required
                                        />
                                    </div>
                                </div>

                                {formType === "socio" && (
                                    <>
                                        <div className="flex flex-col gap-1 text-dark/70 text-xs mt-1">
                                            <label>Provincia donde residís</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Córdoba"
                                                value={provinciaVive}
                                                onChange={(e) => setProvinciaVive(e.target.value)}
                                                className="border border-dark/15 rounded-xl px-3 py-2 text-dark bg-transparent focus:border-primary transition-colors outline-none w-full"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1 text-dark/70 text-xs mt-1">
                                            <label>Provincia donde trabajás</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Tierra del Fuego"
                                                value={provinciaTrabaja}
                                                onChange={(e) => setProvinciaTrabaja(e.target.value)}
                                                className="border border-dark/15 rounded-xl px-3 py-2 text-dark bg-transparent focus:border-primary transition-colors outline-none w-full"
                                                required
                                            />
                                        </div>
                                    </>
                                )}

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
                                            Enviar
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
                                disabled={isSpeaking}
                                id="sofia-mic-btn"
                                aria-label={isListening ? "Detener micrófono" : "Activar micrófono"}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isListening
                                    ? "bg-success/10 text-success animate-pulse" // Verde cuando escucha
                                    : isSpeaking
                                        ? "bg-dark/5 text-dark/30 cursor-not-allowed"
                                        : "bg-danger/10 text-danger hover:bg-danger/20" // Rojo cuando no escucha
                                    }`}
                                title={isSpeaking ? "Sofía está hablando..." : isListening ? "Escuchando… click para detener" : "Hablar"}
                            >
                                {isListening ? <Mic size={17} /> : <MicOff size={17} />}
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
                </div >
            )
            }
        </>
    );
}
