-- ============================================================
-- Personalización completa — Ronda 1 (ajuste): tamaño de la marca de agua
-- ============================================================
-- El dueño probó la marca de agua (migración 0036) y pidió poder ajustar
-- el tamaño desde Configuración, en vez de tenerlo fijo en el código.
-- Mismo patrón que marca_agua_opacidad: un número guardado, sin RLS
-- nueva (ya cubierta por las políticas de personalizacion_marca).
-- ============================================================

alter table public.personalizacion_marca
  add column marca_agua_tamano integer not null default 680;
