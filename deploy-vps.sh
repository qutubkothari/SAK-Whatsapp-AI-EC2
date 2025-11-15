#!/bin/bash
# Deploy WhatsApp AI Assistant to Oracle VM/VPS

echo "🚀 Deploying WhatsApp AI Assistant..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install dependencies for Puppeteer
echo "📥 Installing Puppeteer dependencies..."
sudo apt-get install -y \
    chromium-browser \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2

# Navigate to app directory
cd /opt/whatsapp-ai || exit

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install npm dependencies
echo "📦 Installing npm packages..."
npm install

# Create environment file if not exists
if [ ! -f .env ]; then
    echo "⚙️ Creating .env file..."
    cp .env.example .env
    echo "⚠️ Please update .env with your credentials"
fi

# Create systemd service
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/whatsapp-ai.service > /dev/null <<EOF
[Unit]
Description=WhatsApp AI Sales Assistant
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/whatsapp-ai
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
echo "🔄 Starting service..."
sudo systemctl enable whatsapp-ai
sudo systemctl restart whatsapp-ai

# Check status
echo "✅ Deployment complete!"
echo "📊 Service status:"
sudo systemctl status whatsapp-ai --no-pager

echo ""
echo "🌐 Access your dashboard at: http://YOUR_VM_IP:8080/dashboard"
echo "📝 View logs: sudo journalctl -u whatsapp-ai -f"
