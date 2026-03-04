import { createClient } from "@supabase/supabase-js";
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const envLines = envFile.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';

envLines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const faqs = [
    {
        tema: "Beneficios de afiliarse",
        palabras_claves: "beneficio, beneficios, ventajas, porque afiliarme, por qué afiliarme, que gano",
        contenido: "Al afiliarte a SUPASO obtenés respaldo legal especializado en Seguridad y Ambiente, protección gremial ante abusos, acceso a capacitaciones exclusivas, y descuentos en una amplia red de comercios, turismo y salud."
    },
    {
        tema: "Proceso de afiliación",
        palabras_claves: "proceso, afiliacion, afiliarme, como me afilio, requisitos, formulario, tramitar, asociarme",
        contenido: "Afiliarse es muy simple y 100% digital. Sólo tenés que hacer clic en el botón 'Alta de Afiliados' o 'Quiero afiliarme' que figura aquí en la pantalla para ir al portal oficial."
    },
    {
        tema: "Valor de la cuota",
        palabras_claves: "cuota, valor, precio, costo, descuento, cuanto sale, cuanto cuesta, pagar",
        contenido: "La cuota sindical para profesionales en relación de dependencia es del 2,5% del sueldo bruto y se descuenta por recibo automáticamente. Si sos monotributista o consultor independiente, el valor varía según tu facturación."
    },
    {
        tema: "Afiliación para tercerizados y monotributistas",
        palabras_claves: "tercerizado, tercerizada, monotributo, monotributista, consultor, independiente, freelance",
        contenido: "¡Por supuesto! SUPASO representa a todos los profesionales de Higiene, Seguridad y Ambiente. Podés afiliarte sin problema como consultor independiente o monotributista abonando una cuota adaptada a tu caso."
    },
    {
        tema: "Cargos de Supervisión y Jefatura",
        palabras_claves: "jefe, jefatura, supervisor, supervision, fuera de convenio, gerente, gerencia",
        contenido: "Al ser un Sindicato Único Profesional e integral, SUPASO agrupa y defiende a los trabajadores sin importar si ocupás un rol operativo de base, de supervisión o jefatura en Calidad o HSE. Vení con nosotros, estás 100% amparado."
    },
    {
        tema: "Defensa legal desde el primer día",
        palabras_claves: "carencia, primer dia, defensa, desde cuando, antigüedad, comienzo, empieza",
        contenido: "Absolutamente sí. Desde el momento exacto en que tu ficha de afiliación es aprobada, contás con la máxima protección gremial y acceso prioritario al equipo legal del sindicato."
    },
    {
        tema: "Cambio de empresa y antigüedad",
        palabras_claves: "cambio de trabajo, cambio empresa, renuncio, me despiden, otra empresa, sigo afiliado",
        contenido: "Sí, mantenés todo. Tu afiliación y tus beneficios son con SUPASO, el sindicato de tu profesión, no con una empresa específica. Si cambiás de empleo pero seguís en el rubro, tu cobertura sigue ininterrumpida."
    }
];

async function insertFaqs() {
    // Limpiamos los textos de prueba
    await supabase.from("sofia_knowledge").delete().like("tema", "%vacaciones%");

    // Insertamos las 7 preguntas maestras
    const { data, error } = await supabase.from("sofia_knowledge").insert(faqs);
    if (error) {
        console.error("Error al inyectar FAQs:", error);
    } else {
        console.log("¡7 FAQs Inyectadas con Éxito en el Cerebro de Sofía!");
    }
}

insertFaqs();
