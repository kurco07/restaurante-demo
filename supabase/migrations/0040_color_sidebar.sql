-- ============================================================
-- Personalización completa — Ronda 1 (ajuste): color de la barra
-- lateral de Administración/Gerencia
-- ============================================================
-- La barra lateral (PanelSidebar.tsx) usaba --ink, la misma variable del
-- color de texto de toda la app — por eso nunca se podía personalizar sin
-- arriesgar la legibilidad del resto de las pantallas. Columna propia,
-- nula = se queda con el marrón oscuro por defecto de la plataforma.
-- Mismo patrón que color_acento: sin RLS nueva, ya cubierta por las
-- políticas de personalizacion_marca (migración 0025).
-- ============================================================

alter table public.personalizacion_marca
  add column color_sidebar text;
