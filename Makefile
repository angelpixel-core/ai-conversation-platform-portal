.PHONY: help install dev build start test test-watch clean stack/up stack/down stack/status stack/build

PORT ?= 3000
BACKEND_PORT ?= 8000

help:
	@echo "========================================================================"
	@echo "  AI Conversation Platform - Web Portal (${PORT})"
	@echo "========================================================================"
	@echo "  make install         Instalar dependencias de Node.js (npm ci/install)"
	@echo "  make dev             Iniciar servidor de desarrollo en primer plano"
	@echo "  make build           Compilar aplicación para producción (next build)"
	@echo "  make test            Ejecutar suite de pruebas unitarias (Vitest)"
	@echo "  make test-watch      Ejecutar pruebas en modo interactivo"
	@echo "  make clean           Limpiar artefactos de build (.next, cachés)"
	@echo "------------------------------------------------------------------------"
	@echo "  make stack/up        Iniciar servidor del portal en background (:3000)"
	@echo "  make stack/down      Detener el servidor del portal (:3000)"
	@echo "  make stack/status    Verificar conectividad del portal y backend"
	@echo "  make stack/build     Compilar la aplicación para producción"
	@echo "========================================================================"

# Instalar dependencias del proyecto
install:
	@npm install

# Iniciar servidor de desarrollo en primer plano
dev:
	@npm run dev

# Compilar para producción
build:
	@npm run build

# Iniciar bundle de producción
start:
	@npm run start

# Ejecutar tests unitarios y de integración
test:
	@npm test

# Ejecutar tests en modo watch
test-watch:
	@npm run test:watch

# Limpiar directorios temporales y build
clean:
	@rm -rf .next node_modules/.cache out coverage

# ------------------------------------------------------------------------------
# Interfaz Stack (Compatibilidad con el ecosistema de Makefiles)
# ------------------------------------------------------------------------------

# Levantar portal en segundo plano (daemon) si no está ya corriendo
stack/up:
	@if lsof -ti :$(PORT) > /dev/null 2>&1; then \
		echo "==> Portal ya está en ejecución en http://localhost:$(PORT)"; \
	else \
		echo "==> Iniciando Portal Web en http://localhost:$(PORT)..."; \
		nohup npm run dev > .next-dev.log 2>&1 & \
		PID=$$!; \
		echo $$PID > .next-dev.pid; \
		echo "==> Aguardando a que Next.js responda..."; \
		until curl -s -o /dev/null -w "%{http_code}" http://localhost:$(PORT) | grep -q "200\|304"; do \
			sleep 1; \
		done; \
		echo "==> Portal listo en http://localhost:$(PORT) (PID: $$PID)"; \
	fi

# Detener el servidor del portal liberando el puerto 3000
stack/down:
	@echo "==> Deteniendo servidor del portal en puerto $(PORT)..."
	@if [ -f .next-dev.pid ]; then \
		PID=$$(cat .next-dev.pid); \
		kill $$PID 2>/dev/null || true; \
		rm -f .next-dev.pid; \
	fi
	@lsof -ti :$(PORT) | xargs kill -9 2>/dev/null || true
	@echo "==> Portal detenido."

# Compilar el stack del portal
stack/build: build

# Verificar estado del stack (portal y backend FastAPI)
stack/status:
	@echo "=========================================="
	@echo "  Estado del Stack Portal & Backend"
	@echo "=========================================="
	@printf "  Portal Web (:$(PORT)):      "
	@if curl -s -o /dev/null -w "%{http_code}" http://localhost:$(PORT) | grep -q "200\|304"; then \
		echo "[ ONLINE (HTTP 200) ]"; \
	else \
		echo "[ OFFLINE ]"; \
	fi
	@printf "  Backend FastAPI (:$(BACKEND_PORT)): "
	@if curl -s -o /dev/null -w "%{http_code}" http://localhost:$(BACKEND_PORT)/health | grep -q "200"; then \
		echo "[ ONLINE (HTTP 200) ]"; \
	else \
		echo "[ OFFLINE / CONNECTION REFUSED ]"; \
	fi
	@echo "=========================================="
