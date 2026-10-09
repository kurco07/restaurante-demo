import { useDisponibilidadSede } from '../../../../controllers/administracion/useDisponibilidadSede'

interface DisponibilidadSedeProps {
  menuItemId: string
  precioBase: number
}

// Disponible / precio del plato en ESTA sede. Lo que se marca aquí lo ven
// el mesonero y el cliente del QR de esta sede; las demás sedes no cambian.
export function DisponibilidadSede({ menuItemId, precioBase }: DisponibilidadSedeProps) {
  const d = useDisponibilidadSede(menuItemId)

  if (d.sinSede) {
    return <p className="text-[12px] text-[var(--ink-soft)]">Tu usuario no tiene sede asignada.</p>
  }
  if (d.cargando) {
    return <p className="text-[12px] text-[var(--ink-soft)]">Cargando…</p>
  }

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">En esta sede</p>

      <label className="flex items-center gap-2 font-semibold">
        <input type="checkbox" checked={d.disponible} onChange={(e) => d.setDisponible(e.target.checked)} />
        Disponible (si lo desmarcas, el mesonero y el cliente dejan de verlo)
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
          Precio en esta sede (opcional)
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={d.precioSede}
          onChange={(e) => d.setPrecioSede(e.target.value)}
          placeholder={Number(precioBase).toFixed(2)}
          className="w-28 rounded-lg border border-[var(--border)] px-3 py-2"
        />
        <span className="text-[11.5px] text-[var(--ink-soft)]">Vacío = se usa el precio general.</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={d.guardar}
          disabled={d.guardando}
          className="rounded-lg border border-[var(--orange)] px-3 py-2 font-bold text-[var(--orange-dark)] disabled:opacity-50"
        >
          {d.guardando ? 'Guardando…' : 'Guardar para esta sede'}
        </button>
        {d.mensaje && (
          <span className={d.mensaje.tipo === 'ok' ? 'text-[var(--ink-soft)]' : 'text-[var(--red)]'}>
            {d.mensaje.texto}
          </span>
        )}
      </div>
    </div>
  )
}
