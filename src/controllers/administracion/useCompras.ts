import { useEffect, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { fetchInsumos } from '../../models/services/inventarioService'
import { fetchProveedores } from '../../models/services/proveedorService'
import {
  aprobarOrden,
  actualizarItemsBorrador,
  crearOrdenBorrador,
  eliminarBorrador,
  fetchOrdenes,
  registrarRecepcion,
  totalOrden,
  type OrdenCompraConDetalle,
} from '../../models/services/compraService'
import type { EstadoOrdenCompra, Insumo, Proveedor } from '../../models/types'
import { mensajeDeError } from '../../lib/errores'

export type FiltroCompras = 'todas' | EstadoOrdenCompra

export const filtrosCompras: { key: FiltroCompras; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'borrador', label: 'Borrador' },
  { key: 'aprobada', label: 'Aprobada' },
  { key: 'recibida', label: 'Recibida' },
]

export { totalOrden }
export type { OrdenCompraConDetalle }

export interface ItemFormulario {
  insumo_id: string
  cantidad: number
  costo_estimado: number | null
}

export function useCompras() {
  const { usuario } = useUsuario()
  const [ordenes, setOrdenes] = useState<OrdenCompraConDetalle[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [filtro, setFiltro] = useState<FiltroCompras>('todas')
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)

  function cargar() {
    if (!usuario?.sede_id) return Promise.resolve()
    return Promise.all([
      fetchOrdenes(usuario.tenant_id, usuario.sede_id),
      fetchProveedores(usuario.tenant_id),
      fetchInsumos(usuario.tenant_id),
    ]).then(([ordenesData, proveedoresData, insumosData]) => {
      setOrdenes(ordenesData)
      setProveedores(proveedoresData)
      setInsumos(insumosData)
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
        setError(mensajeDeError(err, 'No se pudieron cargar las órdenes de compra'))
        setLoading(false)
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.tenant_id, usuario?.sede_id])

  const ordenesFiltradas = ordenes.filter((o) => filtro === 'todas' || o.estado === filtro)
  const seleccionada = ordenes.find((o) => o.id === seleccionadaId) ?? null

  const hoy = new Date()
  const ordenesMes = ordenes.filter((o) => {
    const fecha = new Date(o.creado_en)
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
  })

  async function crear(datos: { proveedor_id: string; items: ItemFormulario[] }) {
    if (!usuario?.sede_id) return
    setGuardando(true)
    setError(null)
    try {
      const nuevoId = await crearOrdenBorrador({
        tenant_id: usuario.tenant_id,
        sede_id: usuario.sede_id,
        proveedor_id: datos.proveedor_id,
        creada_por: usuario.id,
        items: datos.items,
      })
      await cargar()
      setSeleccionadaId(nuevoId)
      setCreando(false)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo crear la orden'))
      throw err
    } finally {
      setGuardando(false)
    }
  }

  async function guardarItems(ordenId: string, items: ItemFormulario[]) {
    if (!usuario) return
    setGuardando(true)
    setError(null)
    try {
      await actualizarItemsBorrador(ordenId, usuario.tenant_id, items)
      await cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar la orden'))
      throw err
    } finally {
      setGuardando(false)
    }
  }

  async function aprobar(ordenId: string) {
    if (!usuario) return
    setGuardando(true)
    setError(null)
    try {
      await aprobarOrden(ordenId, usuario.id)
      await cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo aprobar la orden'))
    } finally {
      setGuardando(false)
    }
  }

  async function descartar(ordenId: string) {
    setGuardando(true)
    setError(null)
    try {
      await eliminarBorrador(ordenId)
      await cargar()
      setSeleccionadaId(null)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo descartar el borrador'))
    } finally {
      setGuardando(false)
    }
  }

  async function recibir(orden: OrdenCompraConDetalle, fechasVencimiento: Record<string, string | null>) {
    setGuardando(true)
    setError(null)
    try {
      await registrarRecepcion(orden, fechasVencimiento)
      await cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo registrar la recepción'))
      throw err
    } finally {
      setGuardando(false)
    }
  }

  return {
    loading,
    error,
    guardando,
    filtro,
    setFiltro,
    ordenesFiltradas,
    seleccionada,
    seleccionar: setSeleccionadaId,
    creando,
    setCreando,
    proveedores,
    insumos,
    crear,
    guardarItems,
    aprobar,
    descartar,
    recibir,
    resumen: {
      ordenes: ordenesMes.length,
      comprometido: ordenesMes.reduce((suma, o) => suma + totalOrden(o), 0),
      borradores: ordenes.filter((o) => o.estado === 'borrador').length,
    },
  }
}
