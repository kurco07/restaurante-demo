import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useUsuario } from '../usuario/useUsuario'
import { fetchMesas } from '../../models/services/mesaService'
import { fetchMarcaPropia } from '../../models/services/marcaService'
import { mensajeDeError } from '../../lib/errores'

export interface TarjetaQR {
  mesaId: string
  mesa: string
  url: string
  // El QR ya dibujado como SVG: se imprime nítido a cualquier tamaño
  svg: string
}

// En localhost los QR apuntarían a la PC de quien los genera, no a la app
// publicada: la hoja lo avisa
export function esOrigenLocal(origen: string) {
  return /\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(origen)
}

// Datos de la hoja imprimible de QR (Fase 8, Módulo 4, piloto): una
// tarjeta por mesa de la sede, o solo la de soloMesaId para reponer un QR.
// Cada una con el enlace del autopedido de esa mesa (/autopedido/:mesaId,
// el mismo de "Enlace del QR" en Mesas) y la marca del restaurante.
// Necesita internet, como todo administración.
export function useHojaQR(soloMesaId?: string | null) {
  const { usuario } = useUsuario()
  const [tarjetas, setTarjetas] = useState<TarjetaQR[]>([])
  const [restaurante, setRestaurante] = useState<{ nombre: string | null; logo: string | null }>({
    nombre: null,
    logo: null,
  })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const origen = window.location.origin

  useEffect(() => {
    if (!usuario?.sede_id) return
    let cancelado = false
    setCargando(true)

    Promise.all([fetchMesas(usuario.tenant_id, usuario.sede_id), fetchMarcaPropia().catch(() => null)])
      .then(async ([mesas, marca]) => {
        const elegidas = soloMesaId ? mesas.filter((m) => m.id === soloMesaId) : mesas
        const ordenadas = [...elegidas].sort((a, b) =>
          a.nombre_numero.localeCompare(b.nombre_numero, 'es', { numeric: true }),
        )
        const listas = await Promise.all(
          ordenadas.map(async (m) => {
            const url = `${origen}/autopedido/${m.id}`
            // Corrección de errores "M": aguanta una mancha o un doblez en
            // la hoja impresa sin que el QR se vuelva ilegible
            const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
            return { mesaId: m.id, mesa: m.nombre_numero, url, svg }
          }),
        )
        if (cancelado) return
        setTarjetas(listas)
        setRestaurante({ nombre: marca?.nombre_mostrado ?? null, logo: marca?.logo_url ?? null })
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(mensajeDeError(e, 'No se pudieron preparar los QR de las mesas.'))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [usuario?.tenant_id, usuario?.sede_id, origen, soloMesaId])

  return { usuario, tarjetas, restaurante, cargando, error, origenLocal: esOrigenLocal(origen) }
}
