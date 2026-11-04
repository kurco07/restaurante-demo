import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { CategoriaFiltros } from './CategoriaFiltros'
import { PlatosLista } from './PlatosLista'
import { PlatoDetallePanel } from './PlatoDetallePanel'
import { mensajeDeError } from '../../../../lib/errores'
import { avisar } from '../../../../controllers/avisos/avisos'

interface MenuAdminProps {
  tenantId: string
  sedeId: string
}

export function MenuAdmin({ tenantId, sedeId }: MenuAdminProps) {
  const [categorias, setCategorias] = useState<CategoriaMenu[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [recetaPorItem, setRecetaPorItem] = useState<Record<string, Receta[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  // ?plato=<id> abre ese plato directo. Hoy nadie enlaza aquí: gerencia
  // dejó de entrar a administración y ve las recetas en su propia ficha.
  const [searchParams] = useSearchParams()
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(() => searchParams.get('plato'))
  const [creando, setCreando] = useState(false)

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
        setError(mensajeDeError(err, 'No se pudo cargar el menú.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenantId])

  // Carga la receta del plato apenas se selecciona, no antes.
  useEffect(() => {
    if (!seleccionadoId || recetaPorItem[seleccionadoId]) return
    fetchRecetaPorMenuItem(seleccionadoId)
      .then((receta) => {
        setRecetaPorItem((prev) => ({ ...prev, [seleccionadoId]: receta }))
      })
      .catch((err: unknown) => avisar.error(err, 'No se pudo cargar la receta del plato'))
  }, [seleccionadoId, recetaPorItem])

  const platosFiltrados = menuItems.filter((item) => {
    const coincideCategoria = categoriaFiltro === 'todas' || item.categoria_id === categoriaFiltro
    const coincideBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return coincideCategoria && coincideBusqueda
  })

  const seleccionado = menuItems.find((i) => i.id === seleccionadoId) ?? null

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
    if (categoriaFiltro === id) setCategoriaFiltro('todas')
  }

  function handleSeleccionar(id: string) {
    setSeleccionadoId(id)
    setCreando(false)
  }

  function handleNuevo() {
    setCreando(true)
    setSeleccionadoId(null)
  }

  async function handleGuardarPlato(datos: {
    categoria_id: string
    nombre: string
    descripcion?: string
    precio_base: number
  }) {
    if (creando) {
      const nuevo = await crearMenuItem({ tenant_id: tenantId, ...datos })
      setMenuItems((prev) => [...prev, nuevo])
      setCreando(false)
      setSeleccionadoId(nuevo.id)
    } else if (seleccionadoId) {
      const actualizado = await actualizarMenuItem(seleccionadoId, datos)
      setMenuItems((prev) => prev.map((item) => (item.id === seleccionadoId ? actualizado : item)))
    }
  }

  async function handleEliminarPlato(id: string) {
    await eliminarMenuItem(id)
    setMenuItems((prev) => prev.filter((item) => item.id !== id))
    if (seleccionadoId === id) setSeleccionadoId(null)
  }

  async function handleAgregarRecetaLinea(linea: {
    insumoId?: string
    insumoNuevo?: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] }
    cantidadRequerida: number
    unidad: string
  }) {
    if (!seleccionadoId) return
    let insumoId = linea.insumoId

    // Si ya existe un insumo con ese nombre (por ejemplo, se creó en un
    // intento anterior y lo que falló fue agregar la línea), se reutiliza
    // en vez de crear otro igual
    if (!insumoId && linea.insumoNuevo) {
      const nombre = linea.insumoNuevo.nombre.trim().toLowerCase()
      insumoId = insumos.find((i) => i.nombre.trim().toLowerCase() === nombre)?.id
    }

    if (!insumoId && linea.insumoNuevo) {
      const nuevoInsumo = await crearInsumo({ tenant_id: tenantId, sede_id: sedeId, ...linea.insumoNuevo })
      setInsumos((prev) => [...prev, nuevoInsumo])
      insumoId = nuevoInsumo.id
    }

    if (!insumoId) throw new Error('Falta el insumo.')

    const nuevaLinea = await agregarRecetaItem({
      tenant_id: tenantId,
      menu_item_id: seleccionadoId,
      insumo_id: insumoId,
      cantidad_requerida: linea.cantidadRequerida,
      unidad: linea.unidad,
    })
    setRecetaPorItem((prev) => ({
      ...prev,
      [seleccionadoId]: [...(prev[seleccionadoId] ?? []), nuevaLinea],
    }))
  }

  async function handleEliminarRecetaLinea(recetaId: string) {
    if (!seleccionadoId) return
    await eliminarRecetaItem(recetaId)
    setRecetaPorItem((prev) => ({
      ...prev,
      [seleccionadoId]: (prev[seleccionadoId] ?? []).filter((linea) => linea.id !== recetaId),
    }))
  }

  if (loading) return <LoadingSpinner message="Cargando menú…" />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="flex flex-col gap-4">
      <CategoriaFiltros
        categorias={categorias}
        activa={categoriaFiltro}
        onSeleccionar={setCategoriaFiltro}
        onCrear={handleCrearCategoria}
        onActualizar={handleActualizarCategoria}
        onEliminar={handleEliminarCategoria}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <PlatosLista
          platos={platosFiltrados}
          categorias={categorias}
          busqueda={busqueda}
          onBuscar={setBusqueda}
          seleccionadoId={seleccionadoId}
          onSeleccionar={handleSeleccionar}
          onNuevo={handleNuevo}
        />
        <PlatoDetallePanel
          key={seleccionadoId ?? (creando ? 'nuevo' : 'vacio')}
          categorias={categorias}
          plato={seleccionado}
          creando={creando}
          onGuardar={handleGuardarPlato}
          onCancelar={() => setCreando(false)}
          onEliminar={handleEliminarPlato}
          receta={seleccionadoId ? (recetaPorItem[seleccionadoId] ?? []) : []}
          insumos={insumos}
          onAgregarRecetaLinea={handleAgregarRecetaLinea}
          onEliminarRecetaLinea={handleEliminarRecetaLinea}
        />
      </div>
    </div>
  )
}
