# Calendar Booking System

A comprehensive calendar booking and appointment scheduling system with skill-based provider matching, multi-tenant support, and advanced search capabilities.

## Overview

This project implements a quality-driven calendar booking system following a 13-week development roadmap. The system supports:

- Multi-tenant architecture with role-based access control
- Skill-based provider matching and availability search
- Calendar management with timezone support
- Appointment booking with conflict detection
- Group management and bulk operations
- Redis caching for performance optimization
- MCP (Model Context Protocol) server integration
- Notification system (email/SMS/Slack)

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15 with connection pooling
- **Cache**: Redis 7
- **Authentication**: JWT with bcrypt password hashing
- **Testing**: Jest with Supertest

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Calendar UI**: FullCalendar
- **HTTP Client**: Axios
- **Testing**: Vitest with React Testing Library

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Kubernetes-ready (manifests in Phase 4)

## Project Structure

```
calender-booking-system/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── models/            # Data models
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Utility functions
│   │   └── config/            # Configuration files
│   ├── tests/
│   │   ├── unit/              # Unit tests
│   │   ├── integration/       # Integration tests
│   │   └── e2e/               # End-to-end tests
│   └── Dockerfile
├── frontend/                   # Frontend React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API services
│   │   └── utils/             # Utility functions
│   └── Dockerfile
├── infrastructure/             # Infrastructure as code
│   ├── docker/                # Docker configurations
│   └── kubernetes/            # Kubernetes manifests (Phase 4)
├── docs/                       # Documentation
├── docker-compose.yml         # Docker Compose configuration
├── roadmap.md                 # Development roadmap
└── README.md                  # This file
```

## Getting Started

### Prerequisites

- Docker and Docker Compose (recommended)
- Node.js 18+ and npm 9+ (for local development)
- PostgreSQL 15+ (if running without Docker)
- Redis 7+ (if running without Docker)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   cd /path/to/calender-booking-system
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update configuration values (especially secrets for production).

3. **Start all services**
   ```bash
   docker-compose up
   ```

4. **Access the applications**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Health Check: http://localhost:3000/health

### Local Development Setup

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

#### Backend Tests
```bash
cd backend
npm test                  # Run all tests with coverage
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:e2e         # Run end-to-end tests only
npm run test:watch       # Run tests in watch mode
```

#### Frontend Tests
```bash
cd frontend
npm test                 # Run tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage
```

### Linting and Formatting

```bash
# Backend
cd backend
npm run lint            # Check for linting errors
npm run lint:fix        # Fix linting errors
npm run format          # Format code with Prettier

# Frontend
cd frontend
npm run lint            # Check for linting errors
npm run lint:fix        # Fix linting errors
npm run format          # Format code with Prettier
```

## Development Roadmap

This project follows a structured 13-week development plan:

- **Phase 0 (Week 1)**: Setup and Foundations - Infrastructure, tooling, quality gates
- **Phase 1 (Weeks 2-5)**: MVP & Core Data - Authentication, data models, availability search
- **Phase 2 (Weeks 6-9)**: RBAC, Advanced Search & Regression Suite
- **Phase 3 (Weeks 10-12)**: Integration, Performance & Optimization (caching, MCP server)
- **Phase 4 (Weeks 13-14)**: Final QA, Documentation & Deployment

See [roadmap.md](./roadmap.md) for detailed phase breakdown.

## Current Status

✅ **Phase 0 - Complete**: Basic project structure established

- Git repository initialized
- Project directory structure created
- Docker environment configured with PostgreSQL, Redis, and test instances
- Environment configuration files created
- Backend project initialized with Express.js
- Frontend project initialized with React + Vite
- Basic CI/CD pipeline structure ready

**Next Steps**: Phase 1 - Implement authentication system and core data models

## API Documentation

API documentation will be available at `/api/docs` once the application is running (Phase 1+).

## Environment Variables

Key environment variables (see `.env.example` for complete list):

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `BCRYPT_SALT_ROUNDS`: Number of salt rounds for password hashing (default: 12)
- `REACT_APP_API_URL`: Frontend API endpoint

## Contributing

This is a structured development project following the roadmap. Each phase includes:
- Development tasks with clear acceptance criteria
- Corresponding validation and QA tasks
- Regression test suite to prevent regressions

## License

MIT

## Support

For issues and questions, please refer to the roadmap documentation or create an issue in the repository.
