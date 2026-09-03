# Estrategia Comercial y de Negocio
## Plataforma de Gestión Integral para Restaurantes (SaaS)

**Proyecto:** Plataforma de gestión integral para restaurantes (SaaS multi-tenant)
**Fecha:** 29 de agosto de 2026

---

## 1. Resumen Ejecutivo

### El problema
Los restaurantes independientes y las pequeñas cadenas operan hoy con una combinación frágil de libretas, comandas en papel, hojas de cálculo y, en el mejor de los casos, sistemas POS desconectados entre sí:

- **Falta de integración operativa:** el pedido del mesonero no fluye en tiempo real a cocina; el inventario no se descuenta automáticamente; los reportes se arman manualmente al cierre del turno.
- **Vulnerabilidad ante caídas de internet:** la mayoría de soluciones SaaS modernas dejan de funcionar sin conexión, paralizando el servicio en hora pico.
- **Ceguera analítica:** no hay datos accionables para decidir qué comprar, qué preparar y qué promocionar.
- **Complejidad de adopción:** los sistemas integrales actuales son caros y difíciles de configurar; el restaurante pequeño no puede costearlos ni operarlos solo.

### La solución
Plataforma 100% web (PWA) que unifica la operación diaria (toma de pedidos híbrida mesonero/QR, cocina con pantalla en tiempo real), la administración (inventario con recetas y descuento automático), la gerencia (KPIs en tiempo real) y un motor de IA para sugerencias de compra, preparación y recomendación de platos, siempre con aprobación humana. Opera offline-first con sincronización automática, en arquitectura multi-tenant con onboarding self-service asistido y facturación recurrente.

### Propuesta de valor única
*"El sistema operativo integral para restaurantes que nunca se cae, aprende de tus datos y te dice qué comprar, qué cocinar y qué vender."*

---

## 2. Mercado y Cliente Objetivo

**Usuarios finales (operan el sistema):** mesoneros, cocina, supervisor de sala, administrador, gerente/dueño.

**Clientes que pagan:**
- Restaurantes independientes (1–3 sedes), típicamente dueños-operadores.
- Pequeñas cadenas regionales (3–15 sedes).
- Grupos gastronómicos emergentes sin departamento de IT.

**Alcance de mercado:** internacional desde el lanzamiento. La plataforma es 100% web y self-service, así que cualquier restaurante en cualquier lugar puede registrarse desde el día uno — no hay una geografía única a la que esté restringida.

**Estrategia de foco comercial:** la prospección es tan amplia como se quiera, pero el acompañamiento humano de los primeros restaurantes (llamadas, ayuda a configurar, seguimiento activo) se concentra en el grupo que primero muestre interés real, sin importar en qué país caiga ese grupo. Esto evita diluir un equipo pequeño entre muchas geografías a la vez, sin cerrar la puerta a ninguna de antemano.

**Plan de expansión:** una vez validado el modelo con el primer grupo de restaurantes piloto, expandir con ese mismo playbook a otros mercados, en vez de repetir el proceso de validación desde cero en cada país nuevo.

**Segmento excluido por ahora:** cadenas multinacionales o franquicias globales, y restaurantes tipo QSR ultra-simplificados que un POS básico ya resuelve.

---

## 3. Propuesta de Valor y Diferenciación

| Diferenciador | Descripción | Impacto para el cliente |
| :--- | :--- | :--- |
| **Operación unificada híbrida** | Mesonero y autopedido por QR conviven en la misma sesión de mesa; el cierre de cuenta siempre pasa por el mesonero. | Reduce fricción, preserva control de cuenta y propinas. |
| **Offline-first real** | Opera un turno completo sin internet y sincroniza sin duplicar pedidos. | La operación nunca se detiene. |
| **Motor de IA con aprobación humana** | Sugerencias de compra, preparación y recomendación; el humano decide siempre. | Reduce merma y mejora márgenes sin ceder control. |
| **Multi-tenancy + multi-sede nativo** | Un tenant por cadena, sedes con inventarios propios, reportes consolidados. | Escala con el cliente sin migración. |
| **Onboarding híbrido** | Self-service disponible, con acompañamiento humano real en la activación. | Menor fricción que un sistema enterprise, sin abandonar al cliente poco técnico. |
| **Personalización de marca** | Logo, colores, mapeo de mesas por restaurante. | Percepción de solución propia, no software genérico. |

