# CareOn — AI-Powered Rural Healthcare Platform

CareOn is a full-stack healthcare web application designed to explore and improve healthcare access for patients in rural and underserved communities. In low-resource settings, individuals often face significant physical distance from medical centers, shortages of specialized healthcare workers, and fragmented health records. CareOn addresses these challenges through digitized patient record management, role-based workflows, assistive AI health analysis, client-side appointment scheduling prototypes, and real-time peer-to-peer telemedicine video consultations.

> **Academic Project Note:** CareOn is developed as an academic and software engineering project. It demonstrates full-stack software architecture, WebRTC video calling, asynchronous signaling, role-based access control, and assistive artificial intelligence. It is not intended as a production medical system.

---

## 🚀 Overview

The CareOn platform brings together core healthcare services into a unified web application:

1. **Authentication & Role Segregation**: Patients, doctors, and administrators authenticate securely and access features according to their assigned roles.
2. **Patient Record Management**: Doctors and administrators create, review, update, and delete digitized patient records backed by a PostgreSQL database.
3. **Assistive AI Analysis**: Patients and doctors upload medical reports or skin images to receive structured educational summaries powered by Google's Gemini models, accompanied by strict non-diagnostic disclaimers.
4. **Telemedicine Scheduling Prototype**: Healthcare providers can explore a consultation review interface, schedule appointment times with client-side call window logic, and join active WebRTC consultation rooms.
5. **Real-Time Video Consultations**: In-browser peer-to-peer video and audio consultations using WebRTC with lightweight Socket.IO signaling and automated race-condition handling.

---

## ✨ Key Features

### Authentication & Authorization
- **JWT-Based Authentication**: JSON Web Tokens signed with server secrets and issued with a 1-day expiration.
- **HTTP-Only Cookies**: Tokens are stored in `careon_token` HTTP-only cookies (`sameSite: "lax"`, `secure` in production) to mitigate Cross-Site Scripting (XSS) risks.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions enforced across `PATIENT`, `DOCTOR`, and `ADMIN` roles.
- **Dual Response Behavior**:
  - Web page requests without authentication redirect to `/login`; unauthorized roles render an HTTP 403 page (`views/errors/403.ejs`).
  - REST API requests (`/api/*`) return clean JSON responses (`401 Unauthorized` or `403 Forbidden`).

### Patient Management
- **Full CRUD Operations**: REST endpoints to create, read, update, and delete patient records via `/api/patients`.
- **Structured Validation**: Server-side request payload validation using `express-validator` (e.g., Patient ID format `PAT-XXX`, valid phone numbers, required names).
- **Access Restriction**: Patient record modifications and viewing are strictly restricted to `DOCTOR` and `ADMIN` roles.

### AI-Assisted Health Analysis
- **Google GenAI Integration**: Uses the `@google/genai` SDK with the `gemini-3.6-flash` model.
- **Two Educational Modes**:
  - **Skin Observations**: Educational breakdown of visible skin marks, questions to ask a doctor, and precautionary guidance.
  - **Medical Lab Reports**: Text extraction and explanation of key test metrics, abnormal ranges, and conversational questions for doctor visits.
- **MIME & Size Enforcement**: In-memory buffer uploads restricted to `image/jpeg`, `image/png`, and `image/webp` up to 5 MB via Multer.
- **Assistive Safeguards**: System prompts explicitly instruct the AI not to provide definitive diagnoses or prescribe medications, clarifying that the analysis is for educational purposes and cannot replace professional clinical examination.

### Healthcare Dashboard
- **Statistics API**: `GET /api/dashboard/stats` queries PostgreSQL via Prisma ORM to return live metrics (e.g., total registered patients).
- **Role-Aware Navigation**: The navigation bar dynamically adapts based on user role (`PATIENT`, `DOCTOR`, `ADMIN`), directing users to authorized modules. Protected backend routes and APIs enforce role access.

### Telemedicine & Appointment Scheduling (Prototype Workflow)
- **Demo Consultation Queue**: The telemedicine page displays a demo consultation request card (`PAT-001`) illustrating how incoming requests can be accepted or declined.
- **Client-Side Appointment Scheduling**: Clicking "Accept & Schedule" opens a modal to choose an appointment date and time. Created appointments are rendered dynamically in the browser DOM (in-memory) for the current session. *(Note: Appointments are not currently stored in the PostgreSQL database).*
- **Call Window Enforcement**: Client-side logic monitors whether the current time falls within the configured consultation window:
  - `CALL_WINDOW_MINUTES_BEFORE = 10`
  - `CALL_WINDOW_MINUTES_AFTER = 60`
