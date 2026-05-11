# ARCHITEKTURPLAN — Medusa.js Multi-Shop Hosting Infrastructure

**Docker · Portainer · Cloudflare Tunnel · Monitoring · Auto-Healing**

| | |
|---|---|
| **Erstellt für:** | Vision X Digital |
| **Datum:** | 13. Februar 2026 |
| **Version:** | 1.0 |

---

## Inhaltsverzeichnis

1. [Executive Summary](#1-executive-summary)
2. [Architekturübersicht](#2-architekturübersicht)
3. [Medusa.js Shop Template](#3-medusajs-shop-template)
4. [Automatisiertes Deploy-Script](#4-automatisiertes-deploy-script)
5. [Monitoring & Alerting](#5-monitoring--alerting)
6. [Auto-Healing mit Claude Code](#6-auto-healing-mit-claude-code)
7. [Backup & Disaster Recovery](#7-backup--disaster-recovery)
8. [Skalierungsstrategie](#8-skalierungsstrategie)
9. [Implementierungs-Roadmap](#9-implementierungs-roadmap)
10. [Nächste Schritte](#10-nächste-schritte)

---

## 1. Executive Summary

Dieses Dokument beschreibt die Architektur und den Implementierungsplan für eine skalierbare Multi-Shop-Hosting-Infrastruktur basierend auf Medusa.js. Das Ziel ist es, die wiederkehrenden Herausforderungen bei der Bereitstellung neuer Webshop-Instanzen zu lösen und eine zuverlässige, selbstheilende Plattform aufzubauen.

### Aktuelle Herausforderungen

- **Zeitaufwendiges Deployment:** Jeder neue Medusa.js Shop erfordert manuelle Konfiguration von Backend, Storefront, Datenbank, Redis und Tunnel-Routing. Dies dauert typischerweise mehrere Stunden.
- **Fehleranfälligkeit:** Manuelle Schritte führen zu Konfigurationsfehlern, vergessenen Environment-Variablen und inkonsistenten Setups zwischen verschiedenen Shop-Instanzen.
- **Keine proaktive Überwachung:** Probleme werden oft erst bemerkt, wenn Kunden sich melden. Es fehlt ein automatisiertes Monitoring mit Alerting.
- **Manuelle Fehlerbehebung:** Jeder Incident erfordert manuelles Eingreifen – SSH-Zugang, Log-Analyse, Container-Restart.

### Zielbild

| Bereich | Ist-Zustand | Soll-Zustand |
|---|---|---|
| **Neuer Shop** | 2–4 Stunden manuelles Setup | 15 Min. via Deploy-Script |
| **Konfiguration** | Copy & Paste, fehleranfällig | Template mit Validierung |
| **Monitoring** | Keins – reaktiv | Prometheus + Grafana + E-Mail-Alerts |
| **Fehlerbehebung** | Manuell via SSH | Automatisch via Claude Code |
| **Skalierung** | Aufwändig, nicht standardisiert | Horizontal, standardisierte Stacks |

---

## 2. Architekturübersicht

Die Infrastruktur besteht aus vier Schichten, die auf einem oder mehreren Hetzner Cloud Servern laufen. Alle Services sind containerisiert und werden über Portainer verwaltet.

### 2.1 Schichtenmodell

| Schicht | Komponenten | Beschreibung |
|---|---|---|
| **1. Edge / Routing** | Cloudflare Tunnel | Zero-Trust Zugang ohne offene Ports. Cloudflare Tunnel routet Traffic direkt zu den internen Containern. DNS wird über Cloudflare verwaltet. |
| **2. Application** | Medusa.js + Next.js Storefront | Pro Shop eine isolierte Medusa-Backend-Instanz mit eigenem Next.js Starter Storefront. Jeder Shop hat eigene DB und Redis. |
| **3. Infrastructure** | PostgreSQL, Redis, Portainer | Shared Infrastructure Services. PostgreSQL und Redis können shared oder per-shop isoliert betrieben werden. |
| **4. Monitoring & Ops** | Prometheus, Grafana, Alertmanager, Claude Code Agent | Zentrale Überwachung aller Shops mit automatischer Fehlererkennung und -behebung. |

### 2.2 Netzwerk-Topologie

Alle Container kommunizieren über definierte Docker-Netzwerke. Es gibt keine offenen Ports nach außen – der gesamte eingehende Traffic läuft über den Cloudflare Tunnel.

| Netzwerk | Typ | Zweck |
|---|---|---|
| **proxy** | Extern (`docker network create`) | Verbindet Cloudflare Tunnel mit allen öffentlich erreichbaren Services |
| **shop-{name}-internal** | Stack-intern, isoliert | Verbindet Medusa Backend mit zugehöriger DB und Redis. Kein Internet-Zugang. |
| **monitoring** | Intern | Prometheus-Zugriff auf alle Metriken-Endpunkte |

### 2.3 Architektur-Diagramm

```
Internet → Cloudflare CDN → Cloudflare Tunnel → Docker proxy-Network
                                                    ├── Shop A: Medusa + Next.js + PG + Redis
                                                    ├── Shop B: Medusa + Next.js + PG + Redis
                                                    ├── Shop C: Medusa + Next.js + PG + Redis
                                                    ├── Portainer (Management)
                                                    └── Grafana (Monitoring)
```

---

## 3. Medusa.js Shop Template

Herzstück der Lösung ist ein parametrisiertes Docker-Compose-Template, das einen kompletten Medusa-Shop in wenigen Minuten deployt.

### 3.1 Template-Architektur pro Shop

Jeder Shop ist ein eigenständiger Portainer Stack mit folgenden Services:

| Service | Image | Port (intern) | Funktion |
|---|---|---|---|
| **medusa-backend** | Custom Build (Dockerfile) | 9000 | Medusa.js Backend API + Admin Dashboard |
| **storefront** | Custom Build (Next.js) | 8000 | Next.js Starter Storefront |
| **postgres** | postgres:16-alpine | 5432 | Datenbank für Medusa |
| **redis** | redis:7-alpine | 6379 | Cache, Sessions, Event-Queue |

### 3.2 Docker Compose Template

Das Template nutzt Variablen für Shop-Name, Domain und Credentials. Alle Werte werden über eine `.env`-Datei injiziert, die beim Deployment automatisch generiert wird.

**Wichtige Design-Entscheidungen:**

- **Isolierte Netzwerke pro Shop:** Jeder Shop hat sein eigenes internes Netzwerk. Nur Medusa-Backend und Storefront sind am proxy-Netzwerk angeschlossen.
- **Named Volumes:** Alle persistenten Daten nutzen Named Volumes mit dem Shop-Präfix für einfaches Backup und Migration.
- **Health Checks mit `service_healthy`:** Das Backend startet erst, wenn PostgreSQL und Redis healthy sind. Der Storefront startet erst, wenn das Backend healthy ist.
- **Resource Limits:** Jeder Service hat CPU- und Memory-Limits, um gegenseitige Beeinflussung bei 4–10 Shops auf einem Server zu verhindern.
- **Explizite Image-Versionen:** Keine `:latest` Tags. Medusa, Node, PostgreSQL und Redis mit festen Versionen für reproduzierbare Deployments.

```yaml
name: shop-${SHOP_NAME}

services:
  medusa:
    build:
      context: ./medusa
      dockerfile: Dockerfile
    container_name: ${SHOP_NAME}-medusa
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - TZ=Europe/Berlin
      - DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${SHOP_NAME}-postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@${SHOP_NAME}-redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - COOKIE_SECRET=${COOKIE_SECRET}
      - STORE_CORS=https://${SHOP_DOMAIN}
      - ADMIN_CORS=https://${ADMIN_DOMAIN}
      - AUTH_CORS=https://${ADMIN_DOMAIN}
    volumes:
      - ${SHOP_NAME}_medusa_data:/app/uploads
    networks:
      - proxy
      - internal
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  storefront:
    build:
      context: ./storefront
      dockerfile: Dockerfile
    container_name: ${SHOP_NAME}-storefront
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://${SHOP_NAME}-medusa:9000
      - NEXT_PUBLIC_BASE_URL=https://${SHOP_DOMAIN}
    networks:
      - proxy
      - internal
    depends_on:
      medusa:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 45s
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    image: postgres:16-alpine
    container_name: ${SHOP_NAME}-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - TZ=Europe/Berlin
    volumes:
      - ${SHOP_NAME}_postgres_data:/var/lib/postgresql/data
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.1'
          memory: 128M

  redis:
    image: redis:7-alpine
    container_name: ${SHOP_NAME}-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - ${SHOP_NAME}_redis_data:/data
    networks:
      - internal
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
        reservations:
          cpus: '0.05'
          memory: 64M

networks:
  proxy:
    external: true
  internal:
    driver: bridge
    internal: true

volumes:
  ${SHOP_NAME}_medusa_data:
  ${SHOP_NAME}_postgres_data:
  ${SHOP_NAME}_redis_data:
```

### 3.3 .env Template

Für jeden neuen Shop wird eine `.env`-Datei aus dem Template generiert. Sensitive Werte (Passwörter, Keys) werden automatisch per `openssl rand` generiert.

| Variable | Beispielwert | Beschreibung |
|---|---|---|
| `SHOP_NAME` | mein-shop | Eindeutiger Shop-Identifier (alphanumerisch, lowercase) |
| `SHOP_DOMAIN` | shop.example.com | Domain für den Storefront |
| `ADMIN_DOMAIN` | admin.shop.example.com | Domain für Medusa Admin Dashboard |
| `POSTGRES_USER` | medusa | PostgreSQL-Benutzer |
| `POSTGRES_DB` | medusa_db | PostgreSQL-Datenbank |
| `POSTGRES_PASSWORD` | [auto-generiert] | 32-Zeichen alphanumerisch |
| `REDIS_PASSWORD` | [auto-generiert] | 32-Zeichen alphanumerisch |
| `JWT_SECRET` | [auto-generiert] | Medusa JWT Signing Secret |
| `COOKIE_SECRET` | [auto-generiert] | Medusa Cookie Signing Secret |
| `MEDUSA_ADMIN_EMAIL` | admin@example.com | Erster Admin-Benutzer |

### 3.4 Cloudflare Tunnel Routing

Für jeden neuen Shop werden zwei Ingress-Rules im Cloudflare Tunnel konfiguriert: eine für den Storefront und eine für das Admin-Backend. Dies kann über das Cloudflare Dashboard (Zero Trust → Tunnels → Public Hostname) oder per `cloudflared` CLI erfolgen.

| Hostname | Service (intern) | Beschreibung |
|---|---|---|
| **shop.example.com** | `http://shop-name-storefront:8000` | Storefront |
| **admin.shop.example.com** | `http://shop-name-medusa:9000` | Admin + API |

---

## 4. Automatisiertes Deploy-Script

Ein Bash-Script automatisiert den gesamten Deployment-Prozess eines neuen Shops. Das Script wird auf dem Hetzner-Server ausgeführt und erledigt alles von der `.env`-Generierung bis zum Cloudflare-Tunnel-Routing.

### 4.1 Deployment-Ablauf

**Schritt 1 – Validierung:** Das Script prüft, ob der Shop-Name eindeutig ist, die Domain verfügbar ist und genügend Ressourcen auf dem Server vorhanden sind.

**Schritt 2 – .env Generierung:** Alle Secrets (Passwörter, JWT-Keys, Cookie-Secrets) werden per `openssl rand -hex 32` generiert und in die `.env`-Datei geschrieben.

**Schritt 3 – Verzeichnisstruktur:** Das Template wird in `/opt/shops/{shop-name}/` kopiert. Custom Configs (`medusa-config.ts`, `next.config.js`) werden angepasst.

**Schritt 4 – Stack-Deployment:** `docker compose up -d` startet alle Services. Das Script wartet, bis alle Health Checks grün sind.

**Schritt 5 – Medusa Seed:** Der erste Admin-User wird erstellt und optionale Seed-Daten (Regionen, Währungen, Versandoptionen) werden geladen.

**Schritt 6 – Cloudflare Tunnel:** Neue Public Hostnames werden über die Cloudflare API automatisch im bestehenden Tunnel registriert.

**Schritt 7 – Monitoring:** Der neue Shop wird automatisch als Prometheus Scrape-Target registriert und Grafana-Dashboard-Panels werden ergänzt.

### 4.2 Deploy-Script Struktur

```bash
#!/bin/bash
# deploy-shop.sh — Medusa.js Shop Deployment Automation
# Usage: ./deploy-shop.sh --name mein-shop --domain shop.example.com --admin-domain admin.shop.example.com

set -euo pipefail

# ── Konfiguration ───────────────────────────────────────
TEMPLATE_DIR="/opt/medusa-template"
SHOPS_DIR="/opt/shops"
CF_TUNNEL_ID="${CF_TUNNEL_ID}"
CF_ACCOUNT_ID="${CF_ACCOUNT_ID}"
CF_API_TOKEN="${CF_API_TOKEN}"

# ── Parameter parsen ────────────────────────────────────
# --name, --domain, --admin-domain, --admin-email

# ── Schritt 1: Validierung ──────────────────────────────
# - Shop-Name unique?
# - Domain DNS vorhanden?
# - Server-Ressourcen ausreichend?

# ── Schritt 2: Secrets generieren ───────────────────────
POSTGRES_PASSWORD=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)

# ── Schritt 3: Template kopieren & .env erstellen ───────
# cp -r $TEMPLATE_DIR $SHOPS_DIR/$SHOP_NAME
# envsubst < .env.template > .env

# ── Schritt 4: Stack deployen ───────────────────────────
# docker compose up -d
# Warte auf Health Checks

# ── Schritt 5: Medusa Seed ──────────────────────────────
# docker exec medusa npx medusa user -e admin@example.com -p ...

# ── Schritt 6: Cloudflare Tunnel Routing ────────────────
# curl -X PUT Cloudflare API → Public Hostname hinzufügen

# ── Schritt 7: Monitoring registrieren ──────────────────
# Prometheus scrape config updaten
# docker compose -f monitoring restart prometheus
```

### 4.3 Portainer Integration

Alternativ zum CLI-Script kann das Template als Portainer Stack Template hinterlegt werden. Vorteile: Web-UI für Deployment, integrierte Log-Ansicht und einfaches Management über das Portainer-Dashboard. Das Template wird über die Portainer API deployt, wobei die Environment-Variablen als Stack-Env mitgegeben werden.

---

## 5. Monitoring & Alerting

Ein zentraler Monitoring-Stack überwacht alle Shop-Instanzen und die zugrundeliegende Infrastruktur.

### 5.1 Monitoring-Stack Komponenten

| Komponente | Image | Aufgabe |
|---|---|---|
| **Prometheus** | `prom/prometheus:v2.55.1` | Sammelt Metriken von allen Services (Container, Host, Applikation). Speichert Zeitreihen-Daten für Trend-Analyse. |
| **Grafana** | `grafana/grafana:11.4.0` | Dashboards für Shop-Übersicht, Server-Ressourcen und Einzelshop-Details. Erreichbar über Cloudflare Tunnel. |
| **Alertmanager** | `prom/alertmanager:v0.27.0` | Verarbeitet Prometheus-Alerts und sendet E-Mail-Benachrichtigungen. Inklusive Grouping, Deduplication und Silencing. |
| **Node Exporter** | `prom/node-exporter:v1.8.2` | Sammelt Host-Metriken: CPU, RAM, Disk, Netzwerk. |
| **cAdvisor** | `gcr.io/cadvisor/cadvisor` | Container-Level-Metriken: CPU/Memory pro Container, Restart-Count, Netzwerk-I/O. |

### 5.2 Monitoring Stack (Docker Compose)

```yaml
name: monitoring

services:
  prometheus:
    image: prom/prometheus:v2.55.1
    container_name: prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alerts/:/etc/prometheus/alerts/:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    networks:
      - monitoring
      - proxy
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  grafana:
    image: grafana/grafana:11.4.0
    container_name: grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=https://grafana.${DOMAIN}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
    networks:
      - monitoring
      - proxy
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  alertmanager:
    image: prom/alertmanager:v0.27.0
    container_name: alertmanager
    restart: unless-stopped
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
    networks:
      - monitoring
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 128M

  node-exporter:
    image: prom/node-exporter:v1.8.2
    container_name: node-exporter
    restart: unless-stopped
    pid: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.49.1
    container_name: cadvisor
    restart: unless-stopped
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    networks:
      - monitoring

networks:
  proxy:
    external: true
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
```

### 5.3 Alert-Regeln

Folgende Alert-Regeln werden konfiguriert, um Probleme frühzeitig zu erkennen:

| Alert | Severity | Schwellwert | Aktion |
|---|---|---|---|
| **ContainerDown** | 🔴 Critical | Container unhealthy > 1 Min. | E-Mail + Claude Code Auto-Restart |
| **HighCPU** | 🟠 Warning | CPU > 80% für 5 Min. | E-Mail + Claude Code Analyse |
| **HighMemory** | 🟠 Warning | RAM > 85% für 5 Min. | E-Mail + Claude Code Analyse |
| **DiskFull** | 🔴 Critical | Disk > 90% | E-Mail + Claude Code Cleanup |
| **HighResponseTime** | 🟠 Warning | P95 > 3s für 5 Min. | E-Mail + Claude Code Analyse |
| **DBConnectionFailed** | 🔴 Critical | PG Health Check fehlgeschlagen | E-Mail + Claude Code Auto-Restart DB |
| **SSLExpiringSoon** | 🟠 Warning | Zertifikat < 14 Tage | E-Mail (Cloudflare managed – Info only) |
| **ContainerRestart** | 🟠 Warning | > 3 Restarts in 15 Min. | E-Mail + Claude Code Root-Cause-Analyse |

### 5.4 Prometheus Alert Rules (Beispiel)

```yaml
# prometheus/alerts/shop-alerts.yml
groups:
  - name: shop-alerts
    rules:
      - alert: ContainerDown
        expr: up{job=~"shop-.*"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Container {{ $labels.instance }} ist down"
          description: "Der Container {{ $labels.container_name }} ist seit über 1 Minute nicht erreichbar."

      - alert: HighCPU
        expr: rate(container_cpu_usage_seconds_total[5m]) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Hohe CPU-Auslastung auf {{ $labels.name }}"

      - alert: HighMemory
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Hoher RAM-Verbrauch auf {{ $labels.name }}"

      - alert: DiskFull
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 10
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Disk fast voll (< 10% frei)"

      - alert: ContainerRestarting
        expr: increase(docker_container_restart_count[15m]) > 3
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "Container {{ $labels.name }} restartet wiederholt"
```

### 5.5 Alertmanager Konfiguration

```yaml
# alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alerts@vision-x-digital.de'
  smtp_auth_username: '${SMTP_USER}'
  smtp_auth_password: '${SMTP_PASSWORD}'
  smtp_require_tls: true

route:
  group_by: ['alertname', 'shop']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'email-and-webhook'
  routes:
    - match:
        severity: critical
      receiver: 'email-and-webhook'
      repeat_interval: 1h
    - match:
        severity: warning
      receiver: 'email-and-webhook'
      repeat_interval: 4h

receivers:
  - name: 'email-and-webhook'
    email_configs:
      - to: 'info@vision-x-digital.de'
        send_resolved: true
    webhook_configs:
      - url: 'http://auto-healer:8080/webhook/alert'
        send_resolved: true
```

### 5.6 Grafana Dashboards

Drei vorkonfigurierte Dashboards bieten einen umfassenden Überblick:

- **Shop-Übersicht:** Alle Shops auf einen Blick – Status (grün/rot), Response-Zeiten, Uptime-Prozent, aktive Bestellungen. Traffic-Heatmap über alle Shops.
- **Einzelshop-Detail:** CPU/Memory-Verbrauch pro Service (Backend, Storefront, DB, Redis), Request-Rate, Error-Rate, DB-Connection-Pool, Redis-Memory und Slow-Queries.
- **Server-Infrastruktur:** Host-Level Metriken – Gesamte CPU/RAM/Disk-Auslastung, Docker-Engine-Status, Netzwerk-I/O, Container-Anzahl.

---

## 6. Auto-Healing mit Claude Code

Das Auto-Healing-System nutzt Claude Code als intelligenten Operations-Agent, der über Webhook-basierte Alerts getriggert wird und automatisch Probleme diagnostiziert und behebt.

### 6.1 Architektur des Auto-Healing-Systems

Der Ablauf bei einem Incident sieht wie folgt aus:

```
Prometheus Alert
       ↓
Alertmanager (Routing + Grouping)
       ↓
  ┌────┴────┐
  ↓         ↓
E-Mail    Webhook → Auto-Healer Service
  ↓                        ↓
 Info@            Claude Code CLI Analyse
                           ↓
                  ┌────────┼────────┐
                  ↓        ↓        ↓
              Restart   Cleanup   Diagnose
                  ↓        ↓        ↓
                  └────────┼────────┘
                           ↓
                    Verifikation
                           ↓
                  Incident-Report (E-Mail)
```

**1. Erkennung:** Prometheus erkennt eine Anomalie anhand der definierten Alert-Regeln (z.B. Container unhealthy).

**2. Benachrichtigung:** Alertmanager sendet parallel eine E-Mail an dich UND triggert einen Webhook.

**3. Analyse:** Der Webhook startet ein Claude Code Script, das den betroffenen Service analysiert: Container-Logs, Health-Check-Output, Resource-Usage, DB-Connections, Recent-Changes.

**4. Diagnose:** Claude Code klassifiziert das Problem und wählt eine passende Remediation-Strategie.

**5. Remediation:** Die Lösung wird automatisch ausgeführt (z.B. Container-Restart, Log-Cleanup, Config-Fix).

**6. Verifikation:** Nach der Remediation prüft Claude Code, ob der Service wieder healthy ist.

**7. Report:** Ein Incident-Report wird per E-Mail gesendet mit Root-Cause, durchgeführter Aktion und aktuellem Status.

### 6.2 Erlaubte Auto-Fix-Aktionen

Um unkontrollierte Änderungen zu vermeiden, ist der Claude Code Agent auf eine definierte Liste von Aktionen beschränkt:

| Aktion | Beschreibung | Risikostufe |
|---|---|---|
| **Container Restart** | `docker compose restart {service}` | 🟢 Niedrig – automatisch erlaubt |
| **Docker Prune** | Entfernt unused Images, Volumes, Networks | 🟢 Niedrig – automatisch erlaubt |
| **Log Rotation** | Truncate/Rotate von übergroßen Logfiles | 🟢 Niedrig – automatisch erlaubt |
| **Redis Flush** | Cache leeren bei Memory-Problemen | 🟠 Mittel – automatisch mit Logging |
| **DB Vacuum** | PostgreSQL `VACUUM ANALYZE` | 🟠 Mittel – automatisch mit Logging |
| **Stack Recreate** | `docker compose down && up -d` | 🔴 Hoch – nur nach 3 fehlgeschlagenen Restarts |
| **Config-Änderung** | Anpassung von Environment Vars | 🔴 Hoch – nur mit E-Mail-Notification |

### 6.3 Implementierung

Das Auto-Healing wird über einen **n8n-Workflow** realisiert, der als Webhook-Empfänger fungiert. n8n läuft bereits als separater Stack auf dem Server und bietet eine perfekte Brücke zwischen Alertmanager-Webhooks und Claude Code CLI-Aufrufen.

**Workflow-Ablauf:**
```
Alertmanager Webhook
       ↓
n8n Webhook-Node (empfängt Alert-Payload)
       ↓
Switch-Node (nach Alert-Typ: critical/warning)
       ↓
SSH/Execute-Node (führt Claude Code CLI aus)
       ↓
E-Mail-Node (sendet Incident-Report)
```

Alternativ kann ein leichtgewichtiger Python-Service als Webhook-Listener dienen, der direkt `docker exec` und `claude code` Befehle absetzt. Dies reduziert die Abhängigkeit von n8n.

### 6.4 Claude Code Prompt-Template für Auto-Healing

```
Du bist ein DevOps-Agent für Medusa.js Shops auf einem Hetzner-Server.

Alert: {alert_name}
Betroffener Service: {container_name}
Shop: {shop_name}
Severity: {severity}
Beschreibung: {description}

Analysiere folgende Daten:
1. Container-Logs: docker logs --tail 100 {container_name}
2. Health-Check: docker inspect {container_name} | jq '.[0].State.Health'
3. Resources: docker stats --no-stream {container_name}
4. Disk: df -h

Erlaubte Aktionen (nach Risikostufe):
- Niedrig: Container-Restart, Docker-Prune, Log-Rotation
- Mittel: Redis-Flush, DB-Vacuum
- Hoch: Stack-Recreate (nur nach 3 fehlgeschlagenen Restarts)

Führe die Analyse durch, wähle die passende Aktion und erstelle einen Incident-Report.
```

---

## 7. Backup & Disaster Recovery

Jeder Shop enthält geschäftskritische Daten (Bestellungen, Kundenkonten, Produktkataloge). Ein robustes Backup-Konzept ist essentiell.

### 7.1 Backup-Strategie

| Daten | Methode | Frequenz | Retention |
|---|---|---|---|
| **PostgreSQL** | `pg_dump` komprimiert | Täglich 3:00 UTC | 30 Tage lokal + S3/Hetzner Storage Box |
| **Redis** | RDB Snapshot | Alle 6 Stunden | 7 Tage |
| **Medusa Uploads** | rsync / rclone | Täglich | 30 Tage |
| **Docker Configs** | Git Repository | Bei jeder Änderung | Unbegrenzt (Git History) |

### 7.2 Backup-Script (Beispiel)

```bash
#!/bin/bash
# backup-shops.sh — Tägliches Backup aller Medusa Shops
# Cron: 0 3 * * * /opt/scripts/backup-shops.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y-%m-%d)
RETENTION_DAYS=30

for shop_dir in /opt/shops/*/; do
  SHOP_NAME=$(basename "$shop_dir")
  SHOP_BACKUP="${BACKUP_DIR}/${SHOP_NAME}/${DATE}"
  mkdir -p "${SHOP_BACKUP}"

  # PostgreSQL Dump
  docker exec ${SHOP_NAME}-postgres pg_dump -U medusa medusa_db \
    | gzip > "${SHOP_BACKUP}/postgres.sql.gz"

  # Redis RDB
  docker cp ${SHOP_NAME}-redis:/data/dump.rdb "${SHOP_BACKUP}/redis.rdb"

  # Medusa Uploads
  docker cp ${SHOP_NAME}-medusa:/app/uploads "${SHOP_BACKUP}/uploads"

  # Upload zu Hetzner Storage Box (optional)
  # rclone copy "${SHOP_BACKUP}" hetzner-storage:backups/${SHOP_NAME}/${DATE}
done

# Alte Backups löschen
find ${BACKUP_DIR} -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} +
```

### 7.3 Disaster Recovery

Im Falle eines totalen Server-Ausfalls kann ein neuer Server innerhalb von 30–60 Minuten provisioniert werden:

1. Hetzner Server erstellen (via API oder Cloud Console)
2. Docker + Portainer installieren (Ansible Playbook)
3. Git-Repo mit allen Configs clonen
4. Backups von Hetzner Storage Box restaurieren
5. Cloudflare Tunnel auf neuen Server umleiten

Die gesamte Infrastruktur-Konfiguration ist in Git versioniert – ein neuer Server ist lediglich eine Frage des Restores, nicht der Neukonfiguration.

---

## 8. Skalierungsstrategie

Die Architektur ist darauf ausgelegt, von einem einzelnen Server für 4–6 Shops bis hin zu einer Multi-Server-Umgebung für 10+ Shops zu wachsen.

### 8.1 Resource-Kalkulation pro Shop

| Service | CPU | RAM | Disk | Hinweis |
|---|---|---|---|---|
| Medusa Backend | 0.5–1.0 vCPU | 512 MB–1 GB | 1 GB | Je nach Plugin-Anzahl |
| Next.js Storefront | 0.5–1.0 vCPU | 512 MB–1 GB | 500 MB | SSR-lastig |
| PostgreSQL | 0.25–0.5 vCPU | 256–512 MB | 2–10 GB | Abhängig von Produktanzahl |
| Redis | 0.1–0.25 vCPU | 128–256 MB | 100 MB | Hauptsächlich Cache |
| **Gesamt pro Shop** | **1.35–2.75 vCPU** | **1.4–2.75 GB** | **3.6–11.6 GB** | |

### 8.2 Server-Empfehlungen (Hetzner)

| Shop-Anzahl | Hetzner Server | Specs | Preis (ca.) |
|---|---|---|---|
| 1–3 Shops | CPX31 oder CCX13 | 4 vCPU, 8 GB RAM | 15–25 EUR/Monat |
| 4–6 Shops | CPX41 oder CCX23 | 8 vCPU, 16 GB RAM | 30–45 EUR/Monat |
| 7–10 Shops | CCX33 oder Dedicated | 16 vCPU, 32 GB RAM | 65–90 EUR/Monat |
| 10+ Shops | Multi-Server Setup | Verteilt | Nach Bedarf |

### 8.3 Multi-Server Strategie (ab 10+ Shops)

Bei mehr als 10 Shops empfiehlt sich eine Verteilung auf mehrere Server:

- **Server 1 (Infrastructure):** Portainer, Monitoring, Cloudflare Tunnel, n8n
- **Server 2–N (Application):** Jeweils 4–6 Medusa Shops
- **Verbindung:** Cloudflare Tunnel pro Server oder zentraler Tunnel mit Multi-Origin

---

## 9. Implementierungs-Roadmap

Die Implementierung erfolgt in vier Phasen über ca. 4–6 Wochen. Jede Phase baut auf der vorherigen auf und kann unabhängig getestet werden.

### Phase 1: Foundation (Woche 1–2)

**Ziel:** Basis-Infrastruktur steht, erster Shop kann manuell deployt werden.

1. Docker-Netzwerke erstellen (`proxy`, `monitoring`)
2. Cloudflare Tunnel Stack deployen und testen
3. Medusa.js Shop Template (`docker-compose.yml` + `.env.example`) erstellen
4. Ersten Test-Shop manuell deployen und validieren
5. Portainer Stack Template anlegen
6. Git-Repository für Infrastructure-as-Code einrichten

### Phase 2: Automatisierung (Woche 2–3)

**Ziel:** Neuer Shop in 15 Minuten per Script deploybar.

1. Deploy-Script (`deploy-shop.sh`) entwickeln und testen
2. Cloudflare API Integration für automatisches Tunnel-Routing
3. Medusa Seed-Script für initiale Konfiguration (Regionen, Währungen)
4. Backup-Cron-Jobs einrichten (`pg_dump`, `rsync`)
5. Zweiten und dritten Test-Shop automatisiert deployen

### Phase 3: Monitoring (Woche 3–4)

**Ziel:** Vollständige Überwachung aller Shops mit E-Mail-Alerts.

1. Monitoring-Stack deployen (Prometheus, Grafana, Alertmanager, Node Exporter, cAdvisor)
2. Prometheus Scrape-Config für alle Shop-Services
3. Alert-Regeln definieren und testen
4. Grafana Dashboards erstellen (Shop-Übersicht, Detail, Infra)
5. E-Mail-Alerting konfigurieren und Testalarme auslösen
6. Deploy-Script um automatische Monitoring-Integration erweitern

### Phase 4: Auto-Healing (Woche 4–6)

**Ziel:** Automatische Problemerkennung und -behebung ohne manuelles Eingreifen.

1. Webhook-Listener für Alertmanager implementieren (n8n oder Python)
2. Claude Code CLI auf dem Server installieren und konfigurieren
3. Auto-Healing-Playbooks für jeden Alert-Typ erstellen
4. Incident-Report E-Mail-Template erstellen
5. Chaos-Tests durchführen (Container-Kill, Disk-Fill, Memory-Stress)
6. Eskalations-Logik implementieren (Auto-Fix → Retry → E-Mail-Eskalation)

---

## 10. Nächste Schritte

Um mit der Implementierung zu starten, werden folgende Deliverables in der genannten Reihenfolge erstellt:

| # | Deliverable | Beschreibung | Abhängigkeit |
|---|---|---|---|
| 1 | **Medusa Shop Template** | `docker-compose.yml` + `.env.example` + Dockerfile | Keine |
| 2 | **Cloudflare Tunnel Stack** | Tunnel-Config mit dynamischem Routing | Keine |
| 3 | **Deploy-Script** (`deploy-shop.sh`) | Automatisiertes Shop-Deployment | #1, #2 |
| 4 | **Monitoring Stack** | Prometheus + Grafana + Alertmanager | Keine |
| 5 | **Alert-Regeln + Grafana Dashboards** | Vorkonfigurierte Überwachung | #4 |
| 6 | **Auto-Healing Agent** | Webhook-Listener + Claude Code Integration | #4, #5 |
| 7 | **Backup-System** | Automatisierte Backups + Restore-Test | #1 |

**Empfehlung:** Beginne mit Deliverable #1 (Medusa Shop Template) und #2 (Cloudflare Tunnel Stack), da diese die Grundlage für alles Weitere bilden. Sobald ein erster Shop erfolgreich läuft, folgen Automatisierung und Monitoring.

---

*Erstellt am 13. Februar 2026 für Vision X Digital*
