import { useEffect, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { fetchInsumos } from '../../models/services/inventarioService'
import { fetchLotesPorInsumo, registrarLote } from '../../models/services/loteService'
import type { EstadoLote, Insumo, LoteInsumo } from '../../models/types'

const DIAS_POR_VENCER = 3

export function estadoLote(lote: LoteInsumo): EstadoLote {
  if (lote.cerrado_en !== null || lote.cantidad_restante <= 0) return 'agotado'
  if (lote.fecha_vencimiento) {
    const diasRestantes = (new Date(lote.fecha_vencimiento).getTime() - Date.now()) / 86_400_000
    if (diasRestantes <= DIAS_POR_VENCER) return 'por_vencer'
  }
  return 'activo'
}

// El insumo activo viene de la URL (/administracion/insumos/:insumoId/lotes).
export function useLotesInsumo(insumoId: string | undefined) {
  const { usuario } = useUsuario()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [lotes, setLotes] = useState<LoteInsumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const insumo = insumos.find((i) => i.id === insumoId) ?? null

  useEffect(() => {
    if (!usuario?.sede_id) return
    let cancelado = false
    setLoading(true)
    fetchInsumos(usuario.tenant_id)
      .then((data) => {
        if (!cancelado) setInsumos(data)
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(err instanceof Error ? err.message : 'No se pudieron cargar los insumos')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.tenant_id, usuario?.sede_id])

  useEffect(() => {
    if (!usuario?.sede_id || !insumoId) {
      setLotes([])
      return
    }
    let cancelado = false
    fetchLotesPorInsumo(usuario.tenant_id, usuario.sede_id, insumoId)
      .then((data) => {
        if (!cancelado) setLotes(data)
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(err instanceof Error ? err.message : 'No se pudieron cargar los lotes')
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.tenant_id, usuario?.sede_id, insumoId])

  const lotesOrdenados = [...lotes].sort((a, b) => {
    if (a.fecha_vencimiento === null && b.fecha_vencimiento === null) return 0
    if (a.fecha_vencimiento === null) return 1
    if (b.fecha_vencimiento === null) return -1
    return a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)
  })

  const activos = lotes.filter((l) => estadoLote(l) !== 'agotado')
  const primerActivoId = lotesOrdenados.find((l) => estadoLote(l) !== 'agotado')?.id

  async function crear(datos: { cantidad_inicial: number; fecha_vencimiento: string | null }) {
    if (!usuario?.sede_id || !insumoId) return
    setGuardando(true)
    setError(null)
    try {
      const nuevo = await registrarLote({
        tenant_id: usuario.tenant_id,
        sede_id: usuario.sede_id,
        insumo_id: insumoId,
        creado_por: usuario.id,
        ...datos,
      })
      setLotes((prev) => [nuevo, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el lote')
    } finally {
      setGuardando(false)
    }
  }

  return {
    loading,
    error,
    guardando,
    insumo,
    lotes: lotesOrdenados,
    primerActivoId,
    selector: insumos.filter((i) => i.tipo === 'por_lote'),
    crear,
    resumen: {
      stockTotal: activos.reduce((suma, l) => suma + l.cantidad_restante, 0),
      lotesActivos: activos.length,
      porVencer: lotes.filter((l) => estadoLote(l) === 'por_vencer').length,
    },
  }
}
