// src/lib/supabaseClient.js
// ─────────────────────────────────────────────────────────────────
// Cliente Supabase para la landing de SUPASO.
// Los leads capturados por S.O.F.I.A. se insertan en la tabla
// `leads_sofia` (columnas: id, whatsapp, created_at).
//
// AUTOMATIZACIÓN:
// Make.com se conecta a esta tabla de Supabase mediante un
// trigger o un Watch Row module para disparar el flujo de
// bienvenida/confirmación por WhatsApp de forma automática.
// ─────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Inserta un nuevo lead en la tabla leads_sofia.
 * @param {string} whatsapp - Número de WhatsApp del profesional
 * @returns {{ data, error }}
 */
export async function insertLead(whatsapp) {
    const { data, error } = await supabase
        .from("leads_sofia")
        .insert([{ whatsapp }])
        .select();
    return { data, error };
}
