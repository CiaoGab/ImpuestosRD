# ImpuestosRD

Calculadora de impuestos de importación para República Dominicana. Calcula impuestos según la regla de $200 USD y tasa DGA por kilo, con estimación de mercado para gastos de courier.

## Características

### Cálculo de Impuestos
- **Cálculo automático de modo**: Cambia automáticamente entre modo ≤$200 y ≥$200 según el valor FOB
- **Modo manual**: Opción de override avanzado para seleccionar manualmente el modo de cálculo
- **Cálculo preciso**: Implementa las reglas oficiales de DGA y DGII
- **Modelo de compra completo**: Entradas para FOB, envío de tienda, e impuesto en checkout
- **Resumen "Pagado online"**: Muestra el total pagado a la tienda (FOB + envío + checkout tax)

### Estimación de Courier
- **Estimación de mercado**: Calcula promedios de múltiples couriers sin promocionar marcas
- **Rango de precios**: Muestra mediana (típica), mínimo y máximo
- **Tarifa personalizada**: Opción para usuarios que conocen su tarifa por libra
- **Reglas de peso**: Configuración de redondeo (exacto, redondea arriba, mínimo 1 lb)
- **Transporte interior**: Toggle para aplicar cargos adicionales de envío al interior

### UX y Compartir
- **Compartir resultados**: Genera URLs compartibles con todos los parámetros del cálculo
- **Responsive**: Diseño adaptado para móviles y escritorio
- **Accesibilidad**: Skip links, ARIA labels, y navegación por teclado
- **SEO optimizado**: Meta tags, Open Graph, Twitter Cards, sitemap.xml

## Estructura del Proyecto

```
ImpuestosRD/
├── index.html          # Página principal
├── gracias.html        # Página de agradecimiento (post-donación)
├── src/
│   ├── app.js          # Lógica principal de la aplicación
│   ├── calc/
│   │   ├── do.js       # Funciones de cálculo de impuestos
│   │   └── courier-do.js # Funciones de cálculo de courier
│   ├── data/
│   │   ├── sources-do.js  # Fuentes oficiales (DGA/DGII)
│   │   └── couriers-do.js # Configuración de couriers (BM Cargo, Aeropaq, TuPaq)
│   └── ui/
│       ├── format.js    # Utilidades de formateo (USD, DOP)
│       └── render.js   # Funciones de renderizado seguro
├── robots.txt          # Configuración para buscadores
├── sitemap.xml         # Mapa del sitio
└── README.md           # Este archivo
```

## Configuración

### Variables de Configuración

En `src/app.js`:

- `STRIPE_PAYMENT_LINK_URL`: URL del Stripe Payment Link para donaciones (requerido)
  - **Importante**: Configurar el redirect URL de éxito en Stripe a `/gracias.html`
- `SHOW_COURIERS`: Feature flag para mostrar/ocultar sección de couriers (por defecto: `false`)
- `SHOW_COURIER_BREAKDOWN`: Feature flag futuro para mostrar desglose por courier (por defecto: `false`)

### Bounds de Input

Los valores de entrada están limitados a rangos seguros:

- **Valor FOB**: 0 - 100,000 USD (requerido)
- **Envío de tienda**: 0 - 10,000 USD (opcional)
- **Impuesto en checkout**: 0 - 10,000 USD (opcional)
- **Peso**: 0 - 500 kg/lb
- **Flete courier** (modo ≥$200): 0 - 10,000 USD
- **Arancel** (modo ≥$200): 0 - 50%
- **Tasa FX (USD → DOP)**: 0 - 1,000
- **Tarifa personalizada**: 0 - 100 USD/lb

## Despliegue

### Requisitos

- Servidor web estático (no se requiere backend)
- HTTPS habilitado (recomendado)

### Pasos de Despliegue

1. **Configurar Stripe Payment Link**:
   - Crear un Payment Link en Stripe Dashboard
   - Configurar el redirect URL de éxito a: `https://tudominio.com/gracias.html`
   - Copiar la URL del Payment Link y pegarla en `STRIPE_PAYMENT_LINK_URL` en `src/app.js`

2. **Actualizar configuración**:
   - Reemplazar `<PUT_STRIPE_PAYMENT_LINK_HERE>` con tu Stripe Payment Link real
   - Ajustar `SHOW_COURIERS` si tienes partners de courier
   - Actualizar email de contacto en el CTA de courier (actualmente: `contacto@impuestosrd.com`)

3. **Actualizar URLs y meta tags**:
   - Actualizar `sitemap.xml` con tu dominio real
   - Actualizar `robots.txt` con tu dominio real
   - Actualizar meta tags en `index.html` (og:url, canonical)

