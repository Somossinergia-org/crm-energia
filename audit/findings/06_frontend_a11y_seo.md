# 06 - Frontend A11Y SEO Performance

## AUDIT-FE-001: Falta de ESLint en Frontend

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Frontend/Quality

### Descripción
ESLint no está configurado ni instalado en el proyecto frontend, a diferencia del backend.

### Evidencia
- Comando: `cd frontend && npm run lint`
- Error: `"eslint" no se reconoce como un comando`
- package.json: script `lint` existe pero ESLint no en devDependencies

### Impacto
- **Negocio**: Código inconsistente, bugs potenciales
- **Técnico**: Sin validación automática de calidad
- **Seguridad**: Posibles vulnerabilidades no detectadas

### Probabilidad
Alta

### Remediación
```bash
cd frontend
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-FE-002: Falta de Auditoría de Accesibilidad

### Severidad
🟡 **MEDIUM**

### Módulo Afectado
Frontend/A11Y

### Descripción
No se detectaron herramientas de accesibilidad ni auditorías WCAG.

### Evidencia
- No hay eslint-plugin-jsx-a11y
- No hay axe-core o similar
- No hay pruebas de accesibilidad

### Impacto
- **Negocio**: Posible exclusión de usuarios con discapacidades
- **Técnico**: No cumple estándares legales
- **Seguridad**: Barreras de acceso

### Probabilidad
Media

### Remediación
```bash
npm install --save-dev eslint-plugin-jsx-a11y axe-core
# Configurar reglas de accesibilidad
# Ejecutar axe-core en CI
```

### Esfuerzo Estimado
**M** (1-2 días)

### Prioridad
Media

### Estado
🔄 Pendiente

---

## AUDIT-FE-003: Falta de Optimización de Imágenes

### Severidad
🔵 **LOW**

### Módulo Afectado
Frontend/Performance

### Descripción
No se detecta optimización automática de imágenes en el build.

### Evidencia
- Vite config sin optimización de imágenes
- No hay vite-plugin-imagemin
- Imágenes podrían ser servidas sin compresión

### Impacto
- **Negocio**: Carga más lenta de la aplicación
- **Técnico**: Mayor uso de bandwidth
- **Seguridad**: No aplica

### Probabilidad
Baja

### Remediación
```bash
npm install --save-dev vite-plugin-imagemin
```

```typescript
// vite.config.ts
import { imagemin } from 'vite-plugin-imagemin';

export default {
  plugins: [
    imagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9] },
      svgo: { plugins: [{ removeViewBox: false }] }
    })
  ]
};
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Baja

### Estado
🔄 Pendiente

---

## AUDIT-FE-004: Falta de Lazy Loading en Rutas

### Severidad
🔵 **LOW**

### Módulo Afectado
Frontend/Performance

### Descripción
Las rutas no usan lazy loading, cargando todos los componentes al inicio.

### Evidencia
- Archivo: `frontend/src/App.tsx`
- Código: `import Dashboard from './pages/Dashboard';`
- Todos los imports son síncronos

### Impacto
- **Negocio**: Tiempo de carga inicial más largo
- **Técnico**: Bundle size mayor
- **Seguridad**: No aplica

### Probabilidad
Baja

### Remediación
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Prospects = lazy(() => import('./pages/Prospects'));

// En las rutas
<Route path="/" element={<Suspense fallback={<div>Loading...</div>}><Dashboard /></Suspense>} />
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Baja

### Estado
🔄 Pendiente

---

## AUDIT-FE-005: Falta de Meta Tags Dinámicos

### Severidad
🔵 **LOW**

### Módulo Afectado
Frontend/SEO

### Descripción
No se detecta gestión dinámica de meta tags para SEO.

### Evidencia
- Archivo: `frontend/index.html`
- Meta tags estáticos
- No hay react-helmet o similar

### Impacto
- **Negocio**: SEO limitado en páginas específicas
- **Técnico**: Compartir enlaces sin preview
- **Seguridad**: No aplica

### Probabilidad
Baja

### Remediación
```bash
npm install react-helmet-async
```

```tsx
import { Helmet } from 'react-helmet-async';

function ProspectDetail({ prospect }) {
  return (
    <>
      <Helmet>
        <title>{prospect.nombre} - CRM Energía</title>
        <meta name="description" content={`Detalles de ${prospect.nombre}`} />
      </Helmet>
      {/* contenido */}
    </>
  );
}
```

### Esfuerzo Estimado
**S** (1-4 horas)

### Prioridad
Baja

### Estado
🔄 Pendiente