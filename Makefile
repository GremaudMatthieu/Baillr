SHELL := /bin/bash

.PHONY: test test-front test-back test-e2e test-all \
       test-front-watch test-front-coverage test-e2e-headed test-e2e-ui \
       lint lint-front lint-back lint-dto \
       dev build

# ──────────────────────────────────────────────
# Tests unitaires
# ──────────────────────────────────────────────

test-front: ## Frontend unit tests (Vitest)
	cd frontend && npx vitest run

test-back: ## Backend unit tests (Jest)
	cd backend && npx jest

test: test-back test-front ## All unit tests (backend + frontend)

# ──────────────────────────────────────────────
# Tests E2E
# ──────────────────────────────────────────────

test-e2e: ## Frontend E2E tests (Playwright)
	cd frontend && npx playwright test

test-e2e-headed: ## E2E tests with browser visible
	cd frontend && npx playwright test --headed

test-e2e-ui: ## E2E tests with Playwright UI
	cd frontend && npx playwright test --ui

test-e2e-report: ## Show last E2E report
	cd frontend && npx playwright show-report

# ──────────────────────────────────────────────
# Tout
# ──────────────────────────────────────────────

test-all: test test-e2e ## All tests (unit + E2E)

# ──────────────────────────────────────────────
# Watch & Coverage
# ──────────────────────────────────────────────

test-front-watch: ## Frontend tests in watch mode
	cd frontend && npx vitest

test-back-watch: ## Backend tests in watch mode
	cd backend && npx jest --watch

test-front-coverage: ## Frontend tests with coverage
	cd frontend && npx vitest run --coverage

test-back-coverage: ## Backend tests with coverage
	cd backend && npx jest --coverage

# ──────────────────────────────────────────────
# Lint
# ──────────────────────────────────────────────

lint-front: ## Lint frontend
	cd frontend && npx eslint

lint-back: ## Lint backend
	cd backend && npx eslint "{src,apps,libs,test}/**/*.ts" --fix

lint-dto: ## Check DTO imports
	cd backend && bash ../scripts/check-dto-imports.sh src

lint: lint-front lint-back ## Lint all

# ──────────────────────────────────────────────
# Dev & Build
# ──────────────────────────────────────────────

dev: ## Start both servers (backend + frontend)
	@echo "Starting backend on :3001 and frontend on :3000..."
	@cd backend && npm run start:dev &
	@cd frontend && npm run dev

build: ## Build both projects
	cd backend && npm run build
	cd frontend && npm run build

# ──────────────────────────────────────────────
# Help
# ──────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