- **Dynamic Call Links**: Join buttons remain disabled until the consultation window opens, dynamically linking to `/telemedicine?room=appointment-${patientId}`. Participants coordinate entry via this room URL.

### Real-Time Video Consultation
- **Socket.IO Signaling Gateway**: Used exclusively for lightweight signaling message passing (`join-room`, `user-joined`, `offer`, `answer`, `ice-candidate`, `disconnect`).
- **WebRTC Peer-to-Peer Media**: Audio and video streams flow directly between user browsers via `RTCPeerConnection` without passing through the application server.
- **Hardware Integration**: Connects to user camera and microphone via `navigator.mediaDevices.getUserMedia()`.
- **Public NAT Traversal**: Configured with Google public STUN (`stun:stun.l.google.com:19302`).

---

## 🏗️ System Architecture

### Core Application Architecture

```
+-----------------------------------------------------------------+
|                       Client Web Browser                        |
|   (EJS Templates, Vanilla JS, Tailwind CSS CDN, FontAwesome)    |
+-----------------------------------------------------------------+
                                |
                         HTTP / REST API
                                |
+-----------------------------------------------------------------+
|                    CareOn Express Server                        |
|                                                                 |
|   +---------------------------------------------------------+   |
|   |                       Routes                            |   |
|   |   /authRoutes  |  /appRoutes  |  /patientRoutes  | ...  |   |
|   +---------------------------------------------------------+   |
|                                |                                |
|   +---------------------------------------------------------+   |
|   |                     Middleware                          |   |
|   |   requireAuth  |  requireRole  |  MIME & Size Validation|   |
|   +---------------------------------------------------------+   |
|                                |                                |
|   +---------------------------------------------------------+   |
|   |                    Service Layer                        |   |
|   |   authService  |  patientService  |  geminiService ...  |   |
|   +---------------------------------------------------------+   |
|                                |                                |
|   +---------------------------------------------------------+   |
|   |                     Prisma ORM                          |   |
|   +---------------------------------------------------------+   |
+-----------------------------------------------------------------+
                                |
                   Parameterized Queries (TCP)
                                |
+-----------------------------------------------------------------+
|                      PostgreSQL Database                        |
|                   (User and Patient Tables)                     |
+-----------------------------------------------------------------+
```

### Telemedicine Signaling vs. Media Flow

```
+------------------+                             +--------------------+
|  Doctor Browser  |                             |  Patient Browser   |
+------------------+                             +--------------------+
        |                                                  |
        |  1. join-room (Socket.IO)                        |  1. join-room (Socket.IO)
        |------------------------+        +----------------|
        |                        |        |                |
        |                        v        v                |
        |             +-----------------------+            |
        |             |  CareOn Node Server   |            |
        |             |  (Socket.IO Gateway)  |            |
        |             +-----------------------+            |
        |                        |                         |
        |  2. WebRTC Offer (SDP) |                         |
        |----------------------->|------------------------>|
        |                        |                         |
        |                        |  3. WebRTC Answer (SDP) |
        |<-----------------------|<------------------------|
        |                        |                         |
        |  4. ICE Candidates     |  4. ICE Candidates      |
        |<---------------------->|<----------------------->|
        |                                                  |
        |                                                  |
        |========= 5. Direct Peer-to-Peer WebRTC ==========|
        |      (Encrypted Audio & Video Media Stream)      |
        |<================================================>|
```

> **Note:** Audio and video media packets do not transit through the Node.js / Socket.IO server. Socket.IO is solely used for exchanging session descriptions and ICE network candidates.

---

## 🗃️ Database ER Diagram

The PostgreSQL database is managed with Prisma. The current schema contains two independent tables; there are no foreign-key relationships between `User` and `Patient`.

```mermaid
erDiagram
    User {
        TEXT id PK
        TEXT name
        TEXT email UK
        TEXT passwordHash
        UserRole role
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }

    Patient {
        TEXT id PK
        TEXT patientId UK
        TEXT firstName
        TEXT lastName
        TIMESTAMP dateOfBirth
        TEXT gender
        TEXT phone
        TEXT email
        TEXT address
        TEXT bloodGroup
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }
```

