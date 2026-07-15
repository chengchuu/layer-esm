#!/bin/bash
set -e

nvm use 22.21.1
npm i --registry=https://registry.npmjs.org
npm run release
