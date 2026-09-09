const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

const [,, url, username, password] = process.argv;

if (!url || !username || !password) {
  console.error('Usage: node generate-key.cjs <plesk-url> <username> <password>');
  console.error('Example: node generate-key.cjs https://server.com:8443 root mypassword');
  process.exit(1);
}

async function generateApiKey() {
  try {
    console.log(`Generiere API-Key für ${url}...`);

    const response = await axios.post(
      `${url.replace(/\/$/, '')}/api/v2/cli/secret_key/call`,
      // Omitting -ip-address creates a key usable after a client IP change.
      { params: ['--create', '-description', 'MCP Server API Key'] },
      {
        auth: { username, password },
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      }
    );

    if (response.data?.code !== 0 || typeof response.data.stdout !== 'string' || !response.data.stdout.trim()) {
      throw new Error('Plesk did not return a valid API key from secret_key');
    }
    const apiKey = response.data.stdout.trim();
    console.log('API-Key erfolgreich generiert!');

    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const lines = envContent.split('\n').filter(line => line.trim() !== '');
    let urlFound = false;
    let keyFound = false;

    const newLines = lines.map(line => {
      if (line.startsWith('PLESK_URL=')) { urlFound = true; return `PLESK_URL=${url}`; }
      if (line.startsWith('PLESK_API_KEY=')) { keyFound = true; return `PLESK_API_KEY=${apiKey}`; }
      return line;
    });

    if (!urlFound) newLines.push(`PLESK_URL=${url}`);
    if (!keyFound) newLines.push(`PLESK_API_KEY=${apiKey}`);

    fs.writeFileSync(envPath, newLines.join('\n') + '\n');

    console.log('API-Key wurde in .env gespeichert.');
    console.log('Bitte starte Claude Desktop neu, um die neue Konfiguration zu laden.');
  } catch (error) {
    console.error('Fehler:', error.response?.data || error.message);
    process.exit(1);
  }
}

generateApiKey();
