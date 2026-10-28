![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Desktop-Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)

# SuperMenu (Sistema ERP)

A cross-platform desktop application built with Electron and React.

## Overview

`SuperMenu` is a desktop application (custom ERP system) created using the Electron framework, with a user interface built on React, designed to centralize requests, deliveries, support, users, and requisitions within a single desktop application — enhancing efficiency, operational control, and business process tracking. It is configured to be packaged for Windows, macOS, and Linux using `electron-builder`.

## Features

- Cross-platform compatibility (Windows, macOS, Linux).
- Modern and reactive UI built with React.

# 🚀 SuperMenú - Plataforma de Gestión Operativa Integral & Chatbot Inteligente

> Plataforma SaaS de tipo **ERP / BOPA (Business Process Automation)** + **Middleware Bancario** + **Conversational AI Dashboard**, desarrollada con arquitectura modular y escalable.

**🔗 Demo en Vivo:** [https://supermenu-rho.vercel.app/](https://supermenu-rho.vercel.app/)
**☁️ Backend:** Render + Supabase (PostgreSQL)
**🖥️ Desktop:** Electron (.exe disponible en Releases)

---

### 📥 ¿Cómo Evaluar el Proyecto?

#### 🌐 1. Versión Web (Recomendado para Reclutadores)

Acceso inmediato sin instalación. Dashboard completo funcionando en producción.
**👉 [supermenu-rho.vercel.app](https://supermenu-rho.vercel.app/)**

#### 🖥️ 2. Versión de Escritorio Nativa (Windows)

Experiencia nativa con Electron conectada a producción.

1. Ve a **[Releases](../../releases)**
2. Descarga el `SuperMenu-Setup.exe`
3. Instala y ejecuta. ¡Ya está conectado a Supabase!

---

### 🏗️ Arquitectura del Sistema

El proyecto utiliza una **Arquitectura Modular Monorepo** desacoplada:

**Frontend (Vercel):** React + TypeScript + Tailwind + MUI. Arquitectura por features, consumo de API vía Axios con interceptores JWT.
**Backend (Render):** Node.js + Express + TypeScript. Arquitectura en capas: `routes -> controllers -> services -> provider/database`. Despliegue continuo.
**Base de Datos:** Supabase (PostgreSQL) con RLS, vistas optimizadas y más de 20k registros operativos.
**Chatbot Service:** Microservicio BuilderBot + Meta Cloud API (WhatsApp) que funciona como Daemon independiente.

---

### 📦 Módulos del Sistema

#### 👥 1. Módulo de Usuarios (RBAC & Seguridad)

Corazón de la seguridad de la plataforma.

- Gestión completa de usuarios con roles: `admin`, `jefe`, `sistemas`, `logistica`.
- Autenticación JWT y control de acceso por endpoint (Middleware `x-user-role`).
- Activación/desactivación de cuentas y auditoría de accesos.

#### 🏦 2. Módulo de Convenios Bancarios (Core de Negocio - 20k+ Registros)

El módulo más complejo. Centraliza el ciclo de vida de convenios de recaudo de **BBVA, Banco Agrario y Red Aval**.

- **Motor Robusto:** Servicio `convenio.service.ts` con lógica INSERT/UPDATE usando `COALESCE` para manejar 20+ campos dinámicos sin romper integridad.
- **Formularios Híbridos Inteligentes:** Inputs con `<datalist>` que consultan valores únicos reales de la BD (Categoría, Banco Dueño, Referencia) permitiendo seleccionar o crear nuevos valores al vuelo.
- **CRUD End-to-End:** Paginación avanzada con salto directo a página, búsqueda de alta densidad, edición segura (corrección de NIT) y eliminación controlada.
- **Exportación Ejecutiva:** Descarga nativa a Excel (CSV/Blob) por banco con transformación de cabeceras `nombre_convenio` -> `NOMBRE CONVENIO`.

#### 📋 3. Módulo de Requisición (Inicio del Flujo Operativo)

Punto de partida de toda solicitud interna.

- Creación de solicitudes con justificación, centro de costo y cantidades.
- **Flujo de Estados Inteligente:** `Pendiente -> Aprobado / Rechazado -> En proceso`.
- Validaciones anti-duplicidad y control de campos obligatorios.

#### 🚚 4. Módulo de Logística (Despachos y Trazabilidad)

Transforma la requisición aprobada en una operación real.

- Gestión de despachos con guías, lotes y documentos de transporte.
- Control de rutas conectado a catálogo de Departamentos/Ciudades.
- **Trazabilidad en Tiempo Real:** `Preparando -> En Tránsito -> Entregado`, con cierre histórico.

**Flujo Completo:** `Creación (Requisición) -> Aprobación -> Logística (Empaque/Ruta) -> Entrega y Cierre Histórico`

#### 🤖 5. Módulo SuperAsistente (Chatbot + Centro de Operaciones)

**A) Chatbot Operativo 24/7:**
Bot desplegado en WhatsApp (Meta API) integrado a PostgreSQL. Atiende consultas de convenios y requisiciones. Cada conversación alimenta la tabla `Actividad Reciente`.

**B) Dashboard Analytics en Tiempo Real:**

