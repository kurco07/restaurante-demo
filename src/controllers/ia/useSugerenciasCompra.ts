import { useCallback, useEffect, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { fetchProveedores } from '../../models/services/proveedorService'
import {
  aprobarSugerenciaCompra,
  fetchSedeServidor,
  fetchSugerenciasCompra,
  generarSugerenciaCompra,
  rechazarSugerencia,
} from '../../models/services/sugerenciaCompraService'
import type { ItemAprobadoCompra, Proveedor, SugerenciaCompra } from '../../models/types'
import { mensajeDeError } from '../../lib/errores'

// Bandeja de sugerencias de compra de administración (Fase 6, Módulos 2 y
// 5): generar con la IA, revisar, aprobar (crea borradores de orden) o
// rechazar con motivo.
export function useSugerenciasCompra() {
  const { usuario } = useUsuario()
  const [sugerencias, setSugerencias] = useState<SugerenciaCompra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Resultado de la última acción, para mostrarlo arriba
  const [aviso, setAviso] = useState<string | null>(null)

  // Sede según el servidor (ver fetchSedeServidor): es la que usa la Edge
  // Function al generar, así que la bandeja mira esa y no la del perfil local
  const [sede, setSede] = useState<{ sedeId: string | null; sedeNombre: string | null } | null>(null)

  const usuarioId = usuario?.id
  const tenantId = usuario?.tenant_id

  const cargar = useCallback(async () => {
    if (!usuarioId || !tenantId) return
    const sedeServidor = await fetchSedeServidor(usuarioId)
    setSede(sedeServidor)
    if (!sedeServidor.sedeId) return
    const [lista, provs] = await Promise.all([fetchSugerenciasCompra(sedeServidor.sedeId), fetchProveedores(tenantId)])
    setSugerencias(lista)
    setProveedores(provs)
  }, [usuarioId, tenantId])

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    cargar()
      .catch((e: unknown) => {
        if (!cancelado) setError(mensajeDeError(e))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [cargar])

  async function generar() {
    setGenerando(true)
    setError(null)
    setAviso(null)
    try {
      const r = await generarSugerenciaCompra()
      if (!r.ok) {
        setError(r.mensaje)
        return
      }
      if (!r.sugerenciaId) setAviso(r.mensaje ?? 'No hace falta comprar nada por ahora.')
      await cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setGenerando(false)
    }
  }

  async function aprobar(id: string, items: ItemAprobadoCompra[]) {
    setGuardando(true)
    setError(null)
    setAviso(null)
    try {
      const ordenes = await aprobarSugerenciaCompra(id, items)
      setAviso(
        `Sugerencia aprobada: se ${ordenes === 1 ? 'creó 1 borrador' : `crearon ${ordenes} borradores`} de orden en Compras. Revísalos y apruébalos ahí.`,
      )
      await cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setGuardando(false)
    }
  }

  async function rechazar(id: string, motivo: string) {
    setGuardando(true)
    setError(null)
    setAviso(null)
    try {
      await rechazarSugerencia(id, motivo)
      setAviso('Sugerencia rechazada.')
      await cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setGuardando(false)
    }
  }

  return {
    sedeNombre: sede?.sedeNombre ?? null,
    // El perfil guardado en este navegador dice otra sede que el servidor:
    // pasa justo después de cambiar la sede de un usuario
    perfilDesactualizado: !!sede && !!usuario && sede.sedeId !== usuario.sede_id,
    pendientes: sugerencias.filter((s) => s.estado === 'pendiente'),
    revisadas: sugerencias.filter((s) => s.estado !== 'pendiente'),
    proveedores,
    cargando,
    generando,
    guardando,
    error,
    aviso,
    generar,
    aprobar,
    rechazar,
  }
}
