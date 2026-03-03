// src/components/Footer.jsx
import { Shield, Mail, Globe, Instagram, ExternalLink } from "lucide-react";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="noise-dark bg-[#010d2b] py-20 px-6 md:px-16 lg:px-24">
            <div className="max-w-6xl mx-auto">
                {/* Top row */}
                <div className="grid md:grid-cols-4 gap-12 mb-16">

                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="relative w-[52px] h-[52px] flex items-center justify-center flex-shrink-0">
                                <img
                                    src="https://supaso.org/logo.png"
                                    alt="SUPASO"
                                    className="w-[30px] z-10"
                                    onError={(e) => { e.target.style.display = "none"; }}
                                />
                                <div className="absolute w-full h-full border-[3px] border-success border-l-transparent rounded-full animate-spin-slow" />
                                <div className="absolute w-[75%] h-[75%] border-[3px] border-danger border-r-transparent rounded-full animate-spin-slow-reverse" />
                            </div>
                            <div>
                                <div className="text-white font-black text-lg tracking-widest uppercase">SUPASO</div>
                                <div className="text-primary text-[9px] tracking-[0.2em] uppercase">
                                    Seguridad Ocupacional · Ambiente · Calidad
                                </div>
                            </div>
                        </div>
                        <p className="text-white/40 text-sm leading-relaxed max-w-sm">
                            Protegemos a los profesionales de Seguridad Ocupacional,
                            Ambiente y Calidad en Argentina. Respaldo legal institucional,
                            credencial activa y formación continua de excelencia.
                        </p>
                        <div className="flex items-center gap-4 mt-6">
                            <a
                                href="mailto:soporte@supaso.org"
                                className="text-white/30 hover:text-primary transition-colors"
                                aria-label="Email"
                            >
                                <Mail size={18} />
                            </a>
                            <a
                                href="https://supaso.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/30 hover:text-primary transition-colors"
                                aria-label="Sitio web"
                            >
                                <Globe size={18} />
                            </a>
                            <a
                                href="https://instagram.com/supaso_oficial"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/30 hover:text-primary transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Links Institución */}
                    <div>
                        <h4 className="text-white/80 font-bold text-xs uppercase tracking-widest mb-5">
                            Institución
                        </h4>
                        <ul className="space-y-3">
                            {[
                                { label: "¿Qué es SUPASO?", href: "#manifiesto" },
                                { label: "Marco Legal", href: "#features" },
                                { label: "Credencial Activa", href: "#features" },
                                { label: "Intranet", href: "https://app-supaso.vercel.app/admin.html", ext: true },
                            ].map((l) => (
                                <li key={l.label}>
                                    <a
                                        href={l.href}
                                        target={l.ext ? "_blank" : undefined}
                                        rel={l.ext ? "noopener noreferrer" : undefined}
                                        className="text-white/40 text-sm hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        {l.label}
                                        {l.ext && <ExternalLink size={10} className="opacity-50" />}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Links Afiliados */}
                    <div>
                        <h4 className="text-white/80 font-bold text-xs uppercase tracking-widest mb-5">
                            Afiliados
                        </h4>
                        <ul className="space-y-3">
                            {[
                                { label: "Portal de Afiliados", href: "https://app-supaso.vercel.app", ext: true },
                                { label: "Afiliarme", href: "https://app-supaso.vercel.app/#afiliados", ext: true },
                                { label: "Actualizar datos", href: "https://app-supaso.vercel.app", ext: true },
                                { label: "Contacto y soporte", href: "mailto:soporte@supaso.org", ext: true },
                            ].map((l) => (
                                <li key={l.label}>
                                    <a
                                        href={l.href}
                                        target={l.ext ? "_blank" : undefined}
                                        rel={l.ext ? "noopener noreferrer" : undefined}
                                        className="text-white/40 text-sm hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        {l.label}
                                        {l.ext && <ExternalLink size={10} className="opacity-50" />}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Legal strip */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-white/20 text-xs">
                        <Shield size={12} />
                        <span>
                            © {year} SUPASO ·v2.0 Todos los derechos reservados · Registro Sindical -MTESS N° 3156
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-white/20 text-xs hover:text-white/50 transition-colors">
                            Política de Privacidad
                        </a>
                        <a href="#" className="text-white/20 text-xs hover:text-white/50 transition-colors">
                            Términos de Servicio
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
