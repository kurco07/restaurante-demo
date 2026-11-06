import { useCallback, useEffect, useState } from 'react'
import type { DiaHistorial, ReporteDiario } from '../../models/types'
import { fetchHistorialDiario, fetchReporteDiario } from '../../models/services/reporteDiarioService'
import { mensajeDeError } from '../../lib/errores'

// 'YYYY-MM-DD' de una fecha en la hora local del navegador
export function claveDia(fecha: Date) {
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${m}-${d}`
}

export function sumarDiasClave(clave: string, dias: number) {
  const [a, m, d] = clave.split('-').map(Number)
  return claveDia(new Date(a, m - 1, d + dias))
}

// Reporte de un día (Fase 5, Módulo 2). Sin dia = hoy, que es lo único que
// puede pedir el supervisor. recargar() vuelve a pedirlo: el día de hoy
// sigue cambiando mientras haya servicio.
export function useReporteDiario(dia?: string, sedeId?: string) {
  const [datos, setDatos] = useState<ReporteDiario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    fetchReporteDiario(dia, sedeId)
      .then((r) => {
        if (cancelado) return
        setDatos(r)
        setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(mensajeDeError(e))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [dia, sedeId, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { datos, cargando, error, recargar }
}

// Historial de los últimos `dias` días hasta hoy, solo gerencia. Sin
// sedeId suma todas las sedes.
export function useHistorialDiario(dias: number, sedeId?: string) {
  const [filas, setFilas] = useState<DiaHistorial[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    const hasta = claveDia(new Date())
    fetchHistorialDiario(sumarDiasClave(hasta, -(dias - 1)), hasta, sedeId)
      .then((r) => {
        if (cancelado) return
        setFilas(r)
        setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(mensajeDeError(e))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [dias, sedeId])

  return { filas, cargando, error }
}
