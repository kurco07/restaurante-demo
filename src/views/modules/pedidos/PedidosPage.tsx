import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { usePedidos } from '../../../controllers/pedido/usePedidos'
import { aceptaPedido, useMesasSede, type MesaVista } from '../../../controllers/mesonero/useMesasSede'
import { anularItem, anularSesionCompleta } from '../../../models/services/pedidoService'
import { puedeSupervisar } from '../../../lib/permisos'
import type { RecomendadosHoy, Usuario } from '../../../models/types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { SelectorMesaModal } from '../mesoneros/components/SelectorMesaModal'
import { AnularItemModal } from '../mesoneros/components/AnularItemModal'
import { AnularCuentaModal } from '../mesoneros/components/AnularCuentaModal'
import { ESTADOS_ANULABLES, type ItemEnviado } from './components/ResumenPedido'
import { RecomendadosMenu } from './components/RecomendadosMenu'
import {
  HeaderMesa,
  BuscadorPlatos,
  CategoriaPills,
  PlatoCard,
  ResumenPedido,
  ModalPersonalizacion,
} from './components'

const AVISO_MESA_SUPERVISOR =
  'Esta mesa la atiende otro mesonero. Como supervisor puedes anular sus platos; para tomarle pedido, transfiérela desde el mapa.'

const AVISO_MESA: Partial<Record<MesaVista['estado'], string>> = {
  otro: 'Esta mesa ahora la atiende otro mesonero. Lo que anotaste sigue aquí: cámbialo a otra mesa para enviarlo.',
  por_limpiar: 'Esta mesa se cerró y está por limpiar. Lo que anotaste sigue aquí: elige una mesa para enviarlo.',
}

// Menú y pedido del mesonero. Dos entradas: /mesoneros/menu/:mesaId (desde
// el mapa, "mesa primero") y /mesoneros/menu (anotar primero y elegir la
// mesa al enviar). El usuario y la sede ya los valida MesoneroLayout.
export default function PedidosPage() {
  const { usuario } = useUsuario()
  if (!usuario) return null
  return <TomaDePedido usuario={usuario} />
}

