import { useEffect, useState } from 'react'
import type { CategoriaMenu, Insumo, MenuItem, Receta } from '../../../../models/types'
import {
  actualizarCategoria,
  actualizarMenuItem,
  agregarRecetaItem,
  crearCategoria,
  crearMenuItem,
  eliminarCategoria,
  eliminarMenuItem,
  eliminarRecetaItem,
  fetchCategorias,
  fetchMenuItems,
  fetchRecetaPorMenuItem,
} from '../../../../models/services/menuService'
import { crearInsumo, fetchInsumos } from '../../../../models/services/inventarioService'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../../components/ui/ErrorMessage'
import { CategoriasSection } from './CategoriasSection'
import { MenuItemsSection } from './MenuItemsSection'

interface MenuAdminProps {
  tenantId: string
}

export function MenuAdmin({ tenantId }: MenuAdminProps) {
  const [categorias, setCategorias] = useState<CategoriaMenu[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [recetaPorItem, setRecetaPorItem] = useState<Record<string, Receta[]>>({})
  const [itemExpandido, setItemExpandido] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchCategorias(tenantId), fetchMenuItems(tenantId), fetchInsumos(tenantId)])
      .then(([categoriasData, menuItemsData, insumosData]) => {
        if (cancelled) return
        setCategorias(categoriasData)
        setMenuItems(menuItemsData)
        setInsumos(insumosData)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'No se pudo cargar el menú.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenantId])

  async function handleCrearCategoria(nombre: string, orden: number) {
    const nueva = await crearCategoria(tenantId, nombre, orden)
    setCategorias((prev) => [...prev, nueva])
  }

  async function handleActualizarCategoria(id: string, nombre: string) {
    const actualizada = await actualizarCategoria(id, nombre)
    setCategorias((prev) => prev.map((c) => (c.id === id ? actualizada : c)))
  }

  async function handleEliminarCategoria(id: string) {
    await eliminarCategoria(id)
    setCategorias((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleCrearItem(item: {
    categoria_id: string
    nombre: string
    descripcion?: string
    precio_base: number
  }) {
    const nuevo = await crearMenuItem({ tenant_id: tenantId, ...item })
    setMenuItems((prev) => [...prev, nuevo])
  }

  async function handleActualizarItem(
    id: string,
    cambios: { categoria_id: string; nombre: string; descripcion?: string; precio_base: number },
  ) {
    const actualizado = await actualizarMenuItem(id, cambios)
    setMenuItems((prev) => prev.map((item) => (item.id === id ? actualizado : item)))
  }

  async function handleEliminarItem(id: string) {
    await eliminarMenuItem(id)
    setMenuItems((prev) => prev.filter((item) => item.id !== id))
    if (itemExpandido === id) setItemExpandido(null)
  }

  async function handleToggleReceta(menuItemId: string) {
    if (itemExpandido === menuItemId) {
      setItemExpandido(null)
      return
    }
    setItemExpandido(menuItemId)
    if (!recetaPorItem[menuItemId]) {
      const receta = await fetchRecetaPorMenuItem(menuItemId)
      setRecetaPorItem((prev) => ({ ...prev, [menuItemId]: receta }))
    }
  }

  async function handleAgregarRecetaLinea(
    menuItemId: string,
    linea: {
      insumoId?: string
      insumoNuevo?: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] }
      cantidadRequerida: number
      unidad: string
    },
  ) {
    let insumoId = linea.insumoId

    if (!insumoId && linea.insumoNuevo) {
      const nuevoInsumo = await crearInsumo({ tenant_id: tenantId, ...linea.insumoNuevo })
      setInsumos((prev) => [...prev, nuevoInsumo])
      insumoId = nuevoInsumo.id
    }

    if (!insumoId) throw new Error('Falta el insumo.')

    const nuevaLinea = await agregarRecetaItem({
      tenant_id: tenantId,
      menu_item_id: menuItemId,
      insumo_id: insumoId,
      cantidad_requerida: linea.cantidadRequerida,
      unidad: linea.unidad,
    })
    setRecetaPorItem((prev) => ({
      ...prev,
      [menuItemId]: [...(prev[menuItemId] ?? []), nuevaLinea],
    }))
  }

  async function handleEliminarRecetaLinea(menuItemId: string, recetaId: string) {
    await eliminarRecetaItem(recetaId)
    setRecetaPorItem((prev) => ({
      ...prev,
      [menuItemId]: (prev[menuItemId] ?? []).filter((linea) => linea.id !== recetaId),
    }))
  }

  if (loading) return <LoadingSpinner message="Cargando menú…" />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <CategoriasSection
        categorias={categorias}
        onCrear={handleCrearCategoria}
        onActualizar={handleActualizarCategoria}
        onEliminar={handleEliminarCategoria}
      />
      <MenuItemsSection
        categorias={categorias}
        menuItems={menuItems}
        insumos={insumos}
        recetaPorItem={recetaPorItem}
        itemExpandido={itemExpandido}
        onCrearItem={handleCrearItem}
        onActualizarItem={handleActualizarItem}
        onEliminarItem={handleEliminarItem}
        onToggleReceta={handleToggleReceta}
        onAgregarRecetaLinea={handleAgregarRecetaLinea}
        onEliminarRecetaLinea={handleEliminarRecetaLinea}
      />
    </div>
  )
}
