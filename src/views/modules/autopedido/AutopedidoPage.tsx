import { useAutopedido } from '../../../controllers/autopedido/useAutopedido'
import { EncabezadoAutopedido } from './components/EncabezadoAutopedido'
import { ListaPlatos } from './components/ListaPlatos'
import { PedidoMesa } from './components/PedidoMesa'
import { HojaPersonalizacion } from './components/HojaPersonalizacion'

// Vista pública del cliente por QR (mockup-autopedido-v3.html), con datos de ejemplo.
// Pensada para celular: en pantallas grandes se muestra como una columna centrada.
export default function AutopedidoPage() {
  const ap = useAutopedido()
  const p = ap.personalizacion

  return (
    <div className="flex min-h-screen justify-center bg-[#f3ede4]">
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-[#fffbf6]">
        <EncabezadoAutopedido
          restaurante={ap.nombreRestaurante}
          mesa={ap.mesa}
          vista={ap.vista}
          onCambiarVista={ap.setVista}
          itemsEnPedido={ap.pedido.length}
        />

        <main className="flex-1 pb-24">
          {ap.vista === 'menu' ? (
            <ListaPlatos
              categorias={ap.categorias}
              categoria={ap.categoria}
              onCambiarCategoria={ap.setCategoria}
              platos={ap.platosVisibles}
              onPersonalizar={p.abrir}
            />
          ) : (
            <PedidoMesa mesa={ap.mesa} items={ap.pedido} total={ap.totalPedido} />
          )}
        </main>

        {ap.vista === 'menu' && (
          <button
            type="button"
            onClick={() => ap.setVista('pedido')}
            className="fixed bottom-4 left-1/2 z-10 flex w-[calc(100%-30px)] max-w-[400px] -translate-x-1/2 items-center justify-between rounded-2xl bg-orange-500 px-[18px] py-3.5 text-[13.5px] font-bold text-white"
          >
            <span>{ap.pedido.length} ítems en tu pedido</span>
            <span>Ver carrito · ${ap.totalPedido.toFixed(2)}</span>
          </button>
        )}

        {p.plato && (
          <HojaPersonalizacion
            plato={p.plato}
            proteina={p.proteina}
            onElegirProteina={p.setProteina}
            quitados={p.quitados}
            onAlternarQuitado={p.alternarQuitado}
            extras={p.extras}
            onAlternarExtra={p.alternarExtra}
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
