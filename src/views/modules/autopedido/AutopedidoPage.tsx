import { useParams } from 'react-router-dom'
import { useAutopedido } from '../../../controllers/autopedido/useAutopedido'
import { useAplicarMarca } from '../../../controllers/marca/useAplicarMarca'
import { useRecomendadosMesa } from '../../../controllers/autopedido/useRecomendadosMesa'
import { EncabezadoAutopedido } from './components/EncabezadoAutopedido'
import { ListaPlatos } from './components/ListaPlatos'
import { RecomendadosAutopedido } from './components/RecomendadosAutopedido'
import { PedidoMesa } from './components/PedidoMesa'
import { HojaPersonalizacion } from './components/HojaPersonalizacion'

// Vista pública del cliente por QR (/autopedido/:mesaId), sin sesión.
// Pensada para celular: en pantallas grandes se muestra como una columna centrada.
export default function AutopedidoPage() {
  const { mesaId } = useParams()
  const ap = useAutopedido(mesaId)
  const p = ap.personalizacion
  const recomendados = useRecomendadosMesa(mesaId)
  useAplicarMarca(ap.menu?.marca)
  // Solo los que están en el menú de esta mesa (con su precio de la sede).
  // Si el restaurante tiene el módulo apagado, ni se muestra la franja —
  // aunque haya recomendados ya aprobados de antes.
  const recomendadosActivo = ap.menu?.modulos?.ia_recomendados ?? true
  const platosRecomendados = !recomendadosActivo
    ? []
    : (recomendados?.items ?? []).flatMap((r) => {
        const plato = ap.menu?.platos.find((pl) => pl.id === r.menu_item_id)
        return plato ? [{ plato, frase: r.frase }] : []
      })

  return (
    <div className="flex min-h-screen justify-center bg-[#f3ede4]">
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-[#fffbf6]">
        {ap.carga.estado === 'cargando' && <Aviso titulo="Cargando el menú..." />}
        {ap.carga.estado === 'no_encontrada' && (
          <Aviso titulo="Este QR no es válido" detalle="Pídele a tu mesonero el código de tu mesa." />
        )}
        {ap.carga.estado === 'error' && (
          <Aviso
            titulo="No pudimos cargar el menú"
            detalle="Revisa tu conexión a internet e intenta de nuevo, o pídele el menú a tu mesonero."
          />
        )}

        {ap.menu && (
          <>
            <EncabezadoAutopedido
              restaurante={ap.menu.restaurante}
              mesa={ap.menu.mesa.nombre_numero}
              vista={ap.vista}
              onCambiarVista={ap.setVista}
              itemsEnCarrito={ap.carrito.length}
            />

            <main className="flex-1 pb-24">
              {ap.pedidoEnviado ? (
                <PedidoEnviado mesa={ap.menu.mesa.nombre_numero} onNuevoPedido={ap.nuevoPedido} />
              ) : ap.vista === 'menu' ? (
                <>
                  <RecomendadosAutopedido items={platosRecomendados} onAbrirPlato={p.abrir} />
                  <ListaPlatos
                    categorias={ap.menu.categorias}
                    categoria={ap.categoria}
                    onCambiarCategoria={ap.setCategoria}
                    platos={ap.platosVisibles}
                    onAbrirPlato={p.abrir}
                  />
                </>
              ) : (
                <PedidoMesa
                  mesa={ap.menu.mesa.nombre_numero}
                  enMesa={ap.compartido.items}
                  totalEnMesa={ap.compartido.total}
                  cuentaCerrada={ap.compartido.cuentaCerrada}
                  sinConexion={ap.compartido.sinConexion}
                  items={ap.carrito}
                  total={ap.totalCarrito}
                  onQuitar={ap.quitarDelCarrito}
                  onEnviar={ap.enviarPedido}
                  enviando={ap.enviando}
                  error={ap.errorEnvio}
                  onIrAlMenu={() => ap.setVista('menu')}
                />
              )}
            </main>

            {!ap.pedidoEnviado && ap.vista === 'menu' && ap.carrito.length > 0 && (
              <button
                type="button"
                onClick={() => ap.setVista('pedido')}
                className="fixed bottom-4 left-1/2 z-10 flex w-[calc(100%-30px)] max-w-[400px] -translate-x-1/2 items-center justify-between rounded-2xl bg-orange-500 px-[18px] py-3.5 text-[13.5px] font-bold text-white"
              >
                <span>{ap.carrito.length} ítems en tu pedido</span>
                <span>Ver pedido · ${ap.totalCarrito.toFixed(2)}</span>
              </button>
            )}
          </>
        )}

        {p.plato && (
          <HojaPersonalizacion
            plato={p.plato}
            cantidad={p.cantidad}
            onCambiarCantidad={p.cambiarCantidad}
            nota={p.nota}
            onCambiarNota={p.setNota}
            precio={p.precio}
            onAgregar={p.agregar}
            onCerrar={p.cerrar}
            raActiva={ap.menu?.modulos?.realidad_aumentada ?? true}
          />
        )}
      </div>
    </div>
  )
}

function PedidoEnviado({ mesa, onNuevoPedido }: { mesa: string; onNuevoPedido: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <p className="text-5xl">✅</p>
      <p className="mt-4 text-lg font-extrabold text-gray-900">¡Pedido enviado!</p>
      <p className="mt-2 text-[13px] text-gray-500">
        Mesa {mesa} — tu mesonero lo confirmará contigo y lo pasará a cocina. Puedes seguir su estado en "Tu
        pedido". El cierre de cuenta y el pago los coordinas directamente con él.
      </p>
      <button
        type="button"
        onClick={onNuevoPedido}
        className="mt-6 rounded-2xl border border-orange-200 bg-white px-5 py-3 text-[13px] font-bold text-orange-600"
      >
        Agregar más platos
      </button>
    </div>
  )
}

function Aviso({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <p className="text-lg font-extrabold text-gray-900">{titulo}</p>
      {detalle && <p className="mt-2 text-[13px] text-gray-500">{detalle}</p>}
    </div>
  )
}
