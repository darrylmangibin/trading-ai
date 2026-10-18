.DEFAULT_GOAL := help
.NOTPARALLEL:

ifeq ($(OS),Windows_NT)
NPM ?= npm.cmd
else
NPM ?= npm
endif
NODE ?= node

.PHONY: help format format-backend format-frontend lint lint-backend lint-frontend typecheck build test docker-reset-frontend-deps docker-reset-backend-deps docker-reset-deps

help:
	@echo make format - Fix lint and format both apps
	@echo make format-backend - Fix lint and format the API
	@echo make format-frontend - Fix lint and format the web app
	@echo make lint - Check all configured lint rules
	@echo make typecheck - Check both TypeScript projects
	@echo make build - Build both apps
	@echo make test - Run currently configured tests
	@echo make docker-reset-frontend-deps - Rebuild the web image and recreate web
	@echo make docker-reset-backend-deps - Rebuild the API image and recreate api
	@echo make docker-reset-deps - Rebuild and recreate both app services

format: format-backend format-frontend

format-backend:
	$(NPM) run format:all --workspace @trading/api

format-frontend:
	$(NPM) run format:all --workspace @trading/web

lint:
	$(NPM) run lint

lint-backend:
	$(NPM) run lint --workspace @trading/api

lint-frontend:
	$(NPM) run lint --workspace @trading/web

typecheck:
	$(NPM) run typecheck

build:
	$(NPM) run build

test:
	$(NPM) test

docker-reset-frontend-deps:
	$(NODE) scripts/rebuild-docker.mjs web

docker-reset-backend-deps:
	$(NODE) scripts/rebuild-docker.mjs api

docker-reset-deps:
	$(NODE) scripts/rebuild-docker.mjs all
