#!/bin/bash

# Create Nginx configuration
cat > /tmp/whatsapp-ai-nginx << 'EOF'
server {
    listen 80;
    server_name web.saksolution.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Move to sites-available
sudo mv /tmp/whatsapp-ai-nginx /etc/nginx/sites-available/whatsapp-ai

# Enable site
sudo ln -sf /etc/nginx/sites-available/whatsapp-ai /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d web.saksolution.com --non-interactive --agree-tos --email admin@saksolution.com --redirect

echo ""
echo "=========================================="
echo "HTTPS Setup Complete!"
echo "=========================================="
echo ""
echo "Your site is now available at:"
echo "https://web.saksolution.com"
echo ""
echo "SSL certificate will auto-renew every 90 days"
echo ""
