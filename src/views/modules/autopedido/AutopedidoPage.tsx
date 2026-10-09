import { useParams } from 'react-router-dom'
import { useAutopedido } from '../../../controllers/autopedido/useAutopedido'
import { EncabezadoAutopedido } from './components/EncabezadoAutopedido'
import { ListaPlatos } from './components/ListaPlatos'
import { PedidoMesa } from './components/PedidoMesa'
import { HojaPersonalizacion } from './components/HojaPersonalizacion'

// Vista pública del cliente por QR (/autopedido/:mesaId), sin sesión.
// Pensada para celular: en pantallas grandes se muestra como una columna centrada.
export default function AutopedidoPage() {
  const { mesaId } = useParams()
  const ap = useAutopedido(mesaId)
  const p = ap.personalizacion

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
              {ap.vista === 'menu' ? (
                <ListaPlatos
                  categorias={ap.menu.categorias}
                  categoria={ap.categoria}
                  onCambiarCategoria={ap.setCategoria}
                  platos={ap.platosVisibles}
                  onAbrirPlato={p.abrir}
                />
              ) : (
                <PedidoMesa
                  mesa={ap.menu.mesa.nombre_numero}
                  items={ap.carrito}
                  total={ap.totalCarrito}
                  onQuitar={ap.quitarDelCarrito}
                />
              )}
            </main>

            {ap.vista === 'menu' && ap.carrito.length > 0 && (
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
          />
        )}
      </div>
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
