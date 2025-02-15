const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

function getRandomUserAgent() {
  const filePath = path.join(__dirname, '..', 'helpers', 'agents.txt');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const agents = data.split('\n').map(line => line.trim()).filter(Boolean);
    return agents.length ? agents[Math.floor(Math.random() * agents.length)] : 'Mozilla/5.0';
  } catch (error) {
    return 'Mozilla/5.0';
  }
}

const keepAliveHttpAgent = new http.Agent({ keepAlive: true });
const keepAliveHttpsAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false
});

function createAxiosInstance(proxy, userAgent) {
  const headers = { 'User-Agent': userAgent || getRandomUserAgent() };

  if (proxy) {
    const socksAgent = new SocksProxyAgent(proxy);
    return axios.create({
      httpAgent: socksAgent,
      httpsAgent: socksAgent,
      proxy: false,
      headers
    });
  }

  return axios.create({
    httpAgent: keepAliveHttpAgent,
    httpsAgent: keepAliveHttpsAgent,
    headers
  });
}

async function LogInAccount(payload, proxy) {
  const instance = createAxiosInstance(proxy);
  return instance.post('https://nodego.ai/api/auth/login', payload);
}

async function registerAccount(payload, proxy) {
  const instance = createAxiosInstance(proxy);
  return instance.post('https://nodego.ai/api/auth/register', payload);
}

async function getUserInfo(accessToken, proxy) {
  const instance = createAxiosInstance(proxy);
  return instance.get('https://nodego.ai/api/user/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
}

async function makeCheckIn(accessToken, proxy) {
  const instance = createAxiosInstance(proxy);
  return instance.post('https://nodego.ai/api/user/checkin', {}, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
}

async function sendPing(accessToken, proxy, userAgent) {
  const instance = createAxiosInstance(proxy, userAgent);
  const mergedHeaders = {
    ...instance.defaults.headers.common,
    'Authorization': `Bearer ${accessToken}`
  };
  return instance.post('https://nodego.ai/api/user/nodes/ping', { type: "extension" }, { headers: mergedHeaders });
}

async function getClientIP(proxy) {
  const instance = createAxiosInstance(proxy);
  return instance.get('https://api.bigdatacloud.net/data/client-ip');
}

async function getProxyIP(proxy) {
  const instance = createAxiosInstance(proxy);
  return instance.get('https://api.ipify.org?format=json');
}

module.exports = {
  LogInAccount,
  registerAccount,
  getUserInfo,
  makeCheckIn,
  sendPing,
  getClientIP,
  getProxyIP
};

