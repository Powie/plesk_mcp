# Installation des Plesk MCP Servers

Diese Anleitung beschreibt, wie Sie den Plesk MCP Server für die Nutzung mit Claude Desktop oder anderen MCP-Clients installieren und konfigurieren.

## Voraussetzungen

- Node.js (Version 18 oder höher)
- npm oder yarn
- Zugang zu einem oder mehreren Plesk-Servern
- Claude Desktop (für die Nutzung mit Claude)

## Installation

### Option A: Installation von GitHub (Empfohlen)

Die einfachste Methode ist die direkte Installation von GitHub:

```bash
npm install github:Powie/plesk_mcp
```

Das Projekt wird automatisch heruntergeladen, die Dependencies installiert und TypeScript kompiliert.

**Hinweis:** Sie können auch einen spezifischen Branch installieren:
```bash
npm install github:Powie/plesk_mcp#beta
```

### Option B: Lokale Installation (Entwicklung)

Für Entwicklungszwecke oder wenn Sie den Code anpassen möchten:

#### 1. Repository klonen

```bash
git clone https://github.com/Powie/plesk_mcp.git
cd plesk_mcp
```

#### 2. Dependencies installieren und kompilieren

```bash
npm install
```

Der `prepare`-Script wird automatisch ausgeführt und kompiliert TypeScript mit `npm run build`.

## Konfiguration

### 1. Umgebungsvariablen einrichten

Kopieren Sie die Beispiel-Konfiguration:

```bash
cp .env.example .env
```

Bearbeiten Sie die `.env` Datei und tragen Sie Ihre Plesk-Zugangsdaten ein:

```env
# Erste Plesk-Instanz (Standard)
PLESK_URL=https://your-plesk-server.com:8443
PLESK_API_KEY=your-api-key-here

# Zweite Plesk-Instanz (optional)
PLESK_2_URL=https://second-server.com:8443
PLESK_2_API_KEY=second-api-key-here

# Weitere Instanzen nach dem gleichen Schema
# PLESK_3_URL=...
# PLESK_3_API_KEY=...
```

### 2. API-Key erhalten

Sie haben mehrere Möglichkeiten, einen API-Key zu erhalten:

#### Option A: Automatisch über den MCP Server (Empfohlen)

Nach der Integration in Claude Desktop können Sie den API-Key automatisch generieren lassen:

1. Starten Sie Claude Desktop
2. Nutzen Sie das Tool `plesk_generate_api_key`
3. Der Key wird automatisch in die `.env` Datei geschrieben
4. Starten Sie Claude Desktop neu, um den neuen Key zu laden

#### Option B: Manuell über Plesk UI

1. Melden Sie sich in Plesk an
2. Navigieren Sie zu: **Tools & Settings** → **API Keys**
3. Klicken Sie auf **Create API Key**
4. Kopieren Sie den generierten Key
5. Fügen Sie ihn in Ihre `.env` Datei ein

#### Option C: Über die Plesk CLI

```bash
plesk ext call api-management --method create --params "name=MyAPIKey"
```

## Integration mit Claude Desktop

### 1. Claude Desktop Config öffnen

Die Konfigurationsdatei finden Sie hier:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### 2. MCP Server hinzufügen

Fügen Sie den Plesk MCP Server zur Konfiguration hinzu:

#### Bei Installation von GitHub:

```json
{
  "mcpServers": {
    "plesk": {
      "command": "node",
      "args": ["./node_modules/plesk-mcp-server/dist/index.js"]
    }
  }
}
```

#### Bei lokaler Installation (Entwicklung):

```json
{
  "mcpServers": {
    "plesk": {
      "command": "node",
      "args": ["/home/user/plesk-mcp-server/dist/index.js"]
    }
  }
}
```

**Wichtig:** Passen Sie den Pfad an Ihre Installation an!

Für Linux/macOS verwenden Sie Forward-Slashes:
```json
"args": ["/home/user/plesk_mcp/dist/index.js"]
```

### 3. Claude Desktop neu starten

Starten Sie Claude Desktop komplett neu, damit die Änderungen wirksam werden.

### 4. Verbindung testen

Öffnen Sie Claude Desktop und testen Sie die Verbindung:

```
Zeige mir alle verfügbaren Plesk-Instanzen
```

Claude sollte nun die konfigurierten Plesk-Server anzeigen.

## Verfügbare MCP Tools

Nach der Installation stehen Ihnen folgende Tools zur Verfügung:

### Server & Instanzen
- `plesk_list_instances` - Zeigt alle konfigurierten Plesk-Instanzen
- `plesk_get_server_info` - Server-Informationen abrufen
- `plesk_list_ips` - Alle IP-Adressen auflisten

### API-Key Management
- `plesk_generate_api_key` - Neuen API-Key generieren und speichern
- `plesk_list_api_keys` - Alle API-Keys auflisten
- `plesk_delete_api_key` - API-Key löschen

