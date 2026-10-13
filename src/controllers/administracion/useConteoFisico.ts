import { useEffect, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { fetchInsumos, fetchInventarioSede, registrarAjusteManual } from '../../models/services/inventarioService'
import type { Insumo, InventarioSede } from '../../models/types'

export interface FilaConteo {
  insumo: Insumo
  teorico: number
  contado: string
  diferencia: number | null
}

// Conteo físico se limita a insumos 'exacto': los 'por_lote' ya se
// reconcilian lote por lote (abrir/cerrar un lote, ver Fase 4 Módulo 3),
// y un ajuste agregado aquí desincronizaría inventario_sede de la suma
// real de sus lotes. Los 'estimado' nunca se rastrean con precisión
// (arquitectura.md §5, ya decidido) — no tiene sentido contarlos.
export function useConteoFisico() {
  const { usuario } = useUsuario()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [inventario, setInventario] = useState<InventarioSede[]>([])
  const [contados, setContados] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    if (!usuario?.sede_id) return Promise.resolve()
    return Promise.all([fetchInsumos(usuario.tenant_id), fetchInventarioSede(usuario.tenant_id, usuario.sede_id)]).then(
      ([insumosData, inventarioData]) => {
        setInsumos(insumosData.filter((i) => i.tipo === 'exacto'))
        setInventario(inventarioData)
      },
    )
  }

  useEffect(() => {
    if (!usuario?.sede_id) return
    let cancelado = false
    setLoading(true)
    cargar()
      .then(() => {
        if (!cancelado) setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelado) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los insumos')
        setLoading(false)
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.tenant_id, usuario?.sede_id])

  const inventarioPorInsumo = new Map(inventario.map((inv) => [inv.insumo_id, inv]))

  const filas: FilaConteo[] = insumos.map((insumo) => {
    const teorico = inventarioPorInsumo.get(insumo.id)?.cantidad_actual ?? 0
    const contado = contados[insumo.id] ?? ''
    const contadoNumero = contado.trim() === '' ? null : Number(contado)
    return {
      insumo,
      teorico,
      contado,
      diferencia: contadoNumero === null || !Number.isFinite(contadoNumero) ? null : contadoNumero - teorico,
    }
  })

  const filasConDiferencia = filas.filter((f) => f.diferencia !== null && f.diferencia !== 0)

  function setContado(insumoId: string, valor: string) {
    setContados((prev) => ({ ...prev, [insumoId]: valor }))
  }

  async function registrarConteo() {
    if (!usuario?.sede_id || filasConDiferencia.length === 0) return
    setGuardando(true)
    setError(null)
    try {
      const fecha = new Date().toLocaleDateString('es-VE')
      for (const fila of filasConDiferencia) {
        const diferencia = fila.diferencia as number
        await registrarAjusteManual({
          tenant_id: usuario.tenant_id,
          sede_id: usuario.sede_id,
          insumo_id: fila.insumo.id,
          tipo: diferencia > 0 ? 'ajuste' : 'merma',
          cantidad: Math.abs(diferencia),
          motivo: 'Conteo físico',
          nota: `${fecha}: teórico ${fila.teorico} ${fila.insumo.unidad_de_medida}, contado ${fila.contado} ${fila.insumo.unidad_de_medida}`,
          creado_por: usuario.id,
        })
      }
      await cargar()
      setContados({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el conteo')
      throw err
    } finally {
      setGuardando(false)
    }
  }

  return {
    loading,
    error,
    guardando,
    filas,
    filasConDiferencia,
    setContado,
    registrarConteo,
  }
}
