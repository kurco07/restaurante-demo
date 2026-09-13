# Estructura del código (MVC)

El proyecto sigue un patrón **MVC adaptado para React**:

```
src/
├── models/                  # MODEL - Datos y lógica de negocio
│   ├── types/               # Interfaces y tipos TypeScript
│   │   ├── index.ts         # Re-exports de todos los tipos
│   │   ├── usuario.ts       # Rol, Usuario
│   │   ├── menu.ts          # CategoriaMenu, MenuItem, MenuItemSede
│   │   ├── pedido.ts        # PedidoItem
│   │   ├── mesa.ts          # Mesa, SesionMesa
│   │   └── inventario.ts    # Insumo, Receta
│   └── services/            # Llamadas a Supabase/API
│       ├── authService.ts   # signIn, signOut
│       ├── menuService.ts   # fetchMenuItems, fetchCategorias
│       ├── pedidoService.ts # fetchPedidos, crearPedidoItem, actualizarEstado
│       ├── mesaService.ts   # fetchMesas, abrirSesionMesa, cerrarSesionMesa
│       ├── inventarioService.ts # fetchInsumos, actualizarStock
│       └── usuarioService.ts    # fetchUsuarios
│
├── views/                   # VIEW - Interfaz de usuario
│   ├── components/
│   │   ├── ui/              # Componentes reutilizables
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── layout/
│   │   │   └── PageLayout.tsx
│   │   ├── AuthProvider.tsx
│   │   └── UsuarioProvider.tsx
│   └── modules/             # Una carpeta por cada módulo/interfaz
│       ├── login/
│       │   └── LoginPage.tsx
│       ├── mesoneros/
│       │   ├── MesonerosPage.tsx
│       │   └── components/  # Componentes específicos del módulo
│       ├── cocina/
│       │   ├── CocinaPage.tsx
│       │   └── components/
│       ├── autopedido/
│       ├── administracion/
│       ├── gerencia/
│       └── super-admin/
│
├── controllers/             # CONTROLLER - Hooks que conectan View con Model
│   ├── useAuth.ts
│   ├── useUsuario.ts
│   └── ProtectedRoute.tsx
│
├── lib/                     # Configuración y clientes
│   ├── supabaseClient.ts
│   ├── powerSyncClient.ts
│   └── rolesPorModulo.ts
│
├── App.tsx                  # Routing principal
├── main.tsx                 # Entry point
└── index.css
```

## Flujo de datos

```
View (componente) → Controller (hook) → Model (service) → Supabase
                    ↑                                     ↓
                    └───────── datos ←────────────────────┘
```

## Reglas de la estructura

1. **Un módulo = una carpeta** en `views/modules/`. Cada módulo tiene su `XxxPage.tsx` y una carpeta `components/` para sus componentes específicos.
2. **Componentes reutilizables** van en `views/components/ui/` (Button, Input, Card, LoadingSpinner, etc.).
3. **Los services** solo se encargan de hablar con Supabase. No importan componentes ni hooks.
4. **Los hooks (controllers)** manejan estado y lógica. Conectan la UI con los services.
5. **Los tipos** se definen en `models/types/` y se importan desde ahí en todo el proyecto.
