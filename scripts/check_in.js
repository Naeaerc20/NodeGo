#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const colors = require('colors');
const apis = require('./apis.js');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function getProxiesList() {
  const proxyFilePath = path.join(__dirname, '..', 'proxies.txt');
  try {
    const data = fs.readFileSync(proxyFilePath, 'utf8');
    return data.split('\n').map(line => line.trim()).filter(Boolean);
  } catch (err) {
    return [];
  }
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

async function performCheckIn() {
  // Load tokens from helpers/tokens.json
  const tokensFilePath = path.join(__dirname, '..', 'helpers', 'tokens.json');
  let tokens = [];
  try {
    const tokenData = fs.readFileSync(tokensFilePath, 'utf8');
    tokens = JSON.parse(tokenData);
  } catch (err) {
    console.log(colors.green("No tokens found in tokens.json"));
    return;
  }

  const proxiesList = getProxiesList();
  if (proxiesList.length === 0) {
    console.log(colors.green("No proxies available in proxies.txt"));
    return;
  }

  // Process each account token
  for (const tokenObj of tokens) {
    const accountId = tokenObj.id;
    const accessToken = tokenObj.access_token;
    console.log(colors.green(`Performing daily Check-In for Account [${accountId}]`));

    // Pick a random proxy for this account
    const randomIndex = Math.floor(Math.random() * proxiesList.length);
    const proxy = proxiesList[randomIndex];

    // Extract proxy ID from the proxy string
    const proxyIdMatch = proxy.match(/socks5:\/\/[^-]+-zone-custom-(?:session|sessid)-([^-\n]+)-sessTime-/);
    const proxyId = proxyIdMatch ? proxyIdMatch[1] : "Unknown";

    // Get the public IP via the proxy
    let proxyIP = "Unknown";
    try {
      const proxyIPResponse = await apis.getProxyIP(proxy);
      if (proxyIPResponse.data && proxyIPResponse.data.ip) {
        proxyIP = proxyIPResponse.data.ip;
      }
    } catch (err) {
      // Leave proxyIP as "Unknown" if an error occurs
    }
    console.log(colors.green(`Using Proxy ID - [${proxyId}] with Public IP - [${proxyIP}]`));

    // Call the makeCheckIn API
    try {
      const response = await apis.makeCheckIn(accessToken, proxy);
      // Extract points from the message, e.g., "You earned 10 points."
      let points = "0";
      if (response.data && response.data.message) {
        const match = response.data.message.match(/earned (\d+) points/);
        if (match) {
          points = match[1];
        }
      }
      console.log(colors.green(`Account [${accountId}] Has successfully made check-in & claimed ${points} Points \n`));
    } catch (err) {
      console.log(colors.green(`Error during check-in for Account [${accountId}]: ${err.message} \n`));
    }
    // Wait 5 seconds before processing the next account
    await delay(5000);
  }

  // Schedule next execution in a random delay between 24 and 29 hours
  const lowerBound = 24 * 3600 * 1000; // 24 hours in ms
  const upperBound = 29 * 3600 * 1000; // 29 hours in ms
  const nextDelay = Math.floor(Math.random() * (upperBound - lowerBound) + lowerBound);
  console.log(colors.green(`🕥 Script Programmed to Perform next Check-In in ${formatTime(nextDelay)}`));
  setTimeout(performCheckIn, nextDelay);
}

// Start the check-in process
performCheckIn();
