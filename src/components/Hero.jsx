// src/components/Hero.jsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ChevronDown, Shield, FileCheck, Users } from "lucide-react";

export default function Hero() {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ delay: 0.3 });
            tl.from(".hero-badge", { opacity: 0, y: 20, duration: 0.6, ease: "power3.out" })
                .from(".hero-line-1", { opacity: 0, y: 50, duration: 0.8, ease: "power3.out" }, "-=0.3")
                .from(".hero-line-2", { opacity: 0, y: 50, duration: 0.9, ease: "power3.out" }, "-=0.5")
                .from(".hero-sub", { opacity: 0, y: 30, duration: 0.7, ease: "power3.out" }, "-=0.4")
                .from(".hero-ctas", { opacity: 0, y: 20, duration: 0.6, ease: "power3.out" }, "-=0.3")
                .from(".hero-stats", { opacity: 0, y: 20, duration: 0.7, ease: "power3.out", stagger: 0.1 }, "-=0.2");
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section
            id="hero"
            ref={containerRef}
            className="relative min-h-[100dvh] flex flex-col justify-end overflow-hidden"
        >
            {/* Background Image + Gradient */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1920&q=80"
                    alt="Industrial atmosphere"
                    className="w-full h-full object-cover object-center"
                />
                {/* Multi-layer gradient for cinematic look */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-[#012160]/75 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                {/* Horizontal light strip */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            </div>

            {/* Grid overlay */}
            <div
                className="absolute inset-0 z-0 opacity-10"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,134,206,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,134,206,0.3) 1px, transparent 1px)",
                    backgroundSize: "80px 80px",
                }}
            />

            {/* Content */}
            <div className="relative z-10 px-6 md:px-16 lg:px-24 pb-20 pt-40 max-w-6xl mx-auto w-full">
                {/* Badge */}
                <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 backdrop-blur-sm mb-8">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot inline-block" />
                    <span className="text-xs font-semibold text-white/90 tracking-widest uppercase">
                        Sindicato para trabajadores de Ambiente – Calidad y Seguridad Ocupacional
                    </span>
                </div>

                {/* Main title */}
                <h1 className="text-white font-inter font-black mb-4 leading-[0.9]">
                    <span className="hero-line-1 block text-5xl md:text-7xl lg:text-8xl tracking-tight">
                        La Prevención<br />es nuestro
                    </span>
                    <span className="hero-line-2 block font-cormorant italic text-7xl md:text-9xl lg:text-[130px] text-primary leading-none mt-2">
                        Estándar
                    </span>
                </h1>

                {/* Subheading */}
                <p className="hero-sub text-white/70 text-base md:text-xl max-w-xl mt-6 leading-relaxed font-inter font-light">
                    Respaldo legal institucional, credencial activa y red de beneficios
                    para profesionales de Seguridad e Higiene, Ambiente y Calidad en Argentina.
                </p>

                {/* CTAs */}
                <div className="hero-ctas flex flex-wrap gap-4 mt-10">
                    <a
                        href="#sofia"
                        id="hero-cta-afiliarme"
                        className="btn-magnetic px-8 py-4 rounded-2xl bg-primary text-white font-bold text-base shadow-2xl shadow-primary/40 flex items-center gap-2"
                    >
                        <Shield size={18} />
                        Afiliarme
                    </a>
                    <a
                        href="https://app-supaso.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        id="hero-cta-portal"
                        className="btn-magnetic px-8 py-4 rounded-2xl border border-white/30 text-white font-semibold text-base backdrop-blur-sm hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <FileCheck size={18} />
                        Portal de Afiliados
                    </a>
                </div>

                {/* Stats row */}
                <div className="hero-stats flex flex-wrap gap-8 mt-14 pt-8 border-t border-white/10">
                    {[
                        { icon: Users, value: "1.200+", label: "Profesionales Afiliados" },
                        { icon: Shield, value: "Ley 19.587", label: "Marco Legal Vigente" },
                        { icon: FileCheck, value: "SRT", label: "Resoluciones Validadas" },
                    ].map(({ icon: Icon, value, label }) => (
                        <div key={label} className="hero-stats flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                                <Icon size={18} className="text-primary" />
                            </div>
                            <div>
                                <div className="text-white font-black text-lg leading-none">{value}</div>
                                <div className="text-white/50 text-xs mt-0.5">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-60">
                <span className="text-white text-[10px] tracking-widest uppercase">Explorar</span>
                <ChevronDown size={18} className="text-white animate-bounce" />
            </div>
        </section>
    );
}
