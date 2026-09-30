# Apex Enterprise AI Platform
### Production-Grade AI-Powered Operations & Collaboration Assistant

An enterprise organizational intelligence layer connecting departments, tasks, projects, policies, meeting notes, workflows, and business insights with server-side Google Gemini AI integration, PostgreSQL, and strict multi-tenant organizational isolation.

---

## 🌟 Architecture & Core Capabilities

1. **Centralized Operational Knowledge**:
   - Centralizes policies, Standard Operating Procedures (SOPs), financial reports, and meeting transcripts.
   - Categorized by department, project, and visibility scope.

2. **Ground Truth Enterprise AI Copilot (`@google/genai`)**:
   - Answers natural language questions grounded in verified organizational context.
   - Generates structured JSON responses with direct answers, key points, internal resource citations (tasks, projects, SOPs, meetings), and follow-up prompts.

3. **Intelligent Work Management & Task Decomposition**:
   - Kanban & List views with priority indicators (`critical`, `high`, `medium`, `low`) and status transitions (`todo`, `in_progress`, `blocked`, `completed`, `cancelled`).
   - Prerequisite dependency tracking preventing premature execution.
   - **AI Task Decomposition**: Converts unstructured business requests (e.g. *"We need to launch the new customer portal next month..."*) into structured, assignable tasks with priorities and reasoning for human review and confirmation.

4. **Meeting Intelligence & 1-Click Action Item Conversion**:
   - Analyzes meeting transcripts and automatically extracts executive summaries, decisions, and action items.
   - **1-Click Conversion**: Action items can be converted directly into real production tasks in the database with a single click.

5. **Explainable AI Operational Insights**:
   - Continuously scans workloads, dependencies, and deadlines to detect bottlenecks, overdue items, single-points-of-failure, and cross-department blockers.
   - Every insight provides severity, category, supporting evidence data, and recommended next steps.

6. **Executive Operations Briefings & Reporting**:
   - Generates comprehensive executive status briefings with KPIs, key achievements, operational bottlenecks, risks, and strategic next steps.

7. **Multi-Tenant Security & Role-Based Access Control (RBAC)**:
   - Server-side JWT sessions enforcing organization isolation.
   - Roles supported: `employee`, `manager`, `department_admin`, and `organization_admin`.
   - Immutable audit log capturing authentication events, data modifications, and AI operations.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Router v6, TanStack Query, Lucide React, Vite
- **Backend**: Node.js, Express.js, TypeScript, REST API, Zod Schema Validation
- **Database**: PostgreSQL (Dual-mode engine: connects to external PostgreSQL when `DATABASE_URL` is set, or automatically uses embedded PostgreSQL via `@electric-sql/pglite`)
- **AI Engine**: Google Gemini API (`@google/genai` / `@google/generative-ai`), strictly executed on the server side

---

## 📁 Repository Structure

```text
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable Badges, Modals, Search, Task Forms
│   │   ├── context/            # AuthContext with 1-click role switcher
│   │   ├── layouts/            # AppLayout with collapsible sidebar and navigation
│   │   ├── pages/              # Dashboard, Assistant, Search, Tasks, Projects, etc.
│   │   ├── services/           # ApiService client
│   │   ├── App.tsx             # React Router routing configuration
│   │   ├── index.css           # Tailwind design tokens & styles
│   │   └── main.tsx            # Vite entrypoint
│   ├── index.html              # HTML with Inter & JetBrains Mono fonts
│   └── vite.config.ts          # Vite configuration with API proxy
│
├── server/                     # Backend Application
│   ├── db/                     # Unified PostgreSQL adapter & seed scripts
│   ├── middleware/             # JWT Authentication, RBAC, and Audit Logging
│   ├── routes/                 # REST endpoints (auth, dashboard, tasks, ai, etc.)
│   ├── services/               # Gemini AI engine with prompt defense & Zod validation
│   └── index.ts                # Express server entrypoint
│
├── shared/                     # Shared between frontend and backend
│   ├── schemas/                # Zod schemas for API & AI responses
│   └── types/                  # TypeScript interface definitions
│
├── migrations/                 # PostgreSQL Schema DDL
│   └── 001_initial_schema.sql  # 18 relational tables, foreign keys & indexes
│
├── .env.example                # Documented configuration template
├── package.json                # Dependencies and scripts
└── test_e2e.js                 # 36-point automated end-to-end test suite
```

---

## 🚀 Getting Started

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Parameters in `.env`:
- `NODE_ENV`: `development` or `production`
- `PORT`: `5000` (API server port)
- `DATABASE_URL`: *(Optional)* Connection string for external PostgreSQL. If blank or unreachable, the built-in embedded PostgreSQL engine runs automatically.
- `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key. When set, live Gemini models generate intelligence. When omitted, the built-in enterprise semantic synthesis engine operates seamlessly.
- `SESSION_SECRET`: Secret key used for signing JWT tokens.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Mode

To run both the backend server and frontend client concurrently:

```bash
npm run dev
```

The application will be accessible at:
- **Web Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### 4. Build for Production

```bash
npm run build
npm start
```

---

## ☁️ Deploying to Vercel & Supabase

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit of Enterprise AI Platform"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
2. Select your GitHub repository.
3. In **Build and Output Settings**:
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist/client`
4. Add the following **Environment Variables** in Vercel project settings:
   - `DATABASE_URL`: Your Supabase connection string (or external Postgres URL)
   - `SUPABASE_URL`: `https://ogimztpmxfvmpxfeceqd.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_...`
   - `SUPABASE_SECRET_KEY`: `sb_secret_...`
   - `GEMINI_API_KEY`: Your Gemini API key
   - `SESSION_SECRET`: A secure random JWT signing secret
5. Click **Deploy**. Vercel will build the Vite frontend and host the serverless API via `vercel.json`!

---

## 👤 Demo User Accounts (1-Click Switchable)

The platform comes pre-seeded with sample enterprise data and 1-click role presets on the login screen:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Organization Admin** | Sarah Chen | `sarah.chen@apexglobal.com` | `Password123!` |
| **Manager** | Marcus Vance | `marcus.vance@apexglobal.com` | `Password123!` |
| **Staff Employee** | Elena Rostova | `elena.rostova@apexglobal.com` | `Password123!` |

*(The sidebar also includes an instant **Role Switcher** widget to preview how the dashboard and permissions adapt to different roles in real-time.)*

---

## 🧪 Automated End-to-End Testing

To execute the automated 36-point verification suite covering all APIs and AI workflows:

```bash
node test_e2e.js
```
