-- ============================================================
-- Personalización completa — Ronda 1: color de acento, tipografía,
-- marca de agua
-- ============================================================
-- Amplía personalizacion_marca (Fase 7, Módulo 4) con lo que pidió el
-- dueño para esta ronda. La marca de agua reutiliza logo_url (no se
-- sube una imagen aparte) — el sistema de imágenes en general queda
-- para la Ronda 3, aparte. Sin cambios de RLS: la tabla ya tenía lectura
-- abierta al tenant y escritura solo administracion/gerencia (migración
-- 0025), estas columnas nuevas quedan bajo las mismas políticas.
-- ============================================================

alter table public.personalizacion_marca
  add column color_acento text,
  add column fuente text,
  add column marca_agua_activa boolean not null default false,
  add column marca_agua_opacidad numeric(3,2) not null default 0.06;