- `UserRole` is an enum with `PATIENT`, `DOCTOR`, and `ADMIN`; `User.role` defaults to `PATIENT`.
- `Patient.dateOfBirth`, `gender`, `email`, `address`, and `bloodGroup` are optional.
- Appointment and telemedicine session data are not currently stored in these database tables.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|---|---|---|
| **Backend** | [Node.js](https://nodejs.org/) (v18+) | JavaScript runtime environment |
| | [Express.js](https://expressjs.com/) (v5.1.0) | HTTP web and API application framework |
| | [HTTP](https://nodejs.org/api/http.html) | Native Node.js HTTP server wrapper |
| **Frontend** | [EJS](https://ejs.co/) (v3.1.10) | Embedded JavaScript server-side templating |
| | [express-ejs-layouts](https://www.npmjs.com/package/express-ejs-layouts) | Boilerplate layout management |
| | Vanilla JavaScript | Client-side UI behavior and WebRTC orchestration |
| | Tailwind CSS (CDN) & Vanilla CSS | Modern responsive styling |
| | FontAwesome (CDN) | Interface iconography |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) | Relational database storage |
| | [Prisma](https://www.prisma.io/) (v7.10.0) | Schema management, client generator, migrations |
| | `@prisma/adapter-pg` & `pg` | PostgreSQL database drivers |
| **Authentication & Security** | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | JWT token creation and verification |
| | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing (12 salt rounds) |
| | [cookie-parser](https://github.com/expressjs/cookie-parser) | HTTP cookie parsing |
| | [express-validator](https://express-validator.github.io/) | Request payload validation rules |
| | [multer](https://github.com/expressjs/multer) | In-memory multipart/form-data upload handler |
| **Artificial Intelligence** | [@google/genai](https://www.npmjs.com/package/@google/genai) | Official Google GenAI SDK |
| | Gemini 3.6 Flash (`gemini-3.6-flash`) | Multimodal image and health report analysis |
| **Real-Time Communication**| [Socket.IO](https://socket.io/) (v4.8.3) | Signaling server and client events |
| | WebRTC API (`RTCPeerConnection`) | Peer-to-peer audio and video transmission |
| | Google STUN (`stun:stun.l.google.com:19302`) | Session Traversal Utilities for NAT |
| **Testing** | [Jest](https://jestjs.io/) (v29.7.0) | Automated testing framework |
| | [Supertest](https://github.com/ladjs/supertest) | HTTP assertion library |
| **Development** | [dotenv](https://github.com/motdotla/dotenv) | Environment configuration loader |

---

## 📁 Project Structure

*(Selected Project Structure)*

```
CareOn/
├── lib/
│   └── prisma.js                # Singleton Prisma Client instance
├── middleware/
│   ├── authMiddleware.js        # requireAuth, requireRole, API vs web redirect logic
│   └── validation.js            # express-validator request verification middleware
├── prisma/
│   ├── migrations/              # Database schema migration history
│   └── schema.prisma            # Data models (User, Patient, UserRole enum)
├── public/
│   ├── css/
│   │   └── style.css            # Custom CSS rules and layout refinements
│   └── js/
│       ├── dashboard.js         # Dashboard UI interactions
│       ├── health-analysis.js   # Client-side AI analysis form handling
│       ├── medicine.js          # Medicine section interactions
│       ├── patients.js          # Patient directory & modal interactions
│       ├── script.js            # Global UI scripts
│       ├── telemedicine.js      # WebRTC signaling, media handling, appointments
│       └── translate.js         # Interface localization script
├── routes/
│   ├── appRoutes.js             # Core pages (home, dashboard, telemedicine, AI)
│   ├── authRoutes.js            # Login, registration, and logout endpoints
│   ├── dashboardRoutes.js       # Dashboard metrics API (/api/dashboard/stats)
│   └── patientRoutes.js         # Patient CRUD endpoints (/api/patients)
├── services/
│   ├── authService.js           # User registration, bcrypt verification, JWT generation
│   ├── dashboardService.js      # Dashboard aggregation queries
│   ├── geminiService.js         # Multimodal Gemini 3.6 Flash prompt execution
│   └── patientService.js        # Prisma queries for patient management
├── tests/
│   ├── appRoutes.test.js        # Tests for views, auth redirects, and AI analysis
│   ├── dashboardRoutes.test.js  # Tests for dashboard auth & role authorization
│   └── patientRoutes.test.js    # Tests for patient CRUD & validation
├── validators/
│   └── patientValidator.js      # Validation rules for patient data
├── views/
│   ├── auth/                    # Login and Registration views
│   ├── errors/                  # HTTP 403 Forbidden error view
│   ├── includes/                # Navbar and footer partials
│   ├── layout/                  # Boilerplate HTML shell
│   ├── ai-assistant.ejs         # AI health assistant interface
│   ├── dashboard.ejs            # Healthcare dashboard view
│   ├── home.ejs                 # Landing page
│   ├── medicine.ejs             # Medicine & community health directory
│   ├── patients.ejs             # Patient records view
│   ├── telemedicine.ejs         # Video call interface & appointment cards
│   └── [prototypes]             # Prototype templates (generator, revision, doubt, etc.)
├── .env.example                 # Template for required environment variables
├── package.json                 # Project dependencies, scripts, and metadata
└── server.js                    # Application entry point, HTTP + Socket.IO server
```

---

## 🔑 Authentication Flow

```
+-------------------------------------------------------------+
|                      Authentication                         |
|                 "Who is this user?"                         |
+-------------------------------------------------------------+
                               |
  1. POST /login with email & password
  2. authService looks up User by email in PostgreSQL
  3. bcrypt verifies password against stored passwordHash
  4. Server signs JWT { userId, role } with JWT_SECRET
  5. Server sends HTTP-only cookie: careon_token
                               |
                               v
+-------------------------------------------------------------+
|                       Authorization                         |
|             "What is this user allowed to do?"              |
+-------------------------------------------------------------+
                               |
  1. Incoming Request with cookie: careon_token
  2. requireAuth verifies JWT and fetches User from database
     - If missing/invalid token:
       * /api/*   --> 401 Unauthorized JSON
       * web page --> 302 Redirect to /login
  3. requireRole("DOCTOR", "ADMIN") verifies user.role (where required)
     - If role is not allowed:
       * /api/*   --> 403 Forbidden JSON
       * web page --> 403 Forbidden (views/errors/403.ejs)
  4. next() passes control to Route Controller
```

---

## 🛡️ Role-Based Access Control

The platform defines three user roles in `prisma/schema.prisma`:
- `PATIENT`: Registered patient exploring AI health education and participating in telemedicine calls.
- `DOCTOR`: Healthcare professional managing patient records, conducting calls, and viewing statistics.
- `ADMIN`: Platform administrator with full access to patient records, dashboards, and management endpoints.

### Access Permissions Matrix

| Route / Resource | Method | Authorization Guard | Unauthenticated Behavior | Unauthorized Role Behavior |
|---|---|---|---|---|
| `/` | `GET` | Public | Allowed (200) | Allowed (200) |
| `/login`, `/register` | `GET`, `POST` | Public | Allowed | Allowed |
| `/dashboard` | `GET` | `requireAuth` (All Roles) | Redirect to `/login` | N/A (Accessible to all authenticated users) |
| `/medicine` | `GET` | `requireAuth` (All Roles) | Redirect to `/login` | N/A (Accessible to all authenticated users) |
| `/ai-assistant` | `GET` | `requireAuth`, `requireRole("PATIENT", "DOCTOR")` | Redirect to `/login` | 403 Forbidden |
| `/analyze-health-image` | `POST` | `requireAuth`, `requireRole("PATIENT", "DOCTOR")` | 401 Unauthorized JSON | 403 Forbidden JSON |
| `/telemedicine` | `GET` | `requireAuth`, `requireRole("PATIENT", "DOCTOR")` | Redirect to `/login` | 403 Forbidden |
| `/patients` (UI) | `GET` | `requireAuth`, `requireRole("DOCTOR", "ADMIN")` | Redirect to `/login` | 403 Forbidden |
| `/api/patients` | `GET`, `POST` | `requireAuth`, `requireRole("DOCTOR", "ADMIN")` | 401 Unauthorized JSON | 403 Forbidden JSON |
| `/api/patients/:id` | `GET`, `PUT`, `DELETE`| `requireAuth`, `requireRole("DOCTOR", "ADMIN")` | 401 Unauthorized JSON | 403 Forbidden JSON |
| `/api/dashboard/stats` | `GET` | `requireAuth`, `requireRole("DOCTOR", "ADMIN")` | 401 Unauthorized JSON | 403 Forbidden JSON |

---

## 🤖 AI Health Analysis Flow

```
[ User uploads image (Report or Skin) ]
                    |
                    v
    POST /analyze-health-image
                    |
                    v
[ Multer Validation (MIME check: jpg/png/webp, max 5MB) ]
                    |
                    v
[ requireAuth & requireRole("PATIENT", "DOCTOR") ]
                    |
                    v
[ geminiService.analyzeHealthImage ]
  - Converts buffer to base64
  - Formulates system prompt with non-diagnostic constraints
  - Calls Gemini API (model: gemini-3.6-flash)
                    |
                    v
[ Gemini AI Model Execution ]
  - Extracts visible observations & lab values
  - Explains concepts in accessible educational language
  - Explicitly states: "No definitive diagnosis or prescription"
                    |
                    v
[ JSON Response returned to browser & rendered in UI ]
```

---

## 📹 WebRTC Video Calling

### Implementation Details
- **Signaling Server**: Built into `server.js` using Socket.IO mounted on the Node.js `http.Server`.
- **Room Identification**: Follows `/telemedicine?room=appointment-${patientId}` format.
- **Signaling Events**:
  - `join-room`: Client sends room identifier upon joining.
  - `user-joined`: Broadcasted by the server to inform existing members of a newcomer.
  - `offer`: Offerer sends SDP offer via Socket.IO to the room.
  - `answer`: Answerer sends SDP answer via Socket.IO to the room.
  - `ice-candidate`: ICE candidates exchanged as discovered.
  - `disconnect`: Cleans up peer connection and updates UI.

### Engineering Challenge: Asynchronous Race Condition Handling

During development, an asynchronous timing race condition was identified:
1. When Browser 2 joins the room, Browser 1 immediately emits a WebRTC offer.
2. If Browser 2 receives the offer while `navigator.mediaDevices.getUserMedia()` is still resolving, earlier naive implementations dropped the offer.
3. Similarly, remote ICE candidates frequently arrived before `peerConnection.setRemoteDescription()` completed, triggering `InvalidStateError`.

#### Solution Implemented in `public/js/telemedicine.js`:
- **Deferred Offer Queueing (`pendingOffer`)**: If an offer arrives while `!localStream`, it is stored in `pendingOffer` and automatically processed as soon as `getUserMedia()` resolves.
- **ICE Candidate Queueing (`iceCandidateQueue`)**: Candidates arriving before `peerConnection` exists or before `remoteDescription` is set are pushed to an array and sequentially drained via `processQueuedCandidates()` immediately after `setRemoteDescription()` succeeds.
- **Single Connection Reuse**: Guaranteed that only one `RTCPeerConnection` instance is active per session, preventing duplicate offers or orphaned connections.

---

## 🧪 Testing

The repository includes automated integration tests using **Jest** and **Supertest** covering routes, services, authentication, and validation.

```bash
npm test
```

### Current Test Suite Status
- **Test Suites**: 3 passed, 3 total
- **Tests**: 40 passed, 40 total

### Test Coverage Breakdown
1. **`tests/patientRoutes.test.js`**:
   - Unauthorized requests to `/api/patients` return 401.
   - `PATIENT` role requests return 403 Forbidden.
   - `DOCTOR` and `ADMIN` requests are allowed.
   - Input validation catches malformed Patient IDs, missing names, and invalid phone numbers.
   - CRUD behavior verified for create, get, update, and delete.
2. **`tests/dashboardRoutes.test.js`**:
   - Unauthenticated requests to `/api/dashboard/stats` return 401.
   - Patients receive 403 Forbidden; Doctors and Admins receive 200 with statistics.
3. **`tests/appRoutes.test.js`**:
   - Public vs. protected web routes.
   - Unauthenticated access redirects to `/login`.
   - MIME type validation and file size limits for health image upload.
   - Mocked Gemini AI response handling.

---

## ⚙️ Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or higher)
- [PostgreSQL](https://www.postgresql.org/) (local instance or hosted URL)
- [Google Gemini API Key](https://aistudio.google.com/)

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Vivekamrutkar699/CareOn-Rural-Healthcare.git
   cd CareOn-Rural-Healthcare
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the `.env.example` template to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in the required values:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://username:password@localhost:5432/careon_db?schema=public"
   JWT_SECRET="your-secure-random-secret-key"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Initialize Database Migrations**:
   Run the Prisma migration tool to generate tables:
   ```bash
   npx prisma migrate dev
   ```
   Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```

5. **Start the Application**:
   - For development mode with live watch:
     ```bash
     npm run dev
     ```
   - For standard production run:
     ```bash
     npm start
     ```

6. **Access the Application**:
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

---

## 🔒 Security Considerations

- **Secrets Isolation**: All credentials, database connection strings, Gemini API keys, and JWT secrets are stored in `.env` and excluded via `.gitignore`.
- **Password Protection**: Passwords hashed using `bcryptjs` with 12 salt rounds before storage.
- **Cookie Security**: Tokens stored in HTTP-only cookies with `SameSite: Lax` (`secure: true` in production).
- **Upload Restrictions**: Multer memory storage configured with a 5 MB ceiling and strict whitelist filtering on image MIME types (`image/jpeg`, `image/png`, `image/webp`).
- **Input Validation**: Server-side request payload validation using `express-validator` on patient endpoints.
- **SQL Injection Protection**: All database queries are executed via Prisma ORM using parameterized queries, preventing SQL injection attacks.
- **Fail-Safe Authorization**: Protected routes apply `requireAuth` first, followed by `requireRole`.

---

## 🔮 Future Improvements

- **Database-Backed Appointments**: Creating Prisma models (`Appointment`, `ConsultationRequest`) to persist appointments and request queues across sessions.
- **TURN Server Infrastructure**: Deploying a coturn server to enable WebRTC relay across strict symmetric NATs and corporate firewalls.
- **Production HTTPS / TLS**: Terminating TLS via reverse proxy (Nginx / Caddy) to ensure secure `getUserMedia` access on mobile devices in production.
- **Rate Limiting**: Implementing request throttling on authentication and Gemini AI endpoints.
- **Prescription & Diagnostic Attachments**: Attaching PDF prescriptions directly to completed consultation sessions.
- **Multi-party Calls**: Supporting community health workers (e.g., ASHA workers) joining doctor-patient consultations simultaneously.

---

## 📌 Current Project Scope

### Current Implemented Features:
- **Authentication**: User registration, password hashing (bcrypt, 12 rounds), JWT login, and HTTP-only cookie management.
- **Role-Based Access Control**: Strict access boundaries across `PATIENT`, `DOCTOR`, and `ADMIN` roles.
- **Patient Management**: Full REST CRUD APIs (`/api/patients`) with input validation and Prisma ORM persistence.
- **Dashboard Statistics API**: Secure aggregate endpoint (`/api/dashboard/stats`) querying registered patient counts.
- **Assistive AI Analysis**: Google Gemini 3.6 Flash multimodal image analysis with non-diagnostic prompting.
- **Telemedicine UI & Scheduling Prototype**: Interactive consultation card, appointment scheduling modal, relative time calculations, and call window logic in client-side state.
- **WebRTC Video Calling**: Real-time one-to-one audio and video consultations with Socket.IO signaling, STUN server configuration, and asynchronous race-condition queuing (`pendingOffer`, `iceCandidateQueue`).
- **Automated API Tests**: 40 unit and integration tests using Jest and Supertest.

### Prototype & Demo Limitations:
- **Consultation Requests**: The pending consultation queue on the telemedicine page is currently a hardcoded demo card (`PAT-001`); there is no patient-facing submission endpoint or database queue.
- **Appointment Persistence**: Appointment scheduling operates solely in-memory/DOM state; scheduled appointments are not saved in PostgreSQL and reset upon page reload.
- **Database Scope**: The Prisma schema currently defines `User` and `Patient` models; there are no `Appointment` or `ConsultationRequest` models.
- **Network Scope**: Uses public STUN for direct connections; symmetric NAT/firewall traversal requires future TURN infrastructure.

---

## 👨‍💻 Developer

**Vivek Amrutkar**<br>
B.Tech — Artificial Intelligence & Data Science

- **GitHub**: [@Vivekamrutkar699](https://github.com/Vivekamrutkar699)
- **Repository**: [CareOn-Rural-Healthcare](https://github.com/Vivekamrutkar699/CareOn-Rural-Healthcare)

---

## 📄 Disclaimer

CareOn is an academic software engineering project created for educational and demonstration purposes. Any insights, report explanations, or suggestions generated by the integrated artificial intelligence assistant are purely informational and **do not constitute medical diagnoses, prescriptions, or clinical treatments**. CareOn does not replace direct consultation with qualified healthcare professionals.
