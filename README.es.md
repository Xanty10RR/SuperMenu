# SuperMenu - Hub de Operaciones Empresariales | ERP/BOPA a Medida + Middleware Bancario + Centro de Operaciones con IA Conversacional

[🇺🇸 Leer en Inglés](./README.md)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Node.js](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## 🌎 Overview

**SuperMenú** es una plataforma integral de gestión operativa diseñada para centralizar y automatizar procesos empresariales internos en una sola experiencia de escritorio.

Combina un **flujo ERP/BOPA a medida tipo escritorio**, **middleware de gestión de convenios bancarios**, **logística interna**, **administración de usuarios** y un **dashboard de chatbot conversacional de WhatsApp** en un mismo sistema integrado. La aplicación está desarrollada con **Electron + React + TypeScript** y está pensada para ser modular, escalable y fácil de operar en entornos de producción.

**🔗 Demo en vivo:** [https://supermenu-rho.vercel.app/](https://supermenu-rho.vercel.app/)

**☁️ Backend:** Render + Supabase (PostgreSQL)

**🖥️ Escritorio:** Aplicación Electron lista para empaquetado en Windows, macOS y Linux con `electron-builder`

### 📥 ¿Cómo evaluar el proyecto?

#### 🌐 1. Versión web (recomendada para reclutadores)

Acceso inmediato a la aplicación sin instalación.

**👉 [supermenu-rho.vercel.app](https://supermenu-rho.vercel.app/)**

**🔑 Credenciales Demo (la contraseña es igual al usuario):**

> 🔐 **Nota sobre permisos:** Todos los usuarios tienen acceso de visualización al contenido de la plataforma, mientras que las acciones de escritura (crear, editar, aprobar o eliminar) están restringidas por departamento y rol para garantizar el control operativo y la trazabilidad.

> 💡 **Tip:** Usa `admin` para ver la plataforma completa sin restricciones.

| Rol | Usuario | Contraseña | Acceso |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin` | Acceso completo a todos los módulos |
| Sistemas | `jefesistemas` | `jefesistemas` | Métricas del chatbot + Panel de errores |
| Logística | `jefelogistica` | `jefelogistica` | Requisiciones + Logística |
| Comercial | `jefecomercial` | `jefecomercial` | Convenios bancarios |
| RRHH / Otros | `jeferrhh` / `jefeotros` | `jeferrhh` / `jefeotros` | Flujos específicos por rol |

#### 🖥️ 2. Versión de Escritorio Nativa (Multiplataforma)

1. Ve a **[Releases](../../releases)**
2. Descarga el instalador o paquete correspondiente a tu sistema operativo:
   - **Windows:** Descarga `super-menu-setup-1.0.0.exe` y ejecuta el instalador.
   - **macOS:** Descarga `super-menu-1.0.0.dmg`, ábrelo y arrastra la aplicación a tu carpeta de Aplicaciones.
   - **Linux:** Descarga `super-menu-1.0.0-x86_64.AppImage`, hazlo ejecutable y ejecútalo.

## 📸 Capturas de pantalla

| Gestión de Usuarios | Convenios Bancarios |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d794c80f-198c-4054-aa34-8dc08ea388ad" /> | <img src="https://github.com/user-attachments/assets/b79697fd-9c14-46e2-bd80-c80379960b33" /> |

| Requisiciones | Logística |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d7967001-13d6-4fae-851c-6ec9ed68c892" /> | <img src="https://github.com/user-attachments/assets/bed3d0fc-0cbf-425a-8686-9ba9123f924c" /> |

| Centro de Operaciones - Chatbot SuperAsistente | Centro de Operaciones - Dashboard de Errores de API |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d65795bc-be5e-4db5-81cd-2ea5362b5e68" /> | <img src="https://github.com/user-attachments/assets/d187e1ab-23a1-4c19-a853-79e340269227" /> |

## 🏗️ Arquitectura del sistema

El proyecto sigue una arquitectura modular y desacoplada tipo monorepo:

- **Frontend (Vercel):** React + TypeScript + CSS con estructura por módulos y consumo de APIs mediante Axios.
- **Backend (Render):** Node.js + Express + TypeScript, organizado en capas: `routes -> controllers -> services -> provider/database`.
- **Base de datos:** Supabase (PostgreSQL) con vistas optimizadas y registros operativos.
- **Servicio de chatbot:** integración con WhatsApp a través de Meta API y flujo automatizado para procesos empresariales.

## 📦 Módulos del sistema

#### 👥 1. Módulo de usuarios (RBAC & seguridad)

Capa central de seguridad de la plataforma.

- Gestión completa de usuarios con roles como `admin`, `jefesistemas`, `jefelogistica`, `jefecomercial`, `jeferrhh` y `jefeotros`.
- Autenticación con credenciales y protección con bcrypt.
- Control de acceso por endpoint y auditoría por departamento.

#### 🏦 2. Módulo de convenios bancarios (núcleo del negocio - 29k+ registros)

Es el área más compleja y central del negocio.

- Servicio robusto para flujos CRUD dinámicos con `COALESCE` y validación de integridad.
- Formularios híbridos inteligentes con valores reales de la base de datos para categorías, bancos y referencias.
- Paginación controlada, búsquedas avanzadas, edición segura y lógica de eliminación.
- Exportación en Excel por banco.

#### 📋 3. Módulo de requisiciones (inicio del flujo operativo)

Punto de entrada para las solicitudes internas.

- Creación de solicitudes con justificación, centro de costo y cantidades.
- Flujo de estados: `Pendiente -> Aprobado / Rechazado -> Entregado`.
- Prevención de duplicados y validación de campos obligatorios.

#### 🚚 4. Módulo de logística (despachos y trazabilidad)

Convierte una requisición aprobada en una acción real de operación.

- Monitoreo del flujo y cierre histórico con auditoría.

**Flujo completo:** `Solicitud por chatbot -> Aprobación de jefe -> Validación de logística -> Entrega y cierre histórico`

#### 🤖 5. Módulo SuperAssistant (chatbot + centro de operaciones)

**A) Chatbot operativo 24/7**

El bot de WhatsApp está conectado a PostgreSQL y responde consultas relacionadas con convenios y requisiciones. Cada interacción alimenta la tabla de actividad reciente.

**B) Dashboard analítico en tiempo real**

- 9 tarjetas de métricas alimentadas por `/api/chatbot/metrics`.
- Tabla de actividad reciente actualizada mediante polling con `useEffect` + `setInterval`.
- Sincronización en tiempo real de intención y flujo del bot.

**C) Centro de control de errores de API**

1. **Daemon inteligente de auto-resolución:** `setInterval` cada 30 segundos en `server.ts` para marcar automáticamente los errores de red recuperados como resueltos.
2. **Lógica de borrado suave:** los registros archivados permanecen en base de datos usando `archivado BOOLEAN`, mientras las consultas activas los excluyen.
3. **Botón maestro para limpiar historial:** `PATCH /api/errores/archivar-resueltos` para archivar todos los errores resueltos de una vez.

## 🛠️ Stack tecnológico

**Frontend & Desktop:** React, TypeScript, Electron, Electron-Vite, CSS, Axios, MUI, React Icons

**Backend:** Node.js, Express, TypeScript, TSX

**Base de datos:** PostgreSQL

**Infraestructura:** Supabase, Vercel (frontend), Render (backend)

## 🚀 Instalación local

```bash
# 1. Clonar el proyecto
git clone https://github.com/Xanty10RR/SuperMenu
cd SuperMenu

# 2. Instalar dependencias de la raíz (Electron + frontend)
npm install

# 3. Configurar variables de entorno
# crear un archivo .env con los valores necesarios, por ejemplo:
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...

# 4. Iniciar el backend
cd src/backend
npm install
npm run dev

# 5. Regresar a la raíz y levantar la app Electron
cd ../..
npm run dev
```

## 📬 Contáctame

- 👨🏻‍💻 [LinkedIn](https://www.linkedin.com/in/daniel-santiago-rosero-4420a91b0/)
- 📧 [Gmail](mailto:santiagocajamarca.37@gmail.com)
