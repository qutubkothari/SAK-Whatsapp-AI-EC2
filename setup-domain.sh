#!/bin/bash

# Domain Setup Script for WhatsApp AI System
# This script sets up Nginx, SSL, and configures the domain

set -e

echo "============================================"
echo "WhatsApp AI - Domain Setup"
echo "============================================"
echo ""

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-domain.sh your-domain.com [email@example.com]"
    echo ""
    echo "Example:"
    echo "  ./setup-domain.sh whatsapp.mycompany.com admin@mycompany.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@${DOMAIN}"}
APP_PORT=8080

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "App Port: $APP_PORT"
echo ""

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update -y

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL certificates..."
sudo apt-get install -y certbot python3-certbot-nginx

# Stop Nginx temporarily
sudo systemctl stop nginx

# Create Nginx configuration
echo "⚙️  Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/whatsapp-ai > /dev/null <<EOF
# WhatsApp AI Application - Nginx Configuration
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Allow Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect HTTP to HTTPS (will be enabled after SSL setup)
    # location / {
    #     return 301 https://\$server_name\$request_uri;
    # }

    # Temporarily proxy to app (before SSL)
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeouts for long-polling/webhooks
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}

# HTTPS server (will be configured by Certbot)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name $DOMAIN;
#
#     # SSL certificates (managed by Certbot)
#     # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
#     # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
#
#     # SSL configuration
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_prefer_server_ciphers on;
#     ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#
#     # Security headers
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#     add_header X-Frame-Options "SAMEORIGIN" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#
#     # Proxy to Node.js application
#     location / {
#         proxy_pass http://localhost:$APP_PORT;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host \$host;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#         proxy_cache_bypass \$http_upgrade;
#         
#         # Increase timeouts
#         proxy_connect_timeout 300s;
#         proxy_send_timeout 300s;
#         proxy_read_timeout 300s;
#
#         # Client max body size for file uploads
#         client_max_body_size 50M;
#     }
#
#     # Optimize static file serving
#     location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
#         proxy_pass http://localhost:$APP_PORT;
#         expires 1y;
#         add_header Cache-Control "public, immutable";
#     }
# }
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/whatsapp-ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Start Nginx
echo "▶️  Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

echo ""
echo "============================================"
echo "✅ Basic Nginx setup complete!"
echo "============================================"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Configure your DNS:"
echo "   - Go to your domain registrar (GoDaddy, Namecheap, etc.)"
echo "   - Add an A record:"
echo "     Type: A"
echo "     Name: @ (or subdomain like 'whatsapp')"
echo "     Value: $(curl -s ifconfig.me)"
echo "     TTL: 300 (5 minutes)"
echo ""
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "   Check with: dig $DOMAIN"
echo ""
echo "3. Once DNS is working, obtain SSL certificate:"
echo "   sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL"
echo ""
echo "4. Test SSL renewal:"
echo "   sudo certbot renew --dry-run"
echo ""
echo "Your app is now accessible at:"
echo "  HTTP:  http://$DOMAIN"
echo "  HTTPS: https://$DOMAIN (after SSL setup)"
echo ""
echo "Current IP: $(curl -s ifconfig.me)"
echo "============================================"
