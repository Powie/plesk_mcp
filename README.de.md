# Plesk MCP Server

MCP Server für die Plesk REST API mit Unterstützung für mehrere Plesk-Instanzen.

## Features

- ✅ Support für mehrere Plesk-Instanzen
- ✅ Automatische API-Key-Generierung
- ✅ Vollständige REST API Integration
- ✅ Domain-Management
- ✅ Client-Management
- ✅ Server-Informationen
- ✅ Extension-Management
- ✅ CLI-Befehle ausführen
- ✅ **WordPress Toolkit Integration**
  - WordPress Installationen verwalten
  - Backups erstellen und wiederherstellen
  - Installationen klonen
  - Wartungsmodus steuern
  - Cache leeren
  - Sicherheitseinstellungen (Vulnerability Filtering)

## Installation

```bash
npm install
npm run build
```

## Konfiguration

1. Kopiere `.env.example` zu `.env`
2. Trage deine Plesk-Instanzen ein:

```env
PLESK_URL=https://your-plesk-server.com
PLESK_API_KEY=your-api-key

PLESK_2_URL=https://second-server.com
PLESK_2_API_KEY=second-api-key
```

## API-Key generieren

### Automatisch über MCP Tool (empfohlen)

Der MCP Server bietet ein Tool zur automatischen API-Key-Generierung:

**In Claude Desktop:**
```
Verwende das Tool plesk_generate_api_key mit:
- plesk_url: https://dein-server.com:8443
- username: admin
- password: dein-passwort
- instance_name: default (oder instance_2, etc.)
```

Das Tool generiert automatisch einen API-Key und speichert ihn in der `.env` Datei. Nach einem Neustart des MCP Servers ist die Instanz verfügbar.

### Manuell über Plesk UI

1. Melde dich in Plesk an
2. Gehe zu "Tools & Settings" > "API Keys"
3. Erstelle einen neuen API-Key
4. Kopiere den Key in deine `.env` Datei

## MCP Tools

### Authentication & Setup
- `plesk_generate_api_key` - API-Key generieren und in .env speichern
- `plesk_list_api_keys` - Alle API-Keys auflisten
- `plesk_delete_api_key` - API-Key löschen
- `plesk_list_instances` - Alle konfigurierten Instanzen anzeigen

### Domain Management
- `plesk_list_domains` - Liste aller Domains
- `plesk_get_domain` - Domain-Details abrufen
- `plesk_create_domain` - Neue Domain erstellen
- `plesk_update_domain` - Domain aktualisieren
- `plesk_delete_domain` - Domain löschen

### Client Management
- `plesk_list_clients` - Liste aller Clients
- `plesk_get_client` - Client-Details abrufen
- `plesk_create_client` - Neuen Client erstellen
- `plesk_update_client` - Client aktualisieren
- `plesk_suspend_client` - Client suspendieren
- `plesk_activate_client` - Client aktivieren

### Server Management
- `plesk_get_server_info` - Server-Informationen
- `plesk_list_ips` - Liste aller IP-Adressen

### Extensions
- `plesk_list_extensions` - Liste aller Extensions

### CLI
- `plesk_execute_cli` - Plesk CLI-Befehl ausführen

### WordPress Toolkit
- `plesk_wp_list_installations` - Liste aller WordPress-Installationen
- `plesk_wp_get_installation` - Details einer WordPress-Installation
- `plesk_wp_clone_installation` - WordPress-Installation klonen
- `plesk_wp_create_backup` - Backup erstellen
- `plesk_wp_restore_backup` - Backup wiederherstellen
- `plesk_wp_list_backups` - Alle Backups auflisten
- `plesk_wp_toggle_maintenance` - Wartungsmodus aktivieren/deaktivieren
- `plesk_wp_clear_cache` - Cache leeren
- `plesk_wp_get_background_task` - Status eines Background-Tasks abrufen
- `plesk_wp_list_background_tasks` - Background-Tasks auflisten
- `plesk_wp_update_vulnerability_filtering` - Vulnerability-Filtering aktivieren/deaktivieren
- `plesk_wp_get_changelog` - WordPress Toolkit Changelog abrufen

## Verwendung mit Claude Desktop

Füge in der Claude Desktop Config (`claude_desktop_config.json`) hinzu:

```json
{
  "mcpServers": {
    "plesk": {
      "command": "node",
      "args": ["/yourgit/plesk_mcp/dist/index.js"]
    }
  }
}
```

## Entwicklung

```bash
npm run dev
```
