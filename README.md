# SuperMenú - Plataforma de Gestión Operativa Integral

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Axios](https://img.shields.io/badge/axios-671ddf?&style=for-the-badge&logo=axios&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Node JS](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express JS](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white)

## Overview

Plataforma de escritorio SaaS de tipo **ERP (Enterprise Resource Planning) / BOPA (Business Process Automation)** + **Middleware Bancario** + **Conversational AI Dashboard**, desarrollada con **arquitectura modular y escalable**.

**SuperMenu** es una aplicación de escritorio creada con el framework Electron, con una interfaz de usuario basada en React. Está diseñada para centralizar solicitudes de requisiciones, entregas, convenios bancarios, usuarios y el chatbot de whatsapp (SuperAsistente) en una única aplicación de escritorio, lo que mejora la eficiencia, el control operativo y el seguimiento de los procesos de negocio. Está configurada para empaquetarse en Windows, macOS y Linux mediante `electron-builder`.

**🔗 Demo en Vivo:** [https://supermenu-rho.vercel.app/](https://supermenu-rho.vercel.app/)<br>
**☁️ Backend:** Render + Supabase (PostgreSQL)<br>
**🖥️ Desktop:** Electron (.exe disponible en Releases)

### 📥 ¿Cómo Evaluar el Proyecto?

#### 🌐 1. Versión Web (Recomendado para Reclutadores)
Acceso inmediato sin instalación. Proyecto completo funcionando en producción.
**👉 [supermenu-rho.vercel.app](https://supermenu-rho.vercel.app/)**

#### 🖥️ 2. Versión de Escritorio Nativa (Windows)
Experiencia nativa con Electron conectada a producción.
1. Ve a **[Releases](../../releases)**
2. Descarga el `SuperMenu-Setup.exe`
3. Instala y ejecuta. ¡Ya está conectado a Supabase!

## 🏗️ Arquitectura del Sistema

El proyecto utiliza una **Arquitectura Modular Monorepo** desacoplada:

**Frontend (Vercel):** React + TypeScript + CSS3. Arquitectura por features, consumo de API vía Axios con interceptores JWT.
**Backend (Render):** Node.js + Express + TypeScript. Arquitectura en capas: `routes -> controllers -> services -> provider/database`. Despliegue continuo.
**Base de Datos:** Supabase (PostgreSQL) con RLS, vistas optimizadas y más de 29k registros bancarios operativos.
**Chatbot Service:** Microservicio BuilderBot + Meta Cloud API (WhatsApp) que funciona como Daemon independiente.

## 📦 Módulos del Sistema

#### 👥 1. Módulo de Usuarios (RBAC & Seguridad)
Corazón de la seguridad de la plataforma.
- Gestión completa de usuarios con roles: `admin`, `jefesistemas`, `jefelogistica`, `jefecomercial`, `jeferrhh`, `jefeotros`.
- Autenticación JWT y control de acceso por endpoint (Middleware `x-user-role`).
- Activación/desactivación de cuentas y auditoría de accesos según departamento.

#### 🏦 2. Módulo de Convenios Bancarios (Core de Negocio - 29k+ Registros)
El módulo más complejo. Centraliza el ciclo de vida de convenios bancarios de recaudo **BBVA, Agrario y Red Aval**.
- **Motor Robusto:** Servicio `convenio.service.ts` con lógica INSERT/UPDATE usando `COALESCE` para manejar 20+ campos dinámicos sin romper integridad.
- **Formularios Híbridos Inteligentes:** Inputs con `<datalist>` que consultan valores únicos reales de la BD como (Categoría, Banco Dueño, Referencia) permitiendo seleccionar o crear nuevos valores al vuelo.
- **CRUD End-to-End:** Paginación avanzada con salto directo e instantáneo a página, búsqueda de alta densidad, edición segura (corrección de NIT) y eliminación controlada.
- **Exportación Ejecutiva:** Descarga nativa a Excel (CSV/Blob) por banco.

#### 📋 3. Módulo de Requisición (Inicio del Flujo Operativo)
Punto de partida de toda solicitud interna.
- Creación de solicitudes con justificación, centro de costo y cantidades.
- **Flujo de Estados Inteligente:** `Pendiente -> Aprobado / Rechazado -> Entregado`.
- Validaciones anti-duplicidad y control de campos obligatorios.

#### 🚚 4. Módulo de Logística (Despachos y Trazabilidad)
Transforma la requisición aprobada en una operación real.
- Trazabilidad en tiempo real con cierre histórico.

**Flujo Completo:** `Creación requisición por el chatbot-> Aprobación por jefe de departamento-> Logística (confirma la aprobación o la rechaza - Empaque/Ruta) -> Entrega y Cierre Histórico`

#### 🤖 5. Módulo SuperAsistente (Chatbot + Centro de Operaciones)

**A) Chatbot Operativo 24/7:**
Bot desplegado en WhatsApp (Meta API) integrado a PostgreSQL. Atiende consultas de convenios y requisiciones. Cada conversación alimenta la tabla `Actividad Reciente`.

**B) Dashboard Analytics en Tiempo Real:**
- 9 Cards de métricas superiores alimentadas por `/api/chatbot/metrics` con queries SQL optimizadas y agregadas.
- Tabla de Actividad Reciente con actualización vía `useEffect` + `setInterval` (polling corto), sin necesidad de F5.
- Sincronización de intención/flujo del bot en vivo.

**C) Centro de Control de Errores de API (Tu foto):**
1.  **Daemon Inteligente de Auto-Resolución:** `setInterval` cada 30s en `server.ts`. Si detecta que internet volvió, marca automáticamente como `resuelto = TRUE` todos los errores de `timeout, ECONNRESET, network, etc`.
2.  **Soft Delete (Archivado Lógico):** No se borra nada. Usa la columna `archivado BOOLEAN`. El backend filtra `WHERE archivado = FALSE`, manteniendo auditoría intacta.
3.  **Botón Maestro Limpiar Historial:** `PATCH /api/errores/archivar-resueltos` que archiva todos los resueltos de un golpe.

### 🛠️ Stack Tecnológico

**Frontend & Desktop:** React, TypeScript, Electron, Electron-Vite, Tailwind, CSS, Axios, MUI, React Icons<br>
**Backend:** Node.js, Express, TypeScript, TSX<br>
**Base de datos:** PostgreSQL
**Infraestructura:** Supabase, Vercel (Frontend), Render (Backend)

### 🚀 Instalación Local

```bash
# 1. Clonar
git clone https://github.com/Xanty10RR/SuperMenu

# 2. Backend
cd backend
npm install
# configurar .env con SUPABASE_URL, JWT, etc
npm run dev

# 3. Frontend
npm install
npm run dev
``` 


## Contact me

- 👨🏻‍💻[![LinkedIn](https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/daniel-santiago-rosero-4420a91b0/)
- 📧 [![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:santiagocajamarca.37@gmail.com)
