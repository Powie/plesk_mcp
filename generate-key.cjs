const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

async function generateApiKey() {
  try {
    console.log('Generiere API-Key für de01.be-webspace.net...');

    const response = await axios.post(
      'https://de01.be-webspace.net:8443/api/v2/auth/keys',
      { name: 'MCP Server API Key' },
      {
        auth: {
          username: 'root',
          password: 'Babett67#adminde01'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }
    );

    const apiKey = response.data.key;
    console.log('API-Key erfolgreich generiert!');

    // Read current .env
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add PLESK_URL and PLESK_API_KEY
    const lines = envContent.split('\n').filter(line => line.trim() !== '');
    let urlFound = false;
    let keyFound = false;

    const newLines = lines.map(line => {
      if (line.startsWith('PLESK_URL=')) {
        urlFound = true;
        return 'PLESK_URL=https://de01.be-webspace.net:8443';
      }
      if (line.startsWith('PLESK_API_KEY=')) {
        keyFound = true;
        return 'PLESK_API_KEY=' + apiKey;
      }
      return line;
    });

    if (!urlFound) newLines.push('PLESK_URL=https://de01.be-webspace.net:8443');
    if (!keyFound) newLines.push('PLESK_API_KEY=' + apiKey);

    fs.writeFileSync(envPath, newLines.join('\n') + '\n');

    console.log('\n✅ API-Key wurde in .env gespeichert!');
    console.log('📝 Bitte starte Claude Desktop neu, um die neue Konfiguration zu laden.');
  } catch (error) {
    console.error('❌ Fehler:', error.response?.data || error.message);
    process.exit(1);
  }
}

generateApiKey();
