# Collab Khata - Brand Collaboration Tracker MVP

A mobile-first web application that helps content creators and influencers manage their brand partnerships, track payments, and organize communications in one centralized platform.

## 🚀 Features

- **Brand Management**: Organize and track brand contacts and relationships
- **Collaboration Tracking**: Monitor deal progress with status workflows
- **Payment Management**: Track expected payments and record credits with partial payment support
- **Communication Logs**: Maintain records of brand communications across channels
- **File Attachments**: Upload and organize contracts, briefs, and deliverables
- **Financial Dashboard**: Overview of earnings, pending payments, and overdue amounts
- **Mobile-First Design**: Optimized for mobile devices with large touch targets

## 🏗️ Architecture

**Monorepo Structure:**
```
collab-khata/
├── apps/
│   ├── frontend/          # Next.js 14 (App Router) + TypeScript + TailwindCSS
│   └── backend/           # Python FastAPI + SQLAlchemy + PostgreSQL
├── docker-compose.yml     # PostgreSQL development database
└── package.json           # Workspace configuration
```

**Tech Stack:**
- **Frontend**: Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: FastAPI, SQLAlchemy 2.0, Alembic, JWT Auth
- **Database**: PostgreSQL
- **Development**: Docker Compose

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Docker and Docker Compose

### 1. Clone and Setup
```bash
git clone <repository-url>
cd collab-khata
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# The defaults work for local development
```

### 3. Start Database
```bash
# Start PostgreSQL with Docker
npm run db:up

# Wait for database to be ready (check with docker-compose logs postgres)
```

### 4. Setup Backend
```bash
cd apps/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI server
cd ../..
npm run dev:backend
```

### 5. Setup Frontend
```bash
cd apps/frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev

# Or from root directory
cd ../..
npm run dev:frontend
```

### 6. Run Both (Recommended)
```bash
# From root directory - runs both frontend and backend
npm run dev
```

## 📱 Usage

1. **Access the Application**: Open http://localhost:3000
2. **Register Account**: Create a new creator account
3. **Add Brands**: Set up your brand contacts
4. **Create Collaborations**: Track your brand deals and partnerships
5. **Manage Payments**: Record payment expectations and credits
6. **Monitor Dashboard**: View financial summaries and overdue payments

## 🗄️ Database Management

```bash
# Start/stop database
npm run db:up
npm run db:down

# Run migrations
npm run db:migrate

# Create new migration
npm run db:migration "description of changes"
```

## 🧪 Testing

```bash
# Backend tests
cd apps/backend
pytest

# Frontend tests
cd apps/frontend
npm test
```

## 📁 Project Structure

```
apps/
├── frontend/              # Next.js Application
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/         # Utilities and API client
│   │   └── types/       # TypeScript definitions
│   └── package.json
│
└── backend/              # FastAPI Application
    ├── app/
    │   ├── api/         # API route handlers
    │   ├── models/      # SQLAlchemy models
    │   ├── schemas/     # Pydantic schemas
    │   ├── services/    # Business logic
    │   └── core/        # Configuration and auth
    ├── alembic/         # Database migrations
    └── requirements.txt
```

## 🔧 Development Commands

```bash
# Root level commands
npm run dev              # Run both frontend and backend
npm run dev:frontend     # Run only Next.js
npm run dev:backend      # Run only FastAPI
npm run build           # Build frontend for production

# Database commands
npm run db:up           # Start PostgreSQL
npm run db:down         # Stop PostgreSQL
npm run db:migrate      # Run pending migrations
npm run db:migration    # Create new migration
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Run database migrations: `alembic upgrade head`
3. Start with production ASGI server: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `apps/frontend/.next` directory to your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL container is running: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`
- Verify connection string in `.env` file

### Port Conflicts
- Frontend (3000): Change in `apps/frontend/package.json`
- Backend (8000): Change in `.env` file and update frontend API URL
- Database (5432): Change in `docker-compose.yml` and update connection strings

### Migration Issues
- Reset database: `docker-compose down -v && docker-compose up -d postgres`
- Recreate migrations: Delete `alembic/versions/*` and run `alembic revision --autogenerate -m "initial"`