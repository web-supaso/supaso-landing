// src/components/Features.jsx
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CreditCard, Wifi, Gift, CheckCircle2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ─── Feature 1: Credencial Activa ───
function CredencialFeature() {
    const [activeCard, setActiveCard] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveCard((prev) => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const cards = [
        {
            name: "Ing. Martínez, Carlos A.",
            dni: "DNI: 28.456.789",
            cat: "Ing. en Ambiente",
            mat: "Mat. Prov. 00412",
            color: "from-[#012160] to-[#0086CE]",
        },
        {
            name: "Lic. González, María F.",
            dni: "DNI: 33.218.104",
            cat: "Lic. en Higiene Ocupacional",
            mat: "Mat. Prov. 00873",
            color: "from-[#0086CE] to-[#012160]",
        },
        {
            name: "Tec. Rodríguez, Pablo E.",
            dni: "DNI: 30.891.445",
            cat: "Tec. Superior S.H.O.",
            mat: "Mat. Prov. 01120",
            color: "from-[#013a8a] to-[#0056a8]",
        },
    ];

    return (
        <div className="relative h-56 flex items-center justify-center">
            {cards.map((card, i) => (
                <div
                    key={i}
                    className={`absolute w-[260px] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-2xl p-5 bg-gradient-to-br ${card.color} text-white shadow-2xl`}
                    style={{
                        transform: `translateY(${(i - activeCard) * 18}px) scale(${i === activeCard ? 1 : 0.93}) translateX(${(i - activeCard) * 8}px)`,
                        opacity: i === activeCard ? 1 : i === (activeCard + 1) % 3 ? 0.5 : 0.25,
                        zIndex: i === activeCard ? 30 : i === (activeCard + 1) % 3 ? 20 : 10,
                    }}
                >
                    {/* Card header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <CreditCard size={14} />
                            </div>
                            <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-white/70">
                                SUPASO
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
                            <span className="text-[9px] text-success font-semibold">Activa</span>
                        </div>
                    </div>
                    <div className="font-bold text-sm leading-tight">{card.name}</div>
                    <div className="text-[10px] text-white/60 mt-0.5">{card.dni}</div>
                    <div className="mt-3 flex items-end justify-between">
                        <div>
                            <div className="text-[10px] text-white/50 uppercase tracking-widest">Categoría</div>
                            <div className="text-xs font-semibold">{card.cat}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-white/50 uppercase tracking-widest">Matrícula</div>
                            <div className="text-xs font-semibold">{card.mat}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Feature 2: Terminal Normativo ───
const SEQUENCES = [
    "Escaneando Ley 19.587 / Decreto 351/79...",
    "Validando Resoluciones SRT 299/2011...",
    "Actualizando Matriz Legal SUPASO...",
    "Sincronizando: Resolución 905/2015...",
    "Sistema actualizado. Normativa vigente.",
];

function TerminalFeature() {
    const [lineIdx, setLineIdx] = useState(0);
    const [displayed, setDisplayed] = useState("");
    const [charIdx, setCharIdx] = useState(0);

    useEffect(() => {
        const target = SEQUENCES[lineIdx];
        if (charIdx < target.length) {
            const t = setTimeout(() => {
                setDisplayed(target.slice(0, charIdx + 1));
                setCharIdx((c) => c + 1);
            }, 38);
            return () => clearTimeout(t);
        } else {
            const t = setTimeout(() => {
                setLineIdx((prev) => (prev + 1) % SEQUENCES.length);
                setDisplayed("");
                setCharIdx(0);
            }, 2200);
            return () => clearTimeout(t);
        }
    }, [charIdx, lineIdx]);

    return (
        <div className="bg-[#010e2a] rounded-2xl p-5 font-mono text-sm border border-primary/20 h-56 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-danger/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <span className="w-3 h-3 rounded-full bg-success/80" />
                </div>
                <span className="text-white/30 text-[10px] ml-2 tracking-widest">SUPASO · SINCRONIZACIÓN NORMATIVA</span>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
                    <span className="text-success text-[10px] font-bold">EN VIVO</span>
                </div>
            </div>

            {/* Previous lines (faded) */}
            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {SEQUENCES.slice(0, lineIdx).slice(-3).map((line, i) => (
                    <div key={i} className="text-white/20 text-xs truncate">
                        <span className="text-primary/40 mr-2">{">"}</span>
                        {line}
                    </div>
                ))}
                {/* Active line */}
                <div className="text-primary text-xs flex items-center">
                    <span className="text-success mr-2">{">"}</span>
                    {displayed}
                    <span className="terminal-cursor" />
                </div>
            </div>

            {/* Footer progress bar */}
            <div className="mt-4">
                <div className="flex justify-between text-[9px] text-white/30 mb-1">
                    <span>Progreso normativo</span>
                    <span>{Math.round((lineIdx / SEQUENCES.length) * 100)}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${(lineIdx / SEQUENCES.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Feature 3: Red de Beneficios ───
const RUBROS = [
    { name: "Turismo", descuento: "25%", emoji: "✈️" },
    { name: "Salud", descuento: "40%", emoji: "🏥" },
    { name: "Óptica", descuento: "30%", emoji: "👓" },
    { name: "Farmacia", descuento: "15%", emoji: "💊" },
    { name: "Capacitación", descuento: "60%", emoji: "🎓" },
    { name: "Librería", descuento: "20%", emoji: "📚" },
    { name: "Seguros", descuento: "35%", emoji: "🛡️" },
    { name: "Gastronomía", descuento: "18%", emoji: "🍽️" },
    { name: "Tecnología", descuento: "22%", emoji: "💻" },
];

function BeneficiosFeature() {
    const [selected, setSelected] = useState(null);
    const [cursor, setCursor] = useState(0);

    useEffect(() => {
        // Automated cursor cycles through rubros
        const interval = setInterval(() => {
            setCursor((prev) => {
                const next = (prev + 1) % RUBROS.length;
                setTimeout(() => setSelected(next), 400);
                return next;
            });
        }, 2200);
        return () => clearInterval(interval);
    }, []);

    const activeItem = selected !== null ? RUBROS[selected] : null;

    return (
        <div className="h-56 flex flex-col gap-3 relative">
            {/* Grid */}
            <div className="grid grid-cols-3 gap-2 flex-1">
                {RUBROS.map((r, i) => (
                    <button
                        key={r.name}
                        onClick={() => setSelected(i)}
                        id={`rubro-${r.name.toLowerCase()}`}
                        className={`rounded-xl border text-center py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer ${cursor === i
                            ? "border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20"
                            : selected === i
                                ? "border-primary/40 bg-primary/5"
                                : "border-dark/10 bg-white hover:border-primary/30"
                            }`}
                    >
                        <span className="text-lg">{r.emoji}</span>
                        <span className="text-[9px] font-semibold text-dark/70 leading-tight">{r.name}</span>
                    </button>
                ))}
            </div>

            {/* Dropdown badge */}
            <div
                className={`absolute -bottom-0 left-0 right-0 transition-all duration-400 ease-out ${activeItem ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    }`}
            >
                {activeItem && (
                    <div className="bg-dark rounded-xl px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{activeItem.emoji}</span>
                            <div>
                                <div className="text-white font-bold text-sm">{activeItem.name}</div>
                                <div className="text-white/50 text-[10px]">Descuento para afiliados</div>
                            </div>
                        </div>
                        <div className="bg-success rounded-lg px-3 py-1">
                            <span className="text-white font-black text-xl">{activeItem.descuento}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Features Section ───
const FEATURES = [
    {
        id: "credencial",
        icon: CreditCard,
        tag: "Identidad Profesional",
        title: "Credencial Activa",
        desc: "Tu identidad profesional respaldada institucionalmente. QR verificable en tiempo real, vigencia legal ante inspecciones SRT y organismos de control.",
        component: <CredencialFeature />,
    },
    {
        id: "normativa",
        icon: Wifi,
        tag: "Sincronización Legal",
        title: "Actualización Normativa",
        desc: "Seguimiento en tiempo real de la Ley 19.587, Decreto 351/79, resoluciones SRT y actualizaciones del Ministerio de Trabajo. Siempre al día.",
        component: <TerminalFeature />,
    },
    {
        id: "beneficios",
        icon: Gift,
        tag: "Red de Partners",
        title: "Red de Beneficios",
        desc: "Más de 200 prestadores en todo el país. Descuentos en salud, turismo, capacitación, farmacia y tecnología, exclusivos para afiliados SUPASO.",
        component: <BeneficiosFeature />,
    },
];

export default function Features() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray(".feature-card").forEach((card, i) => {
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                        toggleActions: "play none none none",
                    },
                    opacity: 0,
                    y: 60,
                    duration: 0.8,
                    delay: i * 0.12,
                    ease: "power3.out",
                });
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section
            id="features"
            ref={sectionRef}
            className="py-28 px-6 md:px-16 lg:px-24 bg-light"
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-5">
                        <CheckCircle2 size={14} className="text-primary" />
                        <span className="text-xs font-semibold text-primary tracking-widest uppercase">
                            Instrumentos SUPASO
                        </span>
                    </div>
                    <h2 className="font-inter font-black text-4xl md:text-5xl text-dark leading-tight">
                        Tres herramientas.
                        <br />
                        <span className="font-cormorant italic text-primary text-5xl md:text-6xl">
                            Un solo respaldo.
                        </span>
                    </h2>
                    <p className="text-dark/60 text-base max-w-xl mx-auto mt-4 font-light leading-relaxed">
                        Diseñado para que el profesional argentino de la seguridad tenga todo lo que necesita — en un solo lugar.
                    </p>
                </div>

                {/* Feature cards */}
                <div className="grid md:grid-cols-3 gap-8">
                    {FEATURES.map((f) => {
                        const Icon = f.icon;
                        return (
                            <div
                                key={f.id}
                                id={`feature-${f.id}`}
                                className="feature-card bg-white rounded-3xl p-8 shadow-xl shadow-dark/5 border border-dark/5 flex flex-col gap-6 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
                            >
                                {/* Tag */}
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Icon size={18} className="text-primary" />
                                    </div>
                                    <span className="text-[10px] text-primary font-bold tracking-widest uppercase">
                                        {f.tag}
                                    </span>
                                </div>
                                {/* Title */}
                                <h3 className="font-black text-xl text-dark leading-tight">{f.title}</h3>
                                {/* Interactive element */}
                                {f.component}
                                {/* Description */}
                                <p className="text-dark/60 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
