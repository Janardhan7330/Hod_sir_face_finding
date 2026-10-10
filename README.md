# Face Recognition Lab

Consent-Based Group Photo Face Recognition & Profile System - Academic Demonstration

## Overview

This is an academic demonstration system for consent-based face recognition. It allows authorized operators to:

1. **Enroll participants** with explicit consent and enrollment photographs
2. **Upload group photos** for multi-face detection and recognition
3. **View results** with bounding boxes, similarity scores, and match status
4. **Track history** of all recognition events with full audit trail

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Traefik     │────▶│  FastAPI :8000  │
│  (React)    │     │  (TLS)       │     │  (App Server)   │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                               ┌───────────────────┼───────────────────┐
                               ▼                   ▼                   ▼
                        ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                        │ PostgreSQL  │      │  ONNX RT    │      │   Redis     │
                        │ + pgvector  │      │  (CV Models)│      │ (Sessions)  │
                        └─────────────┘      └─────────────┘      └─────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0, PostgreSQL + pgvector |
| Computer Vision | InsightFace buffalo_l (SCRFD-10GF + ResNet50 ArcFace), ONNX Runtime |
| Auth | JWT RS256, Argon2id, Role-based (Admin/Operator) |
| Infrastructure | Docker Compose, Traefik (TLS), GitHub Actions |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Development

```bash
# Clone repository
git clone <repository-url>
cd face-recognition-lab

# Copy environment template
cp .env.example .env

# Start all services
make dev

# Or manually:
docker compose up -d
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (user: face_lab, pass: face_lab_dev)

### Demo Credentials
- **Email**: admin@face-lab.local
- **Password**: admin123

## Project Structure

```
face-recognition-lab/
├── docker-compose.yml          # Local development stack
├── .env.example                # Environment template
├── Makefile                    # Common commands
├── README.md                   # This file
├── ARCHITECTURE.md             # Detailed architecture
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API client & services
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utility functions
│   └── package.json
├── backend/                    # FastAPI + Python
│   ├── app/
│   │   ├── api/                # REST endpoints
│   │   ├── core/               # Config, DB, Security, Logging
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   └── cv/                 # Computer Vision pipeline
│   ├── alembic/                # Database migrations
│   ├── scripts/                # Utility scripts
│   └── pyproject.toml
├── cv/models/                  # ONNX model files (gitignored)
└── tests/                      # Test suite
```

## Key Features

### Enrollment System
- Participant registration with consent management
- Multi-image enrollment (1-5 images per person)
- Automatic face detection validation (exactly 1 face required)
- Face embedding generation and storage

### Recognition Pipeline
- Group photo upload with validation
- Multi-face detection (up to 50 faces)
- Face alignment and embedding extraction
- Vector similarity search via pgvector HNSW
- Configurable thresholds: Match (≥0.75), Review (≥0.60), Unknown (<0.60)

### Visualization
- Interactive canvas with bounding box overlay
- Color-coded results: Green=Matched, Yellow=Review, Red=Unknown
- Click-to-inspect face details with similarity scores
- Responsive design for desktop and mobile

### Security & Privacy
- JWT authentication with refresh token rotation
- Role-based access control (Admin/Operator)
- Rate limiting (100 req/min)
- Encrypted biometric embeddings at rest
- Comprehensive audit logging
- Automatic temporary file cleanup
- TLS termination via Traefik

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Current user info |
| POST | `/api/v1/people` | Create person (admin) |
| GET | `/api/v1/people` | List people with pagination |
| POST | `/api/v1/enrollment` | Enroll face images |
| POST | `/api/v1/recognition` | Recognize faces in group photo |
| GET | `/api/v1/history` | Recognition history |
| GET | `/api/v1/system/health` | Health check |
| GET | `/api/v1/system/stats` | System statistics |

## Model Licensing

**Important**: This system uses InsightFace `buffalo_l` model pack which includes:
- Detection: SCRFD-10GF
- Recognition: ResNet50 @ WebFace600K (ArcFace)

**License**: The InsightFace code is MIT licensed, but **the pre-trained models are for non-commercial research purposes only**. This academic demonstration falls under that license. For commercial deployment, a commercial license from InsightFace is required (contact `recognition-oss-pack@insightface.ai`).

## Development Commands

```bash
# Start development environment
make dev

# Run backend tests
make test-backend

# Run frontend tests
make test-frontend

# Run all tests
make test

# Lint backend
make lint

# Create database migration
make db-revision

# Apply migrations
make db-migrate

# Seed demo data
make db-seed

# View logs
make logs

# Clean up
make clean
```

## Deployment

### Production with Docker Compose

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Deploy with Traefik (auto TLS via Let's Encrypt)
docker compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

```bash
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<generate-with-openssl-rand-base64-32>
JWT_PRIVATE_KEY_PATH=/app/secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/app/secrets/jwt_public.pem
CORS_ORIGINS=["https://your-domain.com"]
```

## Testing

```bash
# Backend unit/integration tests
docker compose exec backend uv run pytest

# Frontend unit tests
docker compose exec frontend npm run test

# E2E tests (requires running services)
docker compose exec frontend npm run test:e2e
```

## Documentation

- [Architecture](ARCHITECTURE.md) - Detailed system design
- [API Specification](API_SPEC.md) - OpenAPI 3.1 specification
- [Security](SECURITY.md) - Security controls and threat model
- [Privacy](PRIVACY.md) - Privacy and consent documentation
- [Deployment](DEPLOYMENT.md) - Production deployment guide
- [Demo](DEMO.md) - College demonstration instructions

## Limitations (Academic Demo)

1. **Academic use only** — Not for production security applications
2. **Consent required** — Only recognizes explicitly enrolled individuals
3. **Single model** — Uses buffalo_l only; no ensemble
4. **No liveness detection** — Static images only
5. **Uncalibrated thresholds** — Similarity ≠ probability
6. **Max 50 faces/image** — Performance safeguard
7. **Demographic bias** — Model accuracy varies across populations

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

Academic demonstration only. Model weights subject to InsightFace non-commercial research license.

## Acknowledgments

- [InsightFace](https://github.com/deepinsight/insightface) - Face analysis toolbox
- [ONNX Runtime](https://onnxruntime.ai/) - Cross-platform inference
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search in PostgreSQL
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Accessible component library