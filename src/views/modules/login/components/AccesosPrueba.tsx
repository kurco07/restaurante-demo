import type { Rol } from '../../../../models/types'

interface CuentaPrueba {
  rol: Rol
  label: string
  email: string
  password: string
}

// Cuentas del "Restaurante Prueba", una por rol, para que quien revise el
// portafolio pueda recorrer el sistema completo con un clic. Esta copia del
// proyecto es solo de demostración, por eso se muestran también en
// producción (en el proyecto real siguen fuera del bundle).
// Cocina y supervisor tienen otra contraseña: se la cambió administración.
const CONTRASENA_PRUEBA = 'Prueba123!'

const cuentas: CuentaPrueba[] = [
  { rol: 'mesonero', label: 'Mesonero', email: 'mesonero@prueba.com', password: CONTRASENA_PRUEBA },
  { rol: 'cocina', label: 'Cocina', email: 'cocina@prueba.com', password: '123456' },
  { rol: 'supervisor', label: 'Supervisor', email: 'supervisor@prueba.com', password: '123456' },
  { rol: 'administracion', label: 'Administración', email: 'administracion@prueba.com', password: CONTRASENA_PRUEBA },
  { rol: 'gerencia', label: 'Gerencia', email: 'gerencia@prueba.com', password: CONTRASENA_PRUEBA },
  { rol: 'super_admin', label: 'Super Admin', email: 'super_admin@prueba.com', password: CONTRASENA_PRUEBA },
]

interface AccesosPruebaProps {
  onSeleccionar: (email: string, password: string) => void
  deshabilitado: boolean
}

export function AccesosPrueba({ onSeleccionar, deshabilitado }: AccesosPruebaProps) {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-gray-200 p-3.5">
      <p className="mb-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-400">
        Demo · entrar como…
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {cuentas.map((cuenta) => (
          <button
            key={cuenta.rol}
            type="button"
            disabled={deshabilitado}
            onClick={() => onSeleccionar(cuenta.email, cuenta.password)}
            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50"
          >
            {cuenta.label}
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-center text-[11px] text-gray-400">
        Cada cuenta se abre en un solo dispositivo a la vez.
      </p>
    </div>
  )
}
