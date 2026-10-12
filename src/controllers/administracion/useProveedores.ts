import { useEffect, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import {
  actualizarProveedor,
  crearProveedor,
  eliminarProveedor,
  fetchProveedores,
} from '../../models/services/proveedorService'
import { fetchOrdenes } from '../../models/services/compraService'
import type { OrdenCompraConDetalle } from '../../models/services/compraService'
import type { Proveedor } from '../../models/types'

export function useProveedores() {
  const { usuario } = useUsuario()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [ordenes, setOrdenes] = useState<OrdenCompraConDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [busqueda, setBusqueda] = useState('')
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)

  function cargar() {
    if (!usuario?.sede_id) return Promise.resolve()
    return Promise.all([fetchProveedores(usuario.tenant_id), fetchOrdenes(usuario.tenant_id, usuario.sede_id)]).then(
      ([proveedoresData, ordenesData]) => {
        setProveedores(proveedoresData)
        setOrdenes(ordenesData)
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
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los proveedores')
        setLoading(false)
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.tenant_id, usuario?.sede_id])

  const q = busqueda.trim().toLowerCase()
  const proveedoresFiltrados = proveedores.filter((p) => !q || p.nombre.toLowerCase().includes(q))
  const seleccionado = proveedores.find((p) => p.id === seleccionadoId) ?? null
  const ordenesDelSeleccionado = ordenes.filter((o) => o.proveedor_id === seleccionadoId)

  async function crear(datos: { nombre: string; contacto: string }) {
    if (!usuario) return
    setGuardando(true)
    setError(null)
    try {
      const nuevo = await crearProveedor({
        tenant_id: usuario.tenant_id,
        sede_id: usuario.sede_id,
        nombre: datos.nombre,
        contacto: datos.contacto.trim() || null,
      })
      await cargar()
      setSeleccionadoId(nuevo.id)
      setCreando(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el proveedor')
      throw err
    } finally {
      setGuardando(false)
    }
  }

  async function guardar(id: string, datos: { nombre: string; contacto: string }) {
    setGuardando(true)
    setError(null)
    try {
      const actualizado = await actualizarProveedor(id, { nombre: datos.nombre, contacto: datos.contacto.trim() || null })
      setProveedores((prev) => prev.map((p) => (p.id === id ? actualizado : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el proveedor')
      throw err
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: string) {
    setGuardando(true)
    setError(null)
    try {
      await eliminarProveedor(id)
      setProveedores((prev) => prev.filter((p) => p.id !== id))
      setSeleccionadoId((actual) => (actual === id ? null : actual))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el proveedor')
      throw err
    } finally {
      setGuardando(false)
    }
  }

  return {
    loading,
    error,
    guardando,
    busqueda,
    setBusqueda,
    proveedores: proveedoresFiltrados,
    seleccionado,
    seleccionar: setSeleccionadoId,
    ordenesDelSeleccionado,
    creando,
    setCreando,
    crear,
    guardar,
    eliminar,
    totales: {
      registrados: proveedores.length,
    },
  }
}
