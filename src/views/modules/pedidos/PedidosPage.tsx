import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { usePedidos } from '../../../controllers/pedido/usePedidos'
import {
  HeaderMesa,
  MesaSwitcher,
  BuscadorPlatos,
  CategoriaPills,
  PlatoCard,
  ResumenPedido,
  ModalPersonalizacion,
} from './components'
import { crearMesasActivas } from '../../../controllers/pedido/mockData/pedidos'
import { ESTILOS_CSS } from './components/constants'
import type { PlatoConExtras } from '../../../models/types'

export default function PedidosPage() {
  const { mesaId } = useParams<{ mesaId: string }>()
  const mesaNumero = Number(mesaId)

  const {
    platosFiltrados,
    categoriaActiva,
    setCategoriaActiva,
    busqueda,
    setBusqueda,
    carrito,
    notaGeneral,
    setNotaGeneral,
    modalAbierto,
    platoModal,
    proteinaSeleccionada,
    setProteinaSeleccionada,
    ingredientesQuitados,
    extrasSeleccionados,
    cantidad,
    setCantidad,
    notaItem,
    setNotaItem,
    loading,
    abrirModal,
    cerrarModal,
    toggleQuitar,
    toggleExtra,
    calcularPrecioItem,
    agregarAlCarrito,
    actualizarCantidadCarrito,
    eliminarDelCarrito,
    calcularSubtotal,
    enviarACocina,
    guardarBorrador,
  } = usePedidos()

  const mesasActivas = crearMesasActivas(mesaNumero)
  const subtotal = calcularSubtotal()
  const precioModal = calcularPrecioItem()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={ESTILOS_CSS}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-7" style={ESTILOS_CSS}>
      <div className="mx-auto max-w-[1220px]">
        <Link to="/mesoneros" className="flex items-center gap-2 mb-4 text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--ink)]">
          ← Volver al mapa de mesas
        </Link>

        <HeaderMesa mesaNumero={mesaNumero} zona="Terraza · Exterior" user={null} />

        <MesaSwitcher mesaActual={mesaNumero} mesas={mesasActivas} />

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section>
            <BuscadorPlatos value={busqueda} onChange={setBusqueda} />
            <CategoriaPills categoriaActiva={categoriaActiva} onCambiarCategoria={setCategoriaActiva} />

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {platosFiltrados.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-[var(--ink-soft)]">
                  No hay platos en esta categoría
                </div>
              ) : (
                platosFiltrados.map((plato: PlatoConExtras) => (
                  <PlatoCard
                    key={plato.id}
                    plato={plato}
                    onClick={() => abrirModal(plato)}
                  />
                ))
              )}
            </div>
          </section>

          <ResumenPedido
            carrito={carrito}
            mesaNumero={mesaNumero}
            notaGeneral={notaGeneral}
            onNotaGeneralChange={setNotaGeneral}
            onActualizarCantidad={actualizarCantidadCarrito}
            onEliminar={eliminarDelCarrito}
            onEnviarACocina={() => enviarACocina(mesaNumero, notaGeneral)}
            onGuardarBorrador={() => guardarBorrador(mesaNumero, notaGeneral)}
            subtotal={subtotal}
          />
        </div>
      </div>

      <ModalPersonalizacion
        plato={platoModal}
        isOpen={modalAbierto}
        onClose={cerrarModal}
        proteinaSeleccionada={proteinaSeleccionada}
        onProteinaChange={setProteinaSeleccionada}
        ingredientesQuitados={ingredientesQuitados}
        onToggleQuitar={toggleQuitar}
        extrasSeleccionados={extrasSeleccionados}
        onToggleExtra={toggleExtra}
        cantidad={cantidad}
        onCantidadChange={setCantidad}
        notaItem={notaItem}
        onNotaItemChange={setNotaItem}
        onAgregar={agregarAlCarrito}
        precioTotal={precioModal}
      />
    </div>
  )
}