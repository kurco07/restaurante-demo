import { Link, useParams } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { usePedidos } from '../../../controllers/pedido/usePedidos'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import {
  HeaderMesa,
  BuscadorPlatos,
  CategoriaPills,
  PlatoCard,
  ResumenPedido,
  ModalPersonalizacion,
} from './components'
import { ESTILOS_CSS } from './components/constants'

export default function PedidosPage() {
  const { mesaId } = useParams<{ mesaId: string }>()
  const { usuario, loading: loadingUsuario, error: errorUsuario } = useUsuario()

  const {
    mesa,
    sesion,
    categorias,
    platosFiltrados,
    categoriaActiva,
    setCategoriaActiva,
    busqueda,
    setBusqueda,
    carrito,
    itemsEnviados,
    modalAbierto,
    platoModal,
    cantidad,
    setCantidad,
    notaItem,
    setNotaItem,
    enviando,
    abrirModal,
    cerrarModal,
    calcularPrecioItem,
    agregarAlCarrito,
    actualizarCantidadCarrito,
    eliminarDelCarrito,
    calcularSubtotal,
    enviarACocina,
  } = usePedidos(mesaId ?? '')

  const subtotal = calcularSubtotal()
  const precioModal = calcularPrecioItem()

  if (loadingUsuario) return <LoadingSpinner message="Cargando tu perfil…" />
  if (errorUsuario) return <ErrorMessage message={errorUsuario} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  if (!mesa) {
    return (
      <div className="flex h-screen items-center justify-center" style={ESTILOS_CSS}>
        <LoadingSpinner message="Cargando mesa…" />
      </div>
    )
  }

  if (!sesion) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3" style={ESTILOS_CSS}>
        <p className="text-[var(--ink-soft)]">Esta mesa no tiene una sesión abierta.</p>
        <Link to="/mesoneros" className="font-bold text-[var(--orange-dark)]">
          ← Volver al mapa de mesas
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-7" style={ESTILOS_CSS}>
      <div className="mx-auto max-w-[1220px]">
        <Link to="/mesoneros" className="flex items-center gap-2 mb-4 text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--ink)]">
          ← Volver al mapa de mesas
        </Link>

        <HeaderMesa mesaNombre={mesa.nombre_numero} nombreUsuario={usuario.nombre} />

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section>
            <BuscadorPlatos value={busqueda} onChange={setBusqueda} />
            <CategoriaPills categorias={categorias} categoriaActiva={categoriaActiva} onCambiarCategoria={setCategoriaActiva} />

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {platosFiltrados.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-[var(--ink-soft)]">
                  No hay platos en esta categoría
                </div>
              ) : (
                platosFiltrados.map((plato) => (
                  <PlatoCard key={plato.id} plato={plato} onClick={() => abrirModal(plato)} />
                ))
              )}
            </div>
          </section>

          <ResumenPedido
            carrito={carrito}
            itemsEnviados={itemsEnviados}
            mesaNombre={mesa.nombre_numero}
            onActualizarCantidad={actualizarCantidadCarrito}
            onEliminar={eliminarDelCarrito}
            onEnviarACocina={enviarACocina}
            enviando={enviando}
            subtotal={subtotal}
          />
        </div>
      </div>

      <ModalPersonalizacion
        plato={platoModal}
        isOpen={modalAbierto}
        onClose={cerrarModal}
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