### Domain Management
- `plesk_list_domains` - Alle Domains auflisten
- `plesk_get_domain` - Domain-Details abrufen
- `plesk_create_domain` - Neue Domain erstellen
- `plesk_update_domain` - Domain aktualisieren
- `plesk_delete_domain` - Domain löschen

### Client Management
- `plesk_list_clients` - Alle Clients auflisten
- `plesk_get_client` - Client-Details abrufen
- `plesk_create_client` - Neuen Client erstellen
- `plesk_update_client` - Client aktualisieren
- `plesk_suspend_client` - Client suspendieren
- `plesk_activate_client` - Client aktivieren

### Extensions & CLI
- `plesk_list_extensions` - Installierte Extensions auflisten
- `plesk_execute_cli` - Plesk CLI-Befehl ausführen

### WordPress Toolkit
- `plesk_wp_list_installations` - Alle WordPress-Installationen auflisten
- `plesk_wp_get_installation` - Details einer WordPress-Installation abrufen
- `plesk_wp_clone_installation` - WordPress-Installation klonen
- `plesk_wp_create_backup` - Backup einer WordPress-Installation erstellen
- `plesk_wp_restore_backup` - WordPress-Installation aus Backup wiederherstellen
- `plesk_wp_list_backups` - Alle Backups für eine Installation auflisten
- `plesk_wp_toggle_maintenance` - Wartungsmodus aktivieren/deaktivieren
- `plesk_wp_clear_cache` - Cache für WordPress-Installationen leeren
- `plesk_wp_get_background_task` - Status eines Background-Tasks abrufen
- `plesk_wp_list_background_tasks` - Alle Background-Tasks für eine Installation
- `plesk_wp_update_vulnerability_filtering` - Sicherheitsfilter aktivieren/deaktivieren
- `plesk_wp_get_changelog` - WordPress Toolkit Changelog abrufen

## Verwendungsbeispiele

### Domains auflisten
```
Zeige mir alle Domains auf meinem Plesk-Server
```

### Domain erstellen
```
Erstelle eine neue Domain "example.com" für den Client mit ID 5
```

### Server-Informationen abrufen
```
Welche Plesk-Version läuft auf meinem Server?
```

### API-Key generieren
```
Generiere einen neuen API-Key für meinen Plesk-Server unter https://server.com:8443 mit Benutzername admin und Passwort xyz
```

### WordPress-Installationen verwalten
```
Zeige mir alle WordPress-Installationen auf meinem Server
```

```
Erstelle ein Backup der WordPress-Installation mit ID 15
```

```
Aktiviere den Wartungsmodus für die WordPress-Installation mit ID 15
```

```
Klone die WordPress-Installation mit ID 15 nach staging.example.com
```

```
Lösche den Cache für die WordPress-Installationen 10, 15 und 20
```

## Mehrere Plesk-Instanzen

Der MCP Server unterstützt mehrere Plesk-Instanzen gleichzeitig. Fügen Sie einfach weitere Instanzen in der `.env` Datei hinzu:

```env
PLESK_URL=https://server1.com:8443
PLESK_API_KEY=key1

PLESK_2_URL=https://server2.com:8443
PLESK_2_API_KEY=key2

PLESK_3_URL=https://server3.com:8443
PLESK_3_API_KEY=key3
```

Beim Aufruf der Tools können Sie dann die gewünschte Instanz angeben.

## Troubleshooting

### MCP Server wird nicht erkannt

1. Überprüfen Sie den Pfad in `claude_desktop_config.json`
2. Stellen Sie sicher, dass `npm run build` erfolgreich ausgeführt wurde
3. Prüfen Sie, ob die Datei `dist/index.js` existiert
4. Starten Sie Claude Desktop komplett neu (nicht nur das Fenster schließen)

### Verbindungsfehler zu Plesk

1. Überprüfen Sie die URL in der `.env` Datei (inkl. Port 8443)
2. Testen Sie die Verbindung im Browser
3. Prüfen Sie, ob der API-Key noch gültig ist
4. Stellen Sie sicher, dass der Plesk-Server von Ihrem Netzwerk aus erreichbar ist

### API-Key funktioniert nicht

1. Generieren Sie einen neuen API-Key über die Plesk UI
2. Stellen Sie sicher, dass keine zusätzlichen Leerzeichen im Key sind
3. Prüfen Sie, ob der Key die richtigen Berechtigungen hat
4. Starten Sie Claude Desktop nach Änderungen an der `.env` Datei neu

## Updates

Um den MCP Server zu aktualisieren:

```bash
git pull
npm install
npm run build
```

Starten Sie danach Claude Desktop neu.

## Deinstallation

1. Entfernen Sie den Eintrag aus `claude_desktop_config.json`
2. Starten Sie Claude Desktop neu
3. Löschen Sie optional das `plesk_mcp` Verzeichnis

## Support

Bei Problemen oder Fragen:
- Überprüfen Sie die Logs von Claude Desktop
- Testen Sie die Plesk API direkt mit curl/Postman
- Öffnen Sie ein Issue im Repository
