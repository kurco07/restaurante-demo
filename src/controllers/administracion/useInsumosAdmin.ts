import { useEffect, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import {
  actualizarInsumo,
  actualizarStockMinimo,
  crearInsumo,
  eliminarInsumo,
  fetchInsumos,
  fetchInventarioSede,
} from '../../models/services/inventarioService'
import type { Insumo, InventarioSede } from '../../models/types'
import { mensajeDeError } from '../../lib/errores'

export function useInsumosAdmin() {
  const { usuario } = useUsuario()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [inventario, setInventario] = useState<InventarioSede[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    if (!usuario?.sede_id) return Promise.resolve()
    return Promise.all([
      fetchInsumos(usuario.tenant_id),
      fetchInventarioSede(usuario.tenant_id, usuario.sede_id),
    ]).then(([insumosData, inventarioData]) => {
      setInsumos(insumosData)
      setInventario(inventarioData)
    })
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
        setError(mensajeDeError(err, 'No se pudieron cargar los insumos'))
        setLoading(false)
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.tenant_id, usuario?.sede_id])

  const q = busqueda.trim().toLowerCase()
  const insumosFiltrados = insumos.filter((i) => !q || i.nombre.toLowerCase().includes(q))

  const inventarioPorInsumo = new Map(inventario.map((inv) => [inv.insumo_id, inv]))

  const bajoStock = inventario.filter(
    (inv) => inv.stock_minimo !== null && inv.cantidad_actual < inv.stock_minimo,
  ).length

  async function crear(datos: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] }) {
    if (!usuario?.sede_id) return
    setGuardando(true)
    setError(null)
    try {
      await crearInsumo({ tenant_id: usuario.tenant_id, sede_id: usuario.sede_id, ...datos })
      await cargar()
      setCreando(false)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo crear el insumo'))
      throw err
    } finally {
      setGuardando(false)
    }
  }

  async function guardar(id: string, datos: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] }) {
    setGuardando(true)
    setError(null)
    try {
      const actualizado = await actualizarInsumo(id, datos)
      setInsumos((prev) => prev.map((i) => (i.id === id ? actualizado : i)))
      setSeleccionadoId(null)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar el insumo'))
      throw err
    } finally {
      setGuardando(false)
    }
  }

  async function guardarStockMinimo(inventarioSedeId: string, stockMinimo: number | null) {
    setGuardando(true)
    setError(null)
    try {
      const actualizado = await actualizarStockMinimo(inventarioSedeId, stockMinimo)
      setInventario((prev) => prev.map((inv) => (inv.id === inventarioSedeId ? actualizado : inv)))
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar el stock mínimo'))
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: string) {
    setGuardando(true)
    setError(null)
    try {
      await eliminarInsumo(id)
      setInsumos((prev) => prev.filter((i) => i.id !== id))
      setInventario((prev) => prev.filter((inv) => inv.insumo_id !== id))
      setSeleccionadoId((actual) => (actual === id ? null : actual))
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar el insumo'))
      throw err
    } finally {
      setGuardando(false)
    }
  }

  return {
    loading,
    error,
    busqueda,
    setBusqueda,
    insumosFiltrados,
    inventarioPorInsumo,
    seleccionado: insumos.find((i) => i.id === seleccionadoId) ?? null,
    seleccionar: setSeleccionadoId,
    creando,
    setCreando,
    guardando,
    crear,
    guardar,
    guardarStockMinimo,
    eliminar,
    resumen: {
      registrados: insumos.length,
      bajoStock,
    },
  }
}