- 9 Cards de métricas superiores alimentadas por `/api/chatbot/metrics` con queries SQL optimizadas y agregadas.
- Tabla de Actividad Reciente con actualización vía `useEffect` + `setInterval` (polling corto), sin necesidad de F5.
- Sincronización de intención/flujo del bot en vivo.

**C) Centro de Control de Errores de API (Tu foto):**
Este es el diferencial senior del proyecto:

1.  **Daemon Inteligente de Auto-Resolución:** `setInterval` cada 30s en `server.ts`. Si detecta que internet volvió, marca automáticamente como `resuelto = TRUE` todos los errores de `timeout, ECONNRESET, network`.
2.  **Soft Delete (Archivado Lógico):** No borramos nada. Usamos columna `archivado BOOLEAN`. El backend filtra `WHERE archivado = FALSE`, manteniendo auditoría intacta.
3.  **Botón Maestro Limpiar Historial:** `PATCH /api/errores/archivar-resueltos` que archiva todos los resueltos de un golpe.
4.  **UX Avanzada:** Pestañas `Pendientes (3)` / `Historial (15)` con contadores reales, y filtro de Período (Todo, 24h, Última semana).

---

### 🛠️ Stack Tecnológico

**Frontend & Desktop:** React, TypeScript, Electron, Electron-Vite, Tailwind CSS, Material-UI, Axios
**Backend:** Node.js, Express, TypeScript, BuilderBot, TSX
**Infraestructura:** Supabase (PostgreSQL), Vercel (Frontend), Render (Backend)

### 🚀 Instalación Local

```bash
# 1. Clonar
git clone https://github.com/Xanty10RR/SuperMenu
cd SuperMenu

# 2. Instalar dependencias de la app Electron
npm install

# 3. Instalar dependencias del backend
cd src/backend
npm install
# crear un .env con tus variables locales de base de datos
# ejemplo:
# DB_HOST=tu-host
# DB_PORT=5432
# DB_NAME=tu_base
# DB_USER=tu_usuario
# DB_PASSWORD=tu_password
# PORT=3003

# 4. Iniciar backend local
npm run dev

# 5. Volver a la raíz e iniciar la app Electron
cd ../..
npm run dev
```

> Nota: este repositorio no tiene un frontend separado en una carpeta `frontend`; la UI y la app desktop se ejecutan desde la raíz con Electron + Vite. En la app, la URL del backend por defecto apunta a Render (`src/renderer/src/config.ts`), por lo que si deseas usar un backend local debes cambiar esa URL o configurar tu entorno para apuntar a tu servidor local.

## Contact me

- 👨🏻‍💻[![LinkedIn](https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/daniel-santiago-rosero-4420a91b0/)
- 📧 [![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:santiagocajamarca.37@gmail.com)
