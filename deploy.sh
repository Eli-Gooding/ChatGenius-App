#!/bin/bash

# Pull latest changes
git pull

# Install dependencies
npm install

# Build the application
npm run build

# Start the application with PM2
# If this is the first deployment
pm2 start npm --name "chatgenius" -- start

# If this is a redeployment
pm2 reload chatgenius

# Save PM2 process list
pm2 save

# Display status
pm2 status 