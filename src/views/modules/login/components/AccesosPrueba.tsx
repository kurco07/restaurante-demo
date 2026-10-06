import type { Rol } from '../../../../models/types'

interface CuentaPrueba {
  rol: Rol
  label: string
  email: string
}

// Las 6 creadas vía Admin API, una por rol, contraseña compartida abajo —
// solo existen en el proyecto de Supabase de desarrollo. Esta lista entera
// queda fuera del bundle de producción (ver el chequeo import.meta.env.DEV
// en LoginPage) para no exponer credenciales de prueba en un deploy real.
const CONTRASENA_PRUEBA = 'Prueba123!'

const cuentas: CuentaPrueba[] = [
  { rol: 'mesonero', label: 'Mesonero', email: 'mesonero@prueba.com' },
  { rol: 'cocina', label: 'Cocina', email: 'cocina@prueba.com' },
  { rol: 'supervisor', label: 'Supervisor', email: 'supervisor@prueba.com' },
  { rol: 'administracion', label: 'Administración', email: 'administracion@prueba.com' },
  { rol: 'gerencia', label: 'Gerencia', email: 'gerencia@prueba.com' },
  { rol: 'super_admin', label: 'Super Admin', email: 'super_admin@prueba.com' },
]

interface AccesosPruebaProps {
  onSeleccionar: (email: string, password: string) => void
  deshabilitado: boolean
}

export function AccesosPrueba({ onSeleccionar, deshabilitado }: AccesosPruebaProps) {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-gray-200 p-3.5">
      <p className="mb-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-400">
        Solo desarrollo · entrar como…
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {cuentas.map((cuenta) => (
          <button
            key={cuenta.rol}
            type="button"
            disabled={deshabilitado}
            onClick={() => onSeleccionar(cuenta.email, CONTRASENA_PRUEBA)}
            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50"
          >
            {cuenta.label}
          </button>
        ))}
      </div>
    </div>
  )
}
