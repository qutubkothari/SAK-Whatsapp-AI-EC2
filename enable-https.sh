#!/bin/bash
# Enable HTTPS (Port 443) and Setup SSL for web.saksolution.com

echo "============================================"
echo "Setting up HTTPS for web.saksolution.com"
echo "============================================"

DOMAIN="web.saksolution.com"
EMAIL="admin@saksolution.com"

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo bash $0"
    exit 1
fi

# Step 1: Install Nginx and Certbot
echo ""
echo "Step 1: Installing Nginx and Certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# Step 2: Check if app is running
echo ""
echo "Step 2: Checking if WhatsApp AI service is running..."
systemctl status whatsapp-ai --no-pager | head -5

# Step 3: Create Nginx configuration
echo ""
echo "Step 3: Creating Nginx configuration..."
cat > /etc/nginx/sites-available/whatsapp-ai << 'EOF'
server {
    listen 80;
    server_name web.saksolution.com;

    # Redirect HTTP to HTTPS (will be added after SSL setup)
    # This config allows HTTP for now, will be updated by certbot

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

# Step 4: Enable the configuration
echo ""
echo "Step 4: Enabling Nginx configuration..."
ln -sf /etc/nginx/sites-available/whatsapp-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

# Step 5: Restart Nginx
echo ""
echo "Step 5: Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

# Check Nginx status
systemctl status nginx --no-pager | head -5

# Step 6: Get SSL Certificate
echo ""
echo "Step 6: Getting SSL certificate from Let's Encrypt..."
echo "This will automatically configure HTTPS..."

certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL Certificate installed successfully!"
    echo "✅ HTTPS is now enabled!"
else
    echo ""
    echo "⚠️ SSL certificate installation had issues."
    echo "You may need to manually configure it or check DNS settings."
fi

# Step 7: Test the configuration
echo ""
echo "Step 7: Testing HTTPS access..."
sleep 2

curl -I https://$DOMAIN 2>&1 | head -5

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "✅ HTTP: http://$DOMAIN"
echo "✅ HTTPS: https://$DOMAIN"
echo ""
echo "Your site should now be accessible via HTTPS!"
echo ""
echo "Note: If HTTPS doesn't work, make sure port 443 is open"
echo "in your AWS EC2 Security Group."
echo ""
echo "To check SSL renewal (auto-renews every 90 days):"
echo "  sudo certbot renew --dry-run"
echo ""
