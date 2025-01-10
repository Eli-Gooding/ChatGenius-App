#!/bin/bash

# Install base dependencies
npm install

# Install UI and animation dependencies
npm install lucide-react @radix-ui/react-avatar @radix-ui/react-popover @radix-ui/react-scroll-area class-variance-authority tailwind-merge tailwindcss-animate

# Make the script executable
chmod +x setup.sh

echo "All dependencies have been installed successfully!" 