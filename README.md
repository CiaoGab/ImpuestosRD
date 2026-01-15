# ImpuestosRD

Calculadora de impuestos de importación para República Dominicana. Calcula impuestos según la regla de $200 USD y tasa DGA por kilo.

## Características

- **Cálculo automático de modo**: Cambia automáticamente entre modo ≤$200 y ≥$200 según el valor declarado
- **Modo manual**: Opción de override para seleccionar manualmente el modo de cálculo
- **Cálculo preciso**: Implementa las reglas oficiales de DGA y DGII
- **Compartir resultados**: Genera URLs compartibles con los parámetros del cálculo
- **Responsive**: Diseño adaptado para móviles y escritorio

## Estructura del Proyecto

```
ImpuestosRD/
├── index.html          # Página principal
├── src/
│   ├── app.js          # Lógica principal de la aplicación
│   ├── calc/
│   │   └── do.js       # Funciones de cálculo de impuestos
│   ├── data/
│   │   └── sources-do.js  # Fuentes oficiales
│   └── ui/
│       ├── format.js    # Utilidades de formateo
│       └── render.js   # Funciones de renderizado
├── robots.txt          # Configuración para buscadores
├── sitemap.xml         # Mapa del sitio
└── README.md           # Este archivo
```

## Configuración

### Variables de Configuración

En `src/app.js`:

- `DONATION_URL`: URL para donaciones (actualizar con tu enlace real)
- `SHOW_COURIERS`: Feature flag para mostrar/ocultar sección de couriers (por defecto: `false`)

### Bounds de Input

Los valores de entrada están limitados a rangos seguros:

- Valor del producto: 0 - 100,000 USD
- Peso: 0 - 500 kg/lb
- Costo de envío: 0 - 10,000 USD
- Arancel: 0 - 50%

## Despliegue

### Requisitos

- Servidor web estático (no se requiere backend)
- HTTPS habilitado (recomendado)

### Pasos de Despliegue

1. **Actualizar configuración**:
   - Reemplazar `DONATION_URL` con tu enlace de donación real
   - Ajustar `SHOW_COURIERS` si tienes partners de courier

2. **Actualizar URLs**:
   - Actualizar `sitemap.xml` con tu dominio real
   - Actualizar `robots.txt` con tu dominio real
   - Actualizar meta tags en `index.html` (og:url, canonical)

3. **Subir archivos**:
   - Subir todos los archivos a tu servidor web
   - Asegurar que `index.html` está en la raíz

4. **Configurar servidor**:
   - Habilitar HTTPS
   - Configurar headers de cache apropiados
   - Configurar CORS si es necesario

5. **Verificar**:
   - Probar el cálculo en diferentes escenarios
   - Verificar que las URLs compartibles funcionan
   - Probar en diferentes navegadores y dispositivos

## Desarrollo

### Tecnologías

- HTML5
- JavaScript (ES6 modules)
- Tailwind CSS (via CDN)

### Mejoras Futuras

- Reemplazar Tailwind CDN con CSS compilado
- Implementar CSP estricto después de remover CDN
- Agregar analytics (opcional)
- Agregar sección FAQ para SEO

## Seguridad

- Validación y sanitización de inputs
- Bounds checking en todos los valores numéricos
- Sanitización de parámetros de URL
- Renderizado seguro (textContent en lugar de innerHTML donde sea posible)

## Licencia

Este proyecto es de código abierto. Ver archivo LICENSE para más detalles.

## Fuentes

Las fuentes oficiales están listadas en `src/data/sources-do.js` y se muestran en la página.
