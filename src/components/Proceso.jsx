// src/components/Proceso.jsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ClipboardList, UserCheck, CreditCard, Rocket } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
    {
        num: "01",
        icon: ClipboardList,
        title: "Completá tu solicitud",
        desc: "Ingresá tus datos básicos y número de WhatsApp. S.O.F.I.A. inicia el proceso de manera automática.",
    },
    {
        num: "02",
        icon: UserCheck,
        title: "Verificación profesional",
        desc: "Validamos tu matrícula y categoría profesional con los organismos competentes de tu provincia.",
    },
    {
        num: "03",
        icon: CreditCard,
        title: "Credencial activa",
        desc: "Accedés a tu credencial digital institucional con QR verificable y vigencia legal ante inspecciones SRT.",
    },
    {
        num: "04",
        icon: Rocket,
        title: "Bienvenido al respaldo",
        desc: "Acceso completo a beneficios, asesoría legal, formación continua y toda la red SUPASO.",
    },
];

export default function Proceso() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray(".step-card").forEach((card, i) => {
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 88%",
                        toggleActions: "play none none none",
                    },
                    opacity: 0,
                    y: 50,
                    duration: 0.7,
                    delay: i * 0.1,
                    ease: "power3.out",
                });
            });

            gsap.from(".proceso-header", {
                scrollTrigger: {
                    trigger: ".proceso-header",
                    start: "top 85%",
                    toggleActions: "play none none none",
                },
                opacity: 0,
                y: 40,
                duration: 0.8,
                ease: "power3.out",
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-28 px-6 md:px-16 lg:px-24 bg-white">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="proceso-header text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-dark/10 bg-dark/5 mb-5">
                        <span className="text-xs font-semibold text-dark/60 tracking-widest uppercase">
                            Proceso de Afiliación
                        </span>
                    </div>
                    <h2 className="font-inter font-black text-4xl md:text-5xl text-dark leading-tight">
                        Cuatro pasos hacia
                        <br />
                        <span className="font-cormorant italic text-primary text-5xl md:text-6xl">
                            el respaldo definitivo.
                        </span>
                    </h2>
                    <p className="text-dark/50 text-base max-w-md mx-auto mt-4 font-light">
                        Simple, rápido y completamente digital. Sin burocracia innecesaria.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-4 gap-6">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div
                                key={s.num}
                                id={`step-${s.num}`}
                                className="step-card relative flex flex-col gap-5 p-7 rounded-3xl border border-dark/8 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 group"
                            >
                                {/* Connector line */}
                                {i < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-12 right-[-24px] w-12 h-px bg-primary/20 z-10" />
                                )}

                                {/* Number */}
                                <div className="flex items-center justify-between">
                                    <span className="font-inter font-black text-5xl text-dark/6 group-hover:text-primary/10 transition-colors">
                                        {s.num}
                                    </span>
                                    <div className="w-10 h-10 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                                        <Icon size={18} className="text-primary" />
                                    </div>
                                </div>

                                <h3 className="font-bold text-dark text-base leading-tight">{s.title}</h3>
                                <p className="text-dark/50 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Main CTA */}
                <div className="mt-16 text-center">
                    <a
                        href="#sofia"
                        id="proceso-cta"
                        className="btn-magnetic inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-dark text-white font-bold text-base shadow-2xl shadow-dark/20 hover:bg-primary transition-colors duration-300"
                    >
                        <Rocket size={20} />
                        Iniciar mi proceso de afiliación
                    </a>
                    <p className="text-dark/30 text-sm mt-4">
                        Sin costos ocultos · Sin formularios en papel · 100% digital
                    </p>
                </div>
            </div>
        </section>
    );
}
