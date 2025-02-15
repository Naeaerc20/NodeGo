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
  // Cargar tokens desde helpers/tokens.json
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

  // Procesar cada token de cuenta
  for (const tokenObj of tokens) {
    const accountId = tokenObj.id;
    const accessToken = tokenObj.access_token;
    console.log(colors.green(`Performing daily Check-In for Account [${accountId}]`));

    // Seleccionar un proxy aleatorio para esta cuenta
    const randomIndex = Math.floor(Math.random() * proxiesList.length);
    const proxy = proxiesList[randomIndex];

    // Extraer proxy ID del string del proxy
    const proxyIdMatch = proxy.match(/socks5:\/\/[^-]+-zone-custom-(?:session|sessid)-([^-\n]+)-sessTime-/);
    const proxyId = proxyIdMatch ? proxyIdMatch[1] : "Unknown";

    // Obtener IP pública a través del proxy
    let proxyIP = "Unknown";
    try {
      const proxyIPResponse = await apis.getProxyIP(proxy);
      if (proxyIPResponse.data && proxyIPResponse.data.ip) {
        proxyIP = proxyIPResponse.data.ip;
      }
    } catch (err) {
      // Si hay error, se mantiene "Unknown"
    }
    console.log(colors.green(`Using Proxy ID - [${proxyId}] with Public IP - [${proxyIP}]`));

    // Llamar al API de makeCheckIn
    try {
      const response = await apis.makeCheckIn(accessToken, proxy);
      // Extraer puntos del mensaje en caso de éxito (por ejemplo: "+ 30 pt")
      let points = "0";
      if (response.data && response.data.message) {
        const match = response.data.message.match(/(\d+)/);
        if (match) {
          points = match[1];
        }
      }
      console.log(colors.green(`Account [${accountId}] Has successfully made check-in & claimed ${points} Points \n`));
    } catch (err) {
      // Si error 400, se interpreta que ya se hizo el check-in hoy
      if (err.response && err.response.status === 400) {
        console.log(colors.green(`Account [${accountId}] Already checked in today \n`));
      } else {
        console.log(colors.green(`Error during check-in for Account [${accountId}]: ${err.message} \n`));
      }
    }
    // Esperar 5 segundos antes de procesar la siguiente cuenta
    await delay(5000);
  }

  // Programar la siguiente ejecución en un retraso aleatorio entre 24 y 29 horas
  const lowerBound = 24 * 3600 * 1000; // 24 horas en ms
  const upperBound = 29 * 3600 * 1000; // 29 horas en ms
  const nextDelay = Math.floor(Math.random() * (upperBound - lowerBound) + lowerBound);
  console.log(colors.green(`🕥 Script Programmed to Perform next Check-In in ${formatTime(nextDelay)}`));
  setTimeout(performCheckIn, nextDelay);
}

// Iniciar el proceso de check-in
performCheckIn();
