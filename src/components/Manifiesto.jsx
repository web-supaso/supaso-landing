// src/components/Manifiesto.jsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Manifiesto() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Split text reveal
            gsap.from(".manifesto-line-1", {
                scrollTrigger: {
                    trigger: ".manifesto-line-1",
                    start: "top 80%",
                    toggleActions: "play none none none",
                },
                opacity: 0,
                x: -80,
                duration: 1,
                ease: "power4.out",
            });

            gsap.from(".manifesto-line-2", {
                scrollTrigger: {
                    trigger: ".manifesto-line-2",
                    start: "top 80%",
                    toggleActions: "play none none none",
                },
                opacity: 0,
                x: 80,
                duration: 1.1,
                ease: "power4.out",
                delay: 0.15,
            });

            gsap.from(".manifesto-line-3", {
                scrollTrigger: {
                    trigger: ".manifesto-line-3",
                    start: "top 80%",
                    toggleActions: "play none none none",
                },
                opacity: 0,
                y: 40,
                duration: 0.9,
                ease: "power3.out",
                delay: 0.3,
            });

            gsap.utils.toArray(".stat-item").forEach((el, i) => {
                gsap.from(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: "top 88%",
                        toggleActions: "play none none none",
                    },
                    opacity: 0,
                    y: 30,
                    duration: 0.7,
                    delay: i * 0.15,
                    ease: "power2.out",
                });
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section
            id="manifiesto"
            ref={sectionRef}
            className="noise-dark py-32 px-6 md:px-16 lg:px-24"
            style={{ backgroundColor: "#012160" }}
        >
            <div className="max-w-5xl mx-auto">
                {/* Section label */}
                <div className="flex items-center gap-3 mb-16">
                    <div className="h-px flex-1 max-w-[60px] bg-primary/40" />
                    <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase">
                        Manifiesto SUPASO
                    </span>
                </div>

                {/* Main text */}
                <div className="space-y-6">
                    <p className="manifesto-line-1 font-inter text-2xl md:text-3xl text-white/40 font-light leading-relaxed">
                        "Lo normal es estar solo ante el riesgo.
                        <br />
                        Inspecciones sin sustento. Decisiones sin amparo."
                    </p>

                    <p className="manifesto-line-2 font-cormorant italic text-4xl md:text-6xl lg:text-7xl text-white leading-tight">
                        Nosotros construimos el{" "}
                        <span className="text-primary">Respaldo Definitivo.</span>
                    </p>

                    <p className="manifesto-line-3 font-inter text-base md:text-lg text-white/50 max-w-2xl mt-6 font-light leading-relaxed">
                        SUPASO no es sólo un sindicato. Es una plataforma de protección activa.
                        Cada herramienta, cada beneficio, cada asesoría está diseñada para que el
                        compañero de Seguridad Ocupacional, Ambiente o Calidad en Argentina
                        nunca más enfrente solo las complejidades del sistema.
                    </p>
                </div>

                {/* Divider */}
                <div className="my-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { value: "1.200+", label: "Afiliados activos", sub: "en todo el país" },
                        { value: "19.587", label: "Ley Nacional", sub: "marco legal base" },
                        { value: "200+", label: "Prestadores", sub: "red de beneficios" },
                        { value: "24/7", label: "Asesoría Legal", sub: "siempre disponible" },
                    ].map((s) => (
                        <div key={s.value} className="stat-item">
                            <div className="text-primary font-black text-3xl md:text-4xl font-inter leading-none">
                                {s.value}
                            </div>
                            <div className="text-white font-semibold text-sm mt-2 leading-tight">
                                {s.label}
                            </div>
                            <div className="text-white/30 text-[11px] mt-0.5">{s.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Quote */}
                <div className="mt-20 flex items-start gap-4">
                    <div className="text-primary/30 font-cormorant text-8xl leading-none mt-[-20px] flex-shrink-0">
                        "
                    </div>
                    <blockquote className="font-cormorant italic text-xl md:text-2xl text-white/60 leading-relaxed">
                        El profesional de la seguridad e higiene es el primer escudo ante el accidente.
                        Merece ese mismo escudo para sí mismo.
                    </blockquote>
                </div>
            </div>
        </section>
    );
}
