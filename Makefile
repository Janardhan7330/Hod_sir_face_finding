.PHONY: dev up down build test lint clean logs db-migrate db-seed db-revision gen-api

# Development
dev:
	docker compose up -d
	@echo "Frontend: http://localhost:5173"
	@echo "Backend API: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

up:
	docker compose up -d

down:
	docker compose down -v

build:
	docker compose build

# Backend commands
backend-shell:
	docker compose exec backend bash

db-migrate:
	docker compose exec backend uv run alembic upgrade head

db-revision:
	@read -p "Migration message: " msg; \
	docker compose exec backend uv run alembic revision --autogenerate -m "$$msg"

db-seed:
	docker compose exec backend uv run python scripts/init_db.py

# Testing
test:
	docker compose exec backend uv run pytest
	docker compose exec frontend npm run test

test-backend:
	docker compose exec backend uv run pytest -v

test-frontend:
	docker compose exec frontend npm run test

# Linting
lint:
	docker compose exec backend uv run ruff check .
	docker compose exec backend uv run mypy app
	docker compose exec frontend npm run lint

lint-fix:
	docker compose exec backend uv run ruff check . --fix
	docker compose exec frontend npm run lint -- --fix

# Logs
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

# Clean
clean:
	docker compose down -v --rmi all
	rm -rf frontend/node_modules backend/.venv

# Generate API types
gen-api:
	docker compose exec frontend npm run gen:api