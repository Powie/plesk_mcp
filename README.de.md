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

see INSTALL.md

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

## Usage Examples

### List domains
```
Show me all domains on my Plesk server
```

### Create domain
```
Create a new domain "example.com" for client with ID 5
```

### Retrieve server information
```
Which Plesk version is running on my server?
```

### Generate API key
```
Generate a new API key for my Plesk server at https://server.com:8443 with username admin and password xyz
```

### Manage WordPress installations
```
Show me all WordPress installations on my server
```

```
Create a backup of WordPress installation with ID 15
```

```
Enable maintenance mode for WordPress installation with ID 15
```

```
Clone WordPress installation with ID 15 to staging.example.com
```

```
Clear cache for WordPress installations 10, 15 and 20
```
