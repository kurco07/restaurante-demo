import { supabase } from '../../lib/supabaseClient'
import { powerSync } from '../../lib/powerSyncClient'

// pagos_cierre no está entre las tablas que PowerSync sincroniza offline
// (no está ni en AppSchema ni en la publicación `powersync` de Postgres,
// a diferencia de sesiones_mesa/mesas) — extenderlo requeriría tocar las
// Sync Rules de la instancia PowerSync, fuera del alcance de este cambio.
// Por eso el pago se inserta directo contra Supabase (requiere conexión
// en ese momento); si falla, no se cierra la mesa. sesiones_mesa/mesas sí
// se actualizan vía escritura local PowerSync, una vez el pago quedó
// registrado.
export async function cerrarCuenta(datos: {
  tenant_id: string
  sede_id: string
  sesion_id: string
  mesa_id: string
  metodo_de_pago: 'efectivo' | 'tarjeta' | 'pago_movil'
  monto: number
  propina: number
  cerrado_por: string
}) {
  const { error } = await supabase.from('pagos_cierre').insert({
    tenant_id: datos.tenant_id,
    sede_id: datos.sede_id,
    sesion_id: datos.sesion_id,
    metodo_de_pago: datos.metodo_de_pago,
    monto: datos.monto,
    propina: datos.propina,
    cerrado_por: datos.cerrado_por,
  })
  if (error) throw error

  const ahora = new Date().toISOString()
  await powerSync.writeTransaction(async (tx) => {
    await tx.execute(`update sesiones_mesa set estado = 'cerrada', cerrada_en = ? where id = ?`, [
      ahora,
      datos.sesion_id,
    ])
    await tx.execute(`update mesas set estado = 'por_limpiar' where id = ?`, [datos.mesa_id])
  })
}
