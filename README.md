# SuperMenu - Enterprise Operations Hub | Custom ERP/BOPA + Banking Middleware + Conversational AI Operations Center

[🇪🇸 Read in Spanish](./README.es.md)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Axios](https://img.shields.io/badge/axios-671ddf?&style=for-the-badge&logo=axios&logoColor=white)
![Node.js](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## 🌎 Overview

**SuperMenu** is a comprehensive operational management platform designed to centralize and automate internal business processes in a single desktop experience.

It combines a **custom desktop ERP/BOPA workflow**, **banking agreement middleware**, **internal logistics**, **user administration**, and a **conversational WhatsApp chatbot with a real-time operations dashboard** into one integrated system. The application is built with **Electron + React + TypeScript** and is designed to be modular, scalable, and production-ready.

**🔗 Live Demo:** [https://supermenu-rho.vercel.app/](https://supermenu-rho.vercel.app/)

**☁️ Backend:** Render + Supabase (PostgreSQL)

**🖥️ Desktop:** Electron app ready for Windows, macOS, and Linux packaging via `electron-builder`

### 📥 How to evaluate the project

#### 🌐 1. Web version (recommended for recruiters)

Access the live product without installation.

**👉 [supermenu-rho.vercel.app](https://supermenu-rho.vercel.app/)**

**🔑 Demo Credentials (password is same as user):**

| Role | Username | Password | Access |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin` | Full access to all modules |
| Sistemas | `jefesistemas` | `jefesistemas` | Chatbot metrics + Error center |
| Logística | `jefelogistica` | `jefelogistica` | Requisitions + Logistics |
| Comercial | `jefecomercial` | `jefecomercial` | Banking agreements |
| RRHH / Otros | `jeferrhh` / `jefeotros` | `jeferrhh` / `jefeotros` | User-specific flows |

> 💡 **Tip:** Use `admin` to see the entire platform without restrictions.

#### 🖥️ 2. Native desktop version (Windows)

1. Go to **[Releases](../../releases)**
2. Download `win-unpacked.zip`
3. Unzip the file
4. Open the folder and double-click `SuperMenu.exe`

## 📸 Screenshots

| User Management | Banking Agreements |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d794c80f-198c-4054-aa34-8dc08ea388ad" /> | <img src="https://github.com/user-attachments/assets/b79697fd-9c14-46e2-bd80-c80379960b33" /> |

| Requisitions | Logistics |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d7967001-13d6-4fae-851c-6ec9ed68c892" /> | <img src="https://github.com/user-attachments/assets/bed3d0fc-0cbf-425a-8686-9ba9123f924c" /> |

| Operations Center - SuperAsistente Chatbot | Operations Center - API Error Dashboard |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d65795bc-be5e-4db5-81cd-2ea5362b5e68" /> | <img src="https://github.com/user-attachments/assets/d187e1ab-23a1-4c19-a853-79e340269227" /> |

## 🏗️ System architecture

The project follows a modular and decoupled monorepo architecture:

- **Frontend (Vercel):** React + TypeScript + CSS. Feature-based structure and API consumption through Axios.
- **Backend (Render):** Node.js + Express + TypeScript, organized by layers: `routes -> controllers -> services -> provider/database`.
- **Database:** Supabase (PostgreSQL) with optimized views and operational records.
- **Chatbot service:** WhatsApp integration via Meta API and a dedicated automation flow for business processes.

## 📦 System modules

#### 👥 1. User module (RBAC & security)

Core security layer of the platform.

- Full user management with roles such as `admin`, `jefesistemas`, `jefelogistica`, `jefecomercial`, `jeferrhh`, and `jefeotros`.
- Authentication with credentials and bcrypt protection.
- Access control by endpoint and department-based audit logic.

#### 🏦 2. Banking agreements module (core business - 29k+ records)

This is the central and most complex business area of the platform.

- Robust service layer for dynamic CRUD flows with `COALESCE` handling and data integrity protection.
- Hybrid smart forms using real database values for categories, owner banks, and references.
- Controlled pagination, advanced search, secure editing, and deletion logic.
- Excel export per bank.

#### 📋 3. Requisition module (start of operational flow)

Entry point for internal requests.

- Request creation with justification, cost center, and quantities.
- State flow: `Pending -> Approved / Rejected -> Delivered`.
- Duplicate prevention and required-field validation.

#### 🚚 4. Logistics module (dispatch and traceability)

Turns an approved requisition into a real operational action.

- Flow monitoring and historical closure with auditing.

**Complete flow:** `Chatbot request -> Department approval -> Logistics validation -> Delivery and historical close`

#### 🤖 5. SuperAssistant module (chatbot + operations center)

**A) 24/7 operational chatbot**

The WhatsApp bot is connected to PostgreSQL and responds to requests about agreements and requisitions. Every interaction feeds the recent activity table.

**B) Real-time analytics dashboard**

- 9 summary metric cards fed by `/api/chatbot/metrics`.
- Recent activity table updated via polling with `useEffect` + `setInterval`.
- Real-time synchronization of bot intent and flow.

**C) API error control center**

1. **Smart auto-resolution daemon:** `setInterval` every 30s in `server.ts` to mark recovered network issues as resolved automatically.
2. **Soft-delete logic:** Archived records stay in the database using `archivado BOOLEAN` while active queries exclude them.
3. **Master clear history button:** `PATCH /api/errores/archivar-resueltos` to archive all resolved errors at once.

## 🛠️ Technology stack

**Frontend & Desktop:** React, TypeScript, Electron, Electron-Vite, CSS, Axios, MUI, React Icons

**Backend:** Node.js, Express, TypeScript, TSX

**Database:** PostgreSQL

**Infrastructure:** Supabase, Vercel (frontend), Render (backend)

## 🚀 Local installation

```bash
# 1. Clone the project
git clone https://github.com/Xanty10RR/SuperMenu
cd SuperMenu

# 2. Install root dependencies (Electron + frontend)
npm install

# 3. Configure environment variables
# create a .env file with the required values, for example:
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...

# 4. Start the backend
cd src/backend
npm install
npm run dev

# 5. Go back to the root and launch the Electron app
cd ../..
npm run dev
```

## 📬 Contact me

- 👨🏻‍💻 [LinkedIn](https://www.linkedin.com/in/daniel-santiago-rosero-4420a91b0/)
- 📧 [Gmail](mailto:santiagocajamarca.37@gmail.com)
