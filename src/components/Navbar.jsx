// src/components/Navbar.jsx
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navLinks = [];

    return (
        <header
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-6xl transition-all duration-500 rounded-2xl px-6 py-3 flex items-center justify-between ${scrolled
                ? "bg-white/80 backdrop-blur-xl shadow-xl border border-white/50"
                : "bg-transparent"
                }`}
        >
            {/* Logo animado */}
            <a href="#hero" className="flex items-center gap-3 group" id="nav-logo">
                <div className="relative w-[52px] h-[52px] flex items-center justify-center flex-shrink-0">
                    <img
                        src="https://supaso.org/logo.png"
                        alt="SUPASO"
                        className="w-[30px] z-10"
                        onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentNode.querySelector(".fallback-logo").style.display = "flex";
                        }}
                    />
                    {/* Fallback logo */}
                    <div
                        className="fallback-logo hidden w-[30px] h-[30px] z-10 items-center justify-center bg-primary rounded-full text-white font-black text-xs"
                        style={{ display: "none" }}
                    >
                        SP
                    </div>
                    <div className="absolute w-full h-full border-[3px] border-success border-l-transparent rounded-full animate-spin-slow" />
                    <div className="absolute w-[75%] h-[75%] border-[3px] border-danger border-r-transparent rounded-full animate-spin-slow-reverse" />
                </div>
                <div className="flex flex-col leading-none">
                    <span
                        className={`font-black text-base tracking-widest uppercase transition-colors duration-300 ${scrolled ? "text-dark" : "text-white"
                            }`}
                    >
                        SUPASO
                    </span>
                    <span
                        className={`font-inter text-[9px] tracking-[0.2em] uppercase transition-colors duration-300 ${scrolled ? "text-primary" : "text-primary"
                            }`}
                    >
                        Seguridad con respaldo
                    </span>
                </div>
            </a>

            {/* Nav links desktop (removed) */}
            <nav className="hidden md:flex items-center gap-6">
            </nav>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-3">
                <a
                    href="https://app-supaso.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    id="nav-portal"
                    className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-all duration-200 btn-magnetic ${scrolled
                        ? "border-dark/20 text-dark hover:border-primary hover:text-primary"
                        : "border-white/30 text-white hover:border-white"
                        }`}
                >
                    Portal de Afiliados
                </a>
                <a
                    href="https://app-supaso.vercel.app/#afiliados"
                    target="_blank"
                    rel="noopener noreferrer"
                    id="nav-afiliarme"
                    className="btn-magnetic text-sm font-bold px-5 py-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/30"
                >
                    Afiliarme
                </a>
            </div>

            {/* Hamburger mobile */}
            <button
                className={`md:hidden p-2 rounded-xl transition-colors ${scrolled ? "text-dark" : "text-white"
                    }`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menú"
                id="nav-hamburger"
            >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-4 flex flex-col gap-3 md:hidden">
                    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-dark/10">
                        <a
                            href="https://app-supaso.vercel.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-center py-2 rounded-xl border border-dark/20 text-dark font-semibold text-sm hover:border-primary"
                        >
                            Portal de Afiliados
                        </a>
                        <a
                            href="https://app-supaso.vercel.app/#afiliados"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMenuOpen(false)}
                            className="text-center py-2.5 rounded-xl bg-primary text-white font-bold text-sm"
                        >
                            Afiliarme
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
}
