// Supply credentials through the environment.
(async () => {
  const { generateApiKey, saveApiKeyToEnv } = await import('./dist/auth.js');
  const { PLESK_URL: url, PLESK_USERNAME: username, PLESK_PASSWORD: password } = process.env;
  if (!url || !username || !password || new URL(url).protocol !== 'https:') {
    throw new Error('Set PLESK_URL (HTTPS), PLESK_USERNAME and PLESK_PASSWORD.');
  }
  const instance = process.env.PLESK_INSTANCE || 'default';
  if (!/^(default|instance_[0-9]+)$/.test(instance)) throw new Error('Invalid instance');
  const key = await generateApiKey(url, username, password);
  saveApiKeyToEnv(instance, url, key);
  console.log('API key saved.');
})().catch(() => {
  console.error('API key generation failed. Check configuration and server access.');
  process.exitCode = 1;
});