function TomaDePedido({ usuario }: { usuario: Usuario }) {
  const { mesaId } = useParams<{ mesaId: string }>()
  const navigate = useNavigate()
  const mesas = useMesasSede(usuario)
  const [selector, setSelector] = useState<'enviar' | 'mover' | null>(null)
  const [itemAnular, setItemAnular] = useState<ItemEnviado | null>(null)
  const [anularTodo, setAnularTodo] = useState(false)
  const esSupervisor = puedeSupervisar(usuario.rol)

  const p = usePedidos(mesaId)
  const subtotal = p.calcularSubtotal()

  // Recomendados del día (Fase 6, Módulo 4), los comparte MesoneroLayout
  const recomendados = useOutletContext<RecomendadosHoy | null>()
  const platosRecomendados = (recomendados?.items ?? [])
    .map((r) => ({ ...r, plato: p.platos.find((pl) => pl.id === r.menu_item_id) }))
    .filter((r) => r.plato)

  // "Agregar" desde la pestaña Sugeridos llega con el plato a abrir
  const location = useLocation()
  const abrirPlatoId = (location.state as { abrirPlato?: string } | null)?.abrirPlato
  const yaAbierto = useRef(false)
  useEffect(() => {
    if (!abrirPlatoId || yaAbierto.current) return
    const plato = p.platos.find((pl) => pl.id === abrirPlatoId)
    if (!plato) return
    yaAbierto.current = true
    p.abrirModal(plato)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirPlatoId, p.platos])

  const mesa = mesaId ? mesas.find((m) => m.id === mesaId) : undefined
  // La mesa sale de la SQLite local; mientras carga, no hay nada que mostrar
  if (mesaId && !mesa) return <LoadingSpinner message="Cargando mesa…" />

  const mesaValida = mesa && aceptaPedido(mesa) ? mesa : undefined

  async function enviarA(destino: MesaVista) {
    setSelector(null)
    const enviadaA = await p.enviarACocina(destino)
    if (enviadaA && enviadaA !== mesaId) navigate(`/mesoneros/menu/${enviadaA}`)
  }

  function elegirMesa(destino: MesaVista) {
    if (selector === 'enviar') {
      void enviarA(destino)
      return
    }
    p.moverBorradorA(destino.id)
    setSelector(null)
    navigate(`/mesoneros/menu/${destino.id}`)
  }

  return (
    <div className="mx-auto max-w-[1220px]">
      <HeaderMesa
        mesaNombre={mesa?.numero}
        aviso={
          mesa ? (esSupervisor && mesa.estado === 'otro' ? AVISO_MESA_SUPERVISOR : AVISO_MESA[mesa.estado]) : undefined
        }
        onCambiarMesa={() => setSelector('mover')}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section>
          {!p.busqueda && (
            <RecomendadosMenu
              items={platosRecomendados.map((r) => ({ id: r.menu_item_id, nombre: r.plato!.nombre, frase: r.frase }))}
              onAbrir={(id) => {
                const plato = p.platos.find((pl) => pl.id === id)
                if (plato) p.abrirModal(plato)
              }}
            />
          )}
          <BuscadorPlatos value={p.busqueda} onChange={p.setBusqueda} />
          <CategoriaPills
            categorias={p.categorias}
            categoriaActiva={p.categoriaActiva}
            onCambiarCategoria={p.setCategoriaActiva}
          />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {p.platosFiltrados.length === 0 ? (
              <div className="col-span-full py-12 text-center text-[var(--ink-soft)]">No hay platos en esta categoría</div>
            ) : (
              p.platosFiltrados.map((plato) => (
                <PlatoCard key={plato.id} plato={plato} onClick={() => p.abrirModal(plato)} />
              ))
            )}
          </div>
        </section>

        <ResumenPedido
          carrito={p.carrito}
          itemsEnviados={p.itemsEnviados}
          mesaNombre={mesaValida?.numero}
          onActualizarCantidad={p.actualizarCantidadCarrito}
          onEliminar={p.eliminarDelCarrito}
          onEnviarACocina={() => (mesaValida ? void enviarA(mesaValida) : setSelector('enviar'))}
          enviando={p.enviando}
          subtotal={subtotal}
          onAnular={esSupervisor ? setItemAnular : undefined}
          onAnularTodo={esSupervisor ? () => setAnularTodo(true) : undefined}
        />
      </div>

      <ModalPersonalizacion
        plato={p.platoModal}
        isOpen={p.modalAbierto}
        onClose={p.cerrarModal}
        cantidad={p.cantidad}
        onCantidadChange={p.setCantidad}
        notaItem={p.notaItem}
        onNotaItemChange={p.setNotaItem}
        onAgregar={p.agregarAlCarrito}
        precioTotal={p.calcularPrecioItem()}
      />

      {itemAnular && (
        <AnularItemModal
          item={itemAnular}
          onConfirmar={async (motivo) => {
            await anularItem(itemAnular.id, motivo)
            setItemAnular(null)
          }}
          onCerrar={() => setItemAnular(null)}
        />
      )}

      {anularTodo && p.sesion && (
        <AnularCuentaModal
          items={p.itemsEnviados.filter((item) => ESTADOS_ANULABLES.has(item.estado))}
          onConfirmar={async (motivo) => {
            await anularSesionCompleta(p.sesion!.id, motivo)
            setAnularTodo(false)
          }}
          onCerrar={() => setAnularTodo(false)}
        />
      )}

      {selector && (
        <SelectorMesaModal
          titulo={selector === 'enviar' ? '¿A qué mesa va este pedido?' : 'Mover el pedido a otra mesa'}
          mesas={mesas}
          mesaActualId={mesaId}
          onElegir={elegirMesa}
          onCerrar={() => setSelector(null)}
        />
      )}
    </div>
  )
}
