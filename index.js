const inquirer = require('inquirer');
const figlet = require('figlet');
const colors = require('colors');
const consoleClear = require('console-clear');
const winston = require('winston');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const apis = require('./scripts/apis.js');
const { SocksProxyAgent } = require('socks-proxy-agent');
const axios = require('axios');

winston.addColors({ info: 'blue', warn: 'yellow', error: 'red' });
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format((info) => {
      info.level = `[${info.level.toUpperCase()}]`;
      return info;
    })(),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ level, message }) => `${level} ${message}`)
  ),
  transports: [new winston.transports.Console()]
});

function showBannerOnce() {
  console.log(colors.green(figlet.textSync("NODEGO")));
  console.log(colors.green("Script Created by Naeaex."));
  console.log(colors.green("Follow me on X - x.com/naeaexeth or Github - github.com/Naeaerc20 \n"));
}

function getProxiesList() {
  const proxyFilePath = path.join(__dirname, 'proxies.txt');
  try {
    const data = fs.readFileSync(proxyFilePath, 'utf8');
    return data.split('\n').map(line => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function trySendPing(accessToken, proxy, details) {
  let attempt = 0;
  const maxAttempts = 3;
  while (attempt < maxAttempts) {
    try {
      const response = await apis.sendPing(accessToken, proxy);
      return response;
    } catch (err) {
      if (err.response && err.response.status === 520) {
        attempt++;
        if (attempt === maxAttempts) {
          logger.warn(`Ping attempt failed for ${details}`);
          throw err;
        }
        await delay(2000);
      } else {
        throw err;
      }
    }
  }
}

async function solveCaptcha() {
  return new Promise((resolve, reject) => {
    exec('python3 scripts/solve_captcha.py', (error, stdout, stderr) => {
      if (error) return reject(error);
      const output = stdout.trim();
      const prefix = 'solved: ';
      if (output.startsWith(prefix)) {
        const resultStr = output.slice(prefix.length);
        const match = resultStr.match(/'code':\s*'([^']+)'/);
        if (match) return resolve(match[1]);
        return reject(new Error("Captcha code not found"));
      } else {
        return reject(new Error("Unexpected captcha output"));
      }
    });
  });
}

async function loginWithDefaultUA(payload, proxy) {
  const agent = new SocksProxyAgent(proxy);
  const instance = axios.create({
    httpAgent: agent,
    httpsAgent: agent,
    proxy: false,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  return instance.post('https://nodego.ai/api/auth/login', payload);
}

async function registerAccountOption() {
  const regAnswers = await inquirer.prompt([
    { type: 'input', name: 'email', message: 'Enter email:' },
    { type: 'input', name: 'username', message: 'Enter username:' },
    { type: 'input', name: 'password', message: 'Enter password:' }
  ]);

  console.log("Solving captcha, please wait...");
  let captchaSolved;
  try {
    captchaSolved = await solveCaptcha();
  } catch (err) {
    console.error("Error solving captcha:", err);
    console.error("Failed to solve captcha. Returning to Main Menu.");
    await inquirer.prompt({ type: 'input', name: 'enter', message: 'Press Enter to return to Main Menu...' });
    return;
  }
  console.log("Captcha Solved");

  const proxiesList = getProxiesList();
  if (proxiesList.length === 0) {
    console.error("No proxy available, please check proxies.txt");
    await inquirer.prompt({ type: 'input', name: 'enter', message: 'Press Enter to return to Main Menu...' });
    return;
  }

  const proxy = proxiesList[Math.floor(Math.random() * proxiesList.length)];
  const proxyIdMatch = proxy.match(/socks5:\/\/[^-]+-zone-custom-(?:session|sessid)-([^-\n]+)-sessTime-/);
  const proxyId = proxyIdMatch ? proxyIdMatch[1] : "Unknown";
  let proxyIP = "Unknown";
  try {
    const proxyIPResponse = await apis.getProxyIP(proxy);
    if (proxyIPResponse.data && proxyIPResponse.data.ip) {
      proxyIP = proxyIPResponse.data.ip;
    }
  } catch {}

  console.log(`Using Proxy ID [${proxyId}] with Public IP [${proxyIP}]`);

  const payload = {
    captcha: captchaSolved,
    email: regAnswers.email,
    password: regAnswers.password,
    refBy: "NODE8FE4398DF10E",
    username: regAnswers.username
  };

  try {
    const response = await apis.registerAccount(payload, proxy);
    if (response.data && response.data.statusCode === 201) {
      console.log("Account Registered Successfully");
      const accountsFilePath = path.join(__dirname, 'helpers', 'accounts.json');
      let accounts = [];
      try {
        const data = fs.readFileSync(accountsFilePath, 'utf8');
        accounts = JSON.parse(data);
      } catch {
        accounts = [];
      }
      const newId = accounts.length > 0 ? Math.max(...accounts.map(acc => acc.id)) + 1 : 1;
      const newAccount = {
        id: newId,
        username_or_email: regAnswers.email,
        password: regAnswers.password
      };
      accounts.push(newAccount);
      fs.writeFileSync(accountsFilePath, JSON.stringify(accounts, null, 2), 'utf8');
    } else {
      console.error("Error Registering Account - please try again.");
    }
  } catch (err) {
    console.error("Error Registering Account - please try again.");
    console.error(err);
  }

  await inquirer.prompt({ type: 'input', name: 'enter', message: 'Press Enter to return to Main Menu...' });
}

const PING_INTERVAL_MS = 10000;

async function runExtensionNodeOption() {
  const { autoToken } = await inquirer.prompt({
    type: 'confirm',
    name: 'autoToken',
    message: 'Do you wish to get access_token automatic?',
    default: true
  });

  const accountsFilePath = path.join(__dirname, 'helpers', 'accounts.json');
  let accounts = [];
  try {
    const data = fs.readFileSync(accountsFilePath, 'utf8');
    accounts = JSON.parse(data);
  } catch {
    logger.error("No accounts available in accounts.json");
    return;
  }

  const proxiesList = getProxiesList();
  if (proxiesList.length === 0) {
    logger.error("No proxies available in proxies.txt");
    return;
  }

  const tokensFilePath = path.join(__dirname, 'helpers', 'tokens.json');
  let tokens = [];
  try {
    const tokenData = fs.readFileSync(tokensFilePath, 'utf8');
    tokens = JSON.parse(tokenData);
  } catch {
    tokens = [];
  }

  for (const account of accounts) {
    logger.info(`Processing Account ID: ${account.id}`);

    let accessToken;
    if (autoToken) {
      const loginProxy = proxiesList[account.id - 1] || proxiesList[0];
      const proxyIdMatch = loginProxy.match(/socks5:\/\/[^-]+-zone-custom-(?:session|sessid)-([^-\n]+)-sessTime-/);
      const proxyId = proxyIdMatch ? proxyIdMatch[1] : "Unknown";
      let proxyIP = "Unknown";
      try {
        const proxyIPResponse = await apis.getProxyIP(loginProxy);
        if (proxyIPResponse.data && proxyIPResponse.data.ip) {
          proxyIP = proxyIPResponse.data.ip;
        }
      } catch {}

      logger.info(`Using Proxy ID [${proxyId}] with Public IP [${proxyIP}]`);
      logger.info("Solving Captcha...");

      let captchaSolved;
      try {
        captchaSolved = await solveCaptcha();
        logger.info("Captcha Solved to Log in Account");
      } catch (err) {
        logger.error(`Error solving captcha for account ${account.id}: ${err}`);
        continue;
      }

      const loginPayload = {
        captcha: captchaSolved,
        email: account.username_or_email,
        password: account.password
      };

      try {
        const loginResponse = await loginWithDefaultUA(loginPayload, loginProxy);
        if (loginResponse.data && loginResponse.data.statusCode === 201) {
          accessToken = loginResponse.data.metadata.accessToken;
          tokens = tokens.filter(t => t.id !== account.id);
          tokens.push({ id: account.id, access_token: accessToken });
          fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2), 'utf8');
          logger.info("Logged Into Account & Access Token Saved");
        } else {
          logger.error(`Login failed for account ${account.id}.`);
          continue;
        }
      } catch (err) {
        logger.error(`Error logging in account ${account.id}: ${err}`);
        continue;
      }
    } else {
      const tokenObj = tokens.find(t => t.id === account.id);
      if (!tokenObj) {
        logger.error(`No token found for account ${account.id}. Skipping account.`);
        continue;
      }
      accessToken = tokenObj.access_token;
    }

    const MIN_DEVICES = 1;
    const MAX_DEVICES = 5;
    const deviceCount = Math.floor(Math.random() * (MAX_DEVICES - MIN_DEVICES + 1)) + MIN_DEVICES;
    logger.info(`Account ${account.id} will connect ${deviceCount} device(s).`);

    for (let i = 1; i <= deviceCount; i++) {
      const deviceProxy = proxiesList[i - 1] || proxiesList[0];
      const deviceProxyIdMatch = deviceProxy.match(/socks5:\/\/[^-]+-zone-custom-(?:session|sessid)-([^-\n]+)-sessTime-/);
      const deviceProxyId = deviceProxyIdMatch ? deviceProxyIdMatch[1] : "Unknown";

      setInterval(async () => {
        try {
          const pingResponse = await trySendPing(
            accessToken,
            deviceProxy,
            `Account [${account.id}] Device [${i}] with Proxy ID [${deviceProxyId}]`
          );

          const { data } = pingResponse;
          if (data && (data.statusCode === 200 || data.statusCode === 201)) {
            if (data.message.includes("Node added successfully")) {
              logger.info(`Node connected successfully with Proxy ID - [${deviceProxyId}] for Account - [${account.id}] - Device - [${i}]`);
            } else if (data.message.includes("Ping successful")) {
              logger.info(`PING successfully sent to Account - [${account.id}] Device - [${i}] with Proxy ID - [${deviceProxyId}]`);
            } else {
              logger.warn(`Unexpected success message: '${data.message}' for Account - [${account.id}] Device - [${i}] Proxy - [${deviceProxyId}]`);
            }
          } else {
            logger.warn(`Failed ping for device ${i} of account ${account.id}; code=${data?.statusCode}`);
          }
        } catch (err) {
          logger.error(`Error sending ping for device ${i} of account ${account.id}: ${err}`);
        }
      }, PING_INTERVAL_MS);
    }
  }

  // Keep process alive
  while (true) {
    await delay(60000);
  }
}

async function mainMenu() {
  consoleClear();
  showBannerOnce();
  while (true) {
    const { option } = await inquirer.prompt({
      type: 'list',
      name: 'option',
      message: 'Select an option:',
      choices: [
        { name: '1. Run Extension Node', value: '1' },
        { name: '2. Register Accounts', value: '2' },
        { name: '0. Exit', value: '0' }
      ]
    });

    if (option === '0') {
      console.log("goodbye");
      process.exit(0);
    } else if (option === '1') {
      await runExtensionNodeOption();
    } else if (option === '2') {
      await registerAccountOption();
    }
    consoleClear();
    showBannerOnce();
  }
}

mainMenu();
