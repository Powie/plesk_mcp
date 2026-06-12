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

#### Option A: Manuell über Plesk UI

1. Melden Sie sich in Plesk an
2. Navigieren Sie zu: **Tools & Settings** → **API Keys**
3. Klicken Sie auf **Create API Key**
4. Kopieren Sie den generierten Key
5. Fügen Sie ihn in Ihre `.env` Datei ein

#### Option B: Über Plesk Extension

1. Installieren Sie die Plesk Extension "secret-keys-manager"
2. Öffnen Sie die Extension und fügen Sie einen neuen API Key hinzu

## Integration mit Claude Desktop

### 1. Claude Desktop Config öffnen

Die Konfigurationsdatei finden Sie hier:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### 2. MCP Server hinzufügen

Fügen Sie den Plesk MCP Server zur Konfiguration hinzu:

#### Empfohlen: Bei Installation von GitHub:

```json
{
  "mcpServers": {
   "plesk": {
      "command": "npx",
      "args": [
        "-y",
        "github:Powie/plesk_mcp#beta"
      ],
      "env": {
        "PLESK_1_URL": "https://my.server1.com:8443",
        "PLESK_1_API_KEY": "total-secret-key"
      }
   }
  }
}
```

### 3. Claude Desktop neu starten

Starten Sie Claude Desktop komplett neu, damit die Änderungen wirksam werden.

Fügen Sie den ersten Server hinzu mit folgendem Prompt:

Füge einen neuen Plesk Server hinzu, Servername: https://server.xx:8443 mit Benutzername: user und Passwort: geheimespasswort

### 4. Verbindung testen

Öffnen Sie Claude Desktop und testen Sie die Verbindung:

```
Zeige mir alle verfügbaren Plesk-Instanzen
```

Claude sollte nun die konfigurierten Plesk-Server anzeigen.


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
