#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

const accountsFilePath = path.join(__dirname, '..', 'helpers', 'accounts.json');

function readAccounts() {
  try {
    const data = fs.readFileSync(accountsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeAccounts(accounts) {
  fs.writeFileSync(accountsFilePath, JSON.stringify(accounts, null, 2), 'utf8');
}

async function addAccount() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'username_or_email',
      message: 'Enter email or username:'
    },
    {
      type: 'input',
      name: 'password',
      message: 'Enter password:'
    }
  ]);

  const accounts = readAccounts();
  const newId = accounts.length > 0 ? Math.max(...accounts.map(acc => acc.id)) + 1 : 1;

  const newAccount = {
    id: newId,
    username_or_email: answers.username_or_email,
    password: answers.password
  };

  accounts.push(newAccount);
  writeAccounts(accounts);
  console.log(`Account added with id ${newId}`);
}

async function main() {
  let addMore = true;
  while (addMore) {
    await addAccount();
    const { shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldContinue',
        message: 'Do you want to add another account?',
        default: false
      }
    ]);
    addMore = shouldContinue;
  }
}

main();
