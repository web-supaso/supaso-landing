// src/components/AdminSofia.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Trash2, Plus, RefreshCw, X } from "lucide-react";

export default function AdminSofia() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formTema, setFormTema] = useState("");
    const [formKeywords, setFormKeywords] = useState("");
    const [formContenido, setFormContenido] = useState("");

    // Un pequeño filtro para que no cualquiera entre
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Autenticación real con Supabase para poder escribir en la tabla
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@supaso.org',
            password: password
        });

        if (error) {
            console.error("Error al iniciar sesión:", error.message);
            alert("Contraseña incorrecta o error de conexión.");
        } else {
            setIsAuthenticated(true);
            fetchDocs();
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const fetchDocs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("sofia_knowledge")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error al cargar la base de conocimiento:", error);
            alert("Hubo un error cargando los datos.");
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formTema || !formKeywords || !formContenido) {
            alert("Por favor completa todos los campos.");
            return;
        }

        setLoading(true);
        const { error } = await supabase.from("sofia_knowledge").insert([{
            tema: formTema,
            palabras_claves: formKeywords.toLowerCase(),
            contenido: formContenido
        }]);

        if (error) {
            console.error("Error al guardar:", error);
            alert("Ocurrió un error al guardar el documento.");
        } else {
            setFormTema("");
            setFormKeywords("");
            setFormContenido("");
            fetchDocs();
            alert("¡Documento guardado con éxito en el cerebro de S.O.F.I.A.!");
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este documento del cerebro de S.O.F.I.A.?")) {
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from("sofia_knowledge")
            .delete()
            .match({ id });

        if (error) {
            console.error("Error al borrar:", error);
            alert("Error al borrar el documento.");
        } else {
            fetchDocs();
        }
        setLoading(false);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-6">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-dark/5">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xs">SP</div>
                    </div>
                    <h2 className="text-2xl font-black text-center text-dark mb-2">Admin S.O.F.I.A.</h2>
                    <p className="text-dark/50 text-sm text-center mb-6">Ingresá la clave maestra para acceder a la base de conocimiento.</p>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-dark/20 text-dark outline-none focus:border-primary mb-4"
                        required
                    />
                    <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {loading ? "Verificando..." : "Ingresar al Sistema"}
                    </button>
                    <button
                        type="button"
                        onClick={() => window.location.hash = ""}
                        className="w-full mt-3 text-dark/40 text-sm font-semibold hover:text-dark transition-colors"
                    >
                        Volver a la web
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fb] p-6 font-inter">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-dark/5">
                    <div>
                        <h1 className="text-2xl font-black text-dark flex items-center gap-3">
                            <span className="w-4 h-4 rounded-full bg-success animate-pulse block"></span>
                            S.O.F.I.A. Connect — Cerebro Central
                        </h1>
                        <p className="text-dark/50 text-sm mt-1 border-l-2 border-primary pl-3 ml-2">
                            Añade leyes, resoluciones y manuales. Sofía los leerá automáticamente en tiempo real.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchDocs} className="flex items-center gap-2 px-4 py-2 border border-dark/10 rounded-xl text-dark/70 hover:bg-dark/5 transition-colors font-medium text-sm">
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            Refrescar
                        </button>
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-dark text-white rounded-xl hover:bg-dark/90 transition-colors font-medium text-sm">
                            <X size={16} />
                            Cerrar Admin
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cargar nuevo documento */}
                    <div className="lg:col-span-1">
                        <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl shadow-sm border border-dark/5 flex flex-col gap-4 sticky top-6">
                            <h2 className="font-bold text-dark border-b border-dark/10 pb-3 mb-1">Cargar Nuevo Documento</h2>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-dark/60 uppercase tracking-wider">Tema / Título Corto</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Licencia por Maternidad"
                                    value={formTema}
                                    onChange={(e) => setFormTema(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border border-dark/15 text-dark outline-none focus:border-primary text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-dark/60 uppercase tracking-wider">Palabras Claves (separadas por coma)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: embarazo, maternidad, licencia, madre"
                                    value={formKeywords}
                                    onChange={(e) => setFormKeywords(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border border-dark/15 text-dark outline-none focus:border-primary text-sm"
                                    required
                                />
                                <span className="text-[10px] text-dark/40 uppercase">Si el usuario dice esto, la IA leerá este documento.</span>
                            </div>

                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-xs font-bold text-dark/60 uppercase tracking-wider">Contenido / Texto Crudo (PDF)</label>
                                <textarea
                                    placeholder="Pegar el texto de la ley, decreto o manual aquí..."
                                    value={formContenido}
                                    onChange={(e) => setFormContenido(e.target.value)}
                                    className="px-4 py-3 rounded-xl border border-dark/15 text-dark outline-none focus:border-primary text-sm min-h-[250px] resize-y"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors mt-2 disabled:opacity-50">
                                {loading ? "Guardando..." : <><Plus size={18} /> Inyectar en el Cerebro</>}
                            </button>
                        </form>
                    </div>

                    {/* Lista de documentos existentes */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <h2 className="font-bold text-dark ml-2">Documentos Almacenados ({items.length})</h2>

                        {items.length === 0 ? (
                            <div className="bg-white/50 border border-dark/10 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                                <span className="text-4xl mb-3">🧠</span>
                                <p className="font-bold text-dark">El cerebro de Sofía está vacío.</p>
                                <p className="text-dark/50 text-sm mt-1 max-w-sm">
                                    Agrega textos legales de SUPASO al panel de la izquierda para que la Inteligencia Artificial comience a estudiarlos.
                                </p>
                            </div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-dark/5 flex flex-col gap-3 group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                                    <div className="flex items-start justify-between gap-4 pl-3">
                                        <div>
                                            <h3 className="font-bold text-dark text-lg leading-tight">{item.tema}</h3>
                                            <p className="text-primary text-xs font-bold tracking-wider mt-1.5 uppercase">
                                                {item.palabras_claves}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white transition-colors flex-shrink-0"
                                            title="Eliminar del cerebro"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="pl-3 mt-1">
                                        <div className="bg-dark/5 p-4 rounded-xl text-dark/70 text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                                            {item.contenido}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