4. **Subir archivos**:
   - Subir todos los archivos a tu servidor web (incluyendo `gracias.html`)
   - Asegurar que `index.html` está en la raíz
   - Verificar que todos los archivos en `src/` están accesibles

5. **Configurar servidor**:
   - Habilitar HTTPS (requerido para Stripe)
   - Configurar headers de cache apropiados
   - Configurar CORS si es necesario
   - Asegurar que las rutas relativas funcionan correctamente

6. **Verificar**:
   - Probar el cálculo en diferentes escenarios (under200, over200)
   - Verificar que las URLs compartibles funcionan
   - Probar el flujo de donación (Stripe Payment Link → gracias.html)
   - Verificar que la estimación de courier se calcula correctamente
   - Probar en diferentes navegadores y dispositivos

## Desarrollo

### Tecnologías

- HTML5
- JavaScript (ES6 modules)
- Tailwind CSS (via CDN)
- Sin dependencias externas (vanilla JS)

### Modelo de Cálculo

#### Modo ≤$200 USD (FOB)
- Tasa DGA fija: US$0.25 por cada kilo o fracción
- Peso redondeado hacia arriba (ceil)
- Solo requiere: FOB y peso

#### Modo ≥$200 USD (FOB)
- Cálculo basado en CIF (FOB + flete courier)
- Arancel según clasificación del producto
- ITBIS 18% sobre (CIF + arancel)
- Requiere: FOB, flete courier, y arancel (%)

#### Estimación de Courier
- Calcula tarifas de múltiples couriers (BM Cargo, Aeropaq, TuPaq)
- Muestra mediana (típica), mínimo y máximo
- Convierte a DOP usando tasa FX proporcionada
- Opción de tarifa personalizada con reglas de peso configurables

### Mejoras Futuras

- Reemplazar Tailwind CDN con CSS compilado
- Implementar CSP estricto después de remover CDN
- Agregar analytics (opcional)
- Agregar sección FAQ para SEO
- Expandir configuración de couriers con más detalles (volumétrico, fuel surcharge, etc.)
- Activar directorio de couriers cuando haya partners verificados

## Seguridad

### Prácticas Implementadas

- **Validación y sanitización de inputs**: Todos los inputs son validados y limitados a rangos seguros
- **Bounds checking**: Valores numéricos están estrictamente limitados (ver sección de bounds)
- **Sanitización de parámetros de URL**: Query params son parseados, validados y limitados antes de usar
- **Renderizado seguro**: Uso de `textContent` y métodos DOM en lugar de `innerHTML` para contenido dinámico
- **Sin eval() ni innerHTML peligroso**: Todo el renderizado usa métodos seguros del DOM
- **HTTPS requerido**: Para uso de Stripe Payment Links

### Parámetros de URL Soportados

- `mode`: `under200` | `over200`
- `value`: Valor FOB (0-100000)
- `storeShipping`: Envío de tienda (0-10000)
- `checkoutTax`: Impuesto en checkout (0-10000)
- `weight`: Peso (0-500)
- `unit`: `lb` | `kg`
- `shipping`: Flete courier (0-10000)
- `tariff`: Arancel % (0-50)
- `fx`: Tasa USD→DOP (0-1000)
- `interior`: `1` si es envío al interior
- `customRate`: Tarifa personalizada USD/lb (0-100)
- `customWeightRule`: `ceil` | `exact` | `min1`

## Soporte y Donaciones

El proyecto acepta donaciones a través de Stripe Payment Links para mantener la herramienta gratis y actualizada. Los fondos se usan para:
- Hosting y mantenimiento del sitio
- Mejoras y nuevas funcionalidades
- Verificación y actualización de tarifas de couriers

### Para Couriers

Si eres un courier y quieres aparecer con tarifas verificadas cuando se active el directorio, contacta a través del CTA en la página.

## Licencia

Este proyecto es de código abierto. Ver archivo LICENSE para más detalles.

## Fuentes

Las fuentes oficiales están listadas en `src/data/sources-do.js` y se muestran en la página. Incluyen:
- DGA - Preguntas frecuentes
- DGA - Decreto 627-06 (tasa de servicio)
- DGII - ITBIS
- DGA - Registro Courier / RUA
- DGA - Norma General 01-2018

## Disclaimer

Esta herramienta es solo para fines informativos. Los resultados son aproximados y pueden variar según las regulaciones actuales. Siempre consulta con la Dirección General de Aduanas (DGA) y/o tu courier para información precisa y actualizada.
