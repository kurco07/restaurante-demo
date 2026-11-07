-- ============================================================
-- Personalización completa — Ronda 2: redes sociales
-- ============================================================
-- Acceso directo a redes desde la vitrina pública (InicioPage.tsx).
-- Alcance confirmado con el dueño: Instagram, WhatsApp (botón de
-- contacto, nunca para pedir — eso sigue siendo solo QR en la mesa,
-- CLAUDE.md), Facebook y un enlace libre con su propia etiqueta (para
-- TikTok, sitio propio, Google Maps, lo que sea). Todos opcionales —
-- null = no se muestra ese botón. Sin RLS nueva, ya cubierta por las
-- políticas de personalizacion_marca (migración 0025).
-- ============================================================

alter table public.personalizacion_marca
  add column red_instagram text,
  add column red_whatsapp text,
  add column red_facebook text,
  add column red_enlace_libre text,
  add column red_enlace_libre_etiqueta text;
