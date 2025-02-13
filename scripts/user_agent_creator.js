#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { faker } = require('@faker-js/faker');
const colors = require('colors');

// Helper function to pick a random element from an array
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate a Chrome user-agent string
function generateChromeUserAgent(os) {
  const chromeMajor = faker.datatype.number({ min: 70, max: 100 });
  const chromeBuild = faker.datatype.number({ min: 3000, max: 5000 });
  const chromePatch = faker.datatype.number({ min: 0, max: 150 });
  const appleWebKitVersion = faker.datatype.number({ min: 530, max: 537 });
  return `Mozilla/5.0 (${os}) AppleWebKit/${appleWebKitVersion}.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.${chromeBuild}.${chromePatch} Safari/${appleWebKitVersion}.36`;
}

// Generate a Firefox user-agent string
function generateFirefoxUserAgent(os) {
  const firefoxVersion = faker.datatype.number({ min: 60, max: 100 });
  return `Mozilla/5.0 (${os}; rv:${firefoxVersion}.0) Gecko/20100101 Firefox/${firefoxVersion}.0`;
}

// Main function to generate a varied user-agent string
function generateUserAgent() {
  // Expanded OS options for more diversity
  const osOptions = [
    "Windows NT 10.0; Win64; x64",
    "Windows NT 6.1; Win64; x64",
    "Windows NT 6.3; Win64; x64",
    "Macintosh; Intel Mac OS X 10_15_7",
    "Macintosh; Intel Mac OS X 10_14_6",
    "Macintosh; Intel Mac OS X 11_2_3",
    "X11; Linux x86_64",
    "X11; Linux i686"
  ];
  const os = randomElement(osOptions);

  // Randomly choose between Chrome and Firefox
  const browsers = ['chrome', 'firefox'];
  const chosenBrowser = randomElement(browsers);

  if (chosenBrowser === 'chrome') {
    return generateChromeUserAgent(os);
  } else {
    return generateFirefoxUserAgent(os);
  }
}

async function main() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'number',
        name: 'count',
        message: 'How many user-agents do you want to generate?',
        validate: function (value) {
          if (isNaN(value) || value <= 0) {
            return 'Please enter a number greater than 0';
          }
          return true;
        }
      }
    ]);

    const count = answers.count;
    const userAgents = [];

    for (let i = 0; i < count; i++) {
      userAgents.push(generateUserAgent());
    }

    // Define the path to the helpers/agents.txt file
    const agentsFilePath = path.join(__dirname, '..', 'helpers', 'agents.txt');

    // Write the user-agents to the file, one per line.
    fs.writeFileSync(agentsFilePath, userAgents.join('\n'), 'utf8');
    console.log(colors.green(`Generated ${count} user-agents and saved them to ${agentsFilePath}`));
  } catch (error) {
    console.error(colors.red('Error generating user-agents:'), error);
  }
}

main();
