#!/bin/bash
# Oracle Cloud VM Setup Script for WhatsApp Web
# This script installs all dependencies and deploys the application

set -e

echo "=================================="
echo "WhatsApp Web VM Setup - Oracle Cloud"
echo "=================================="

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js
echo "✅ Node.js version:"
node --version
npm --version

# Install Chrome dependencies
echo "📦 Installing Chrome dependencies..."
sudo apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils

# Install Google Chrome
echo "📦 Installing Google Chrome..."
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Verify Chrome
echo "✅ Chrome version:"
google-chrome --version

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git
echo "📦 Installing Git..."
sudo apt-get install -y git

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/whatsapp-bot
sudo chown -R $USER:$USER /opt/whatsapp-bot
cd /opt/whatsapp-bot

# Clone repository (you'll need to provide the repo URL)
echo "📥 Ready to clone repository..."
echo "Please run: git clone https://github.com/qutubkothari/SAK-Whatsapp-AI-Sales-Assistant.git ."

echo ""
echo "=================================="
echo "✅ System setup complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone https://github.com/qutubkothari/SAK-Whatsapp-AI-Sales-Assistant.git ."
echo "2. Create .env file with your environment variables"
echo "3. Run: npm install"
echo "4. Run: pm2 start index.js --name whatsapp-bot"
echo "5. Run: pm2 save"
echo "6. Run: pm2 startup (follow instructions)"
echo ""