**Frente a la competencia:** Toast, Square y Lightspeed son robustos pero dependen de hardware propietario e internet estable. Las herramientas locales suelen ser POS simples sin inventario inteligente. El posicionamiento es "el sistema que funciona aunque se caiga el internet" — una diferenciación concreta y verificable, no una promesa genérica.

---

## 4. Modelo de Ingresos

**Suscripción por sede, mensual, en dólares, con escalado suave:**

| Plan | Precio mensual por sede (USD) | Incluye |
| :--- | :--- | :--- |
| **Starter** | $29 | 1 sede, hasta 3 usuarios, pedidos híbridos, KDS básico, inventario manual, offline básico. |
| **Pro** | $59 | 1 sede, usuarios ilimitados, offline completo, IA de sugerencias, inventario con recetas y descuento automático, reportes avanzados. |
| **Sedes adicionales** | +$45 por sede adicional sobre el plan Pro | Escalado directo, sin categorías separadas para cadenas pequeñas. |
| **Cadenas (5+ sedes)** | Precio de volumen + soporte prioritario y Customer Success dedicado | El nivel de servicio escala con el tamaño del cliente. |

**Por qué precios en dólares:** cobrar en USD protege el ingreso del negocio frente a la inflación de cualquier moneda local en los mercados donde se opere — práctica estándar para un SaaS que vende a varios países.

**Pagos:** Stripe es la pasarela por defecto, pero no cubre todos los países (Venezuela es un caso conocido). Antes de activar el cobro en un mercado nuevo:
1. Confirmar que la pasarela elegida cubre ese país, o constituir la entidad que cobra en uno donde sí opere.
2. Tener lista una vía de pago alternativa (Zelle, USDT/cripto, agregador de pagos local) para los mercados donde la pasarela principal no llegue.

**Líneas de ingreso futuras (exploración, no comprometidas en el modelo actual):** tarificación de IA por volumen de uso, almacenamiento de modelos 3D para realidad aumentada, marketplace de integraciones y servicios de escaneo 3D. Se definen cuando el módulo correspondiente esté activo y haya datos reales de uso.

**CAC y LTV:** se tratan como hipótesis a validar con los primeros 10-20 restaurantes piloto, no como cifras de planificación financiera. El precio "objetivo" final se ajusta con esos datos.

---

## 5. Canales de Adquisición (Go-to-Market)

**Fase piloto:**
- Contacto directo y acompañamiento personal con los primeros 10-20 restaurantes — llamadas, ayuda a cargar el menú, presencia si es posible.
- Comunidades locales (grupos de WhatsApp/Facebook de dueños de restaurantes), aportando valor real antes de mencionar el producto.
- Alianzas con consultores gastronómicos y contadores especializados en restaurantes como referidores.

**Fase de expansión (una vez validado el piloto):**
- Inbound digital: SEO técnico, contenido educativo, casos de éxito reales documentados en video.
- Programa de referidos entre restaurantes clientes.
- Ventas asistidas ligeras para cadenas de 5+ sedes, apoyadas en el ROI medido durante el piloto.

**Distribución técnica:** cada restaurante accede vía subdominio propio. El aprovisionamiento es automático al pagar; en la fase piloto, además, un humano hace seguimiento activo durante los primeros 14 días de cada cliente nuevo.

---

## 6. Relación con los Clientes

- **Onboarding:** checklist interactivo con acompañamiento humano real durante el piloto.
- **Soporte por niveles:** Nivel 1 (base de conocimiento y respuestas rápidas), Nivel 2 (soporte humano por ticket), Nivel 3 (soporte telefónico para planes superiores o incidencias críticas).
- **Reportes semanales automáticos por email:** ventas, platos más vendidos, mermas y alertas de stock.
- **Customer Success dedicado** para cadenas de 5+ sedes, con revisión trimestral de KPIs.

---

## 7. Estructura de Costos

### A) Costo de desarrollo (proyecto único)
Se cotiza con el equipo de desarrollo sobre la base del documento de arquitectura del producto — es una inversión de una sola vez, independiente del costo de operación mensual descrito abajo.

### B) Costo de operación (mensual, recurrente)

| Concepto | Estimado mensual (USD) |
| :--- | :--- |
| Infraestructura cloud (servidores, base de datos, CDN, backups) — a escala de piloto (10-20 restaurantes) | 150–400 |
| API de IA | 20–80 |
| Pasarela(s) de pago (comisiones) | Variable según método |
| Herramientas SaaS (monitoreo, email, soporte) | 100–300 |
| Personal (equipo mínimo de piloto) | El costo real más alto — depende de si son fundadores o personal contratado |

El punto de equilibrio se calcula con datos reales de los primeros pilotos (churn, costo de servir, conversión a precio completo) — no se proyecta de antemano.

---

## 8. Recursos, Actividades y Alianzas Clave

**Recursos clave:** PWA local-first, backend multi-tenant, capa de IA desacoplada de proveedor, almacenamiento en la nube con CDN, pasarela de pago recurrente, sistema de autenticación y roles.

**Equipo mínimo para el piloto:**
- 2-3 desarrolladores full-stack.
- 1 diseñador de producto/UX (medio tiempo).
- 1 persona a cargo de onboarding y soporte del piloto (puede ser un fundador).

**Actividades clave:** desarrollo y operación técnica, adquisición de clientes, soporte, alianzas estratégicas. En la fase piloto, la prioridad de tiempo y recursos es el contacto directo — publicidad paga y automatización de marketing quedan para la fase de expansión, una vez validado el modelo.

**Alianzas clave:** proveedores de infraestructura cloud, proveedor de modelo de IA, pasarela de pago principal más una alternativa local o cripto para mercados donde la principal no opere, consultores y contadores especializados en restaurantes como canal de referidos.

---

## 9. Roadmap del Producto

**Alcance del MVP:** toma de pedidos híbrida (mesonero + QR), cocina con pantalla en tiempo real, administración e inventario con descuento automático, gerencia y reportes básicos, motor de IA de sugerencias con aprobación humana, mapeo de mesas, personalización de marca, arquitectura multi-tenant con onboarding self-service asistido, modo offline completo.

**Fuera del MVP:** realidad aumentada, asistente de IA conversacional, predicciones avanzadas de demanda, marketplace de integraciones, integraciones complejas con hardware de terceros.

**Etapas de desarrollo (estimado, sujeto a cotización formal):**

| Etapa | Duración estimada | Entregables |
| :--- | :--- | :--- |
| Arquitectura y prototipos UX | 4–6 semanas | Esquema multi-tenant, flujos de interfaz, validación con restaurantes piloto |
| Núcleo (backend + PWA offline) | 8–10 semanas | Motor de pedidos, cocina en tiempo real, multi-tenancy, autenticación |
| Administración y reportes | 4–6 semanas | Inventario, recetas, dashboards |
| IA y self-service | 4–6 semanas | Capa de IA, pasarela de pago, onboarding |
| QA y piloto beta | 4–6 semanas | Pruebas de estrés offline, feedback e iteración con restaurantes reales |

*El detalle técnico de arquitectura (sincronización offline, multi-tenancy, modelado de inventario) se documenta por separado en el documento de arquitectura del producto.*

---

## 10. Riesgos y Mitigación

**Complejidad técnica del modo offline y tiempo real.**
*Mitigación:* diseño formal del modelo de sincronización antes de construir, enfoque incremental, piloto temprano.

**Baja adopción por fricción en el onboarding.**
*Mitigación:* modelo híbrido de onboarding (self-service + acompañamiento humano real) durante el piloto.

**Modelo de ingresos con hipótesis aún no validadas.**
*Mitigación:* validar precio, retención y CAC con los primeros 10-20 restaurantes piloto antes de fijar cifras de escalamiento. Sin contratos anuales en esta etapa.

**Riesgo país en mercados de alta volatilidad económica.**
*Mitigación:* precios en dólares, contratos mes a mes al inicio, vías de pago alternativas verificadas por país, y una estrategia de expansión internacional que evita depender de un solo mercado concentrado.

**Otros riesgos monitoreados:**
- *Dependencia de un proveedor de IA:* mitigado con una capa de adaptador multi-proveedor.
- *Protección de datos:* el marco legal aplicable depende de cada país de operación — se valida con asesoría legal local antes de lanzar en cada mercado nuevo.
- *Entrada de competidores grandes:* no compiten hoy en los mercados de foco inicial; se monitorea activamente.

---

## 11. Conclusión y Próximos Pasos

El proyecto aborda dolores reales y no resueltos del sector, y la decisión de construir offline-first y multi-tenant es un diferenciador genuino frente a la competencia actual. Las prioridades inmediatas:

1. **Cerrar el documento de arquitectura** (interfaz e integraciones) para cotizar el desarrollo con datos reales.
2. **Conseguir 10-20 restaurantes piloto reales**, con acompañamiento humano activo, para obtener precio, CAC y churn reales.
3. **Mantener el mensaje comercial alineado con lo que el producto sostiene hoy**, y fijar metas de crecimiento (MRR, punto de equilibrio) solo con datos del piloto en mano.
