# Fix Domain Access - web.saksolution.com

## Current Status:
✅ DNS is working: `web.saksolution.com` resolves to `13.62.57.240`
✅ Port 80 (HTTP) is open
❌ Port 443 (HTTPS) is not configured yet
❌ Nginx might not be configured properly

## Quick Fix Steps:

### Option 1: Access via HTTP (Works Now!)
Try: **http://web.saksolution.com** (not https)

The site should work on HTTP without SSL.

### Option 2: Set Up HTTPS with SSL Certificate

You need to SSH into your EC2 server and run these commands:

```bash
# SSH into server (use EC2 console if SSH key is not configured)
ssh ubuntu@13.62.57.240

# Run the domain setup script
cd ~/whatsapp-ai-bot
sudo bash setup-domain.sh web.saksolution.com

# Or manually configure Nginx + SSL:
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/whatsapp-ai << 'EOF'
server {
    listen 80;
    server_name web.saksolution.com;

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
    }
}
EOF

# Enable the config
sudo ln -sf /etc/nginx/sites-available/whatsapp-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate (HTTPS)
sudo certbot --nginx -d web.saksolution.com --non-interactive --agree-tos -m admin@saksolution.com
```

## Firewall Check:

Make sure these ports are open in AWS EC2 Security Group:
- Port 80 (HTTP) ✅
- Port 443 (HTTPS) - **Needs to be opened**
- Port 8080 (App) - Can be internal only

### Open Port 443 in AWS:
1. Go to AWS EC2 Console
2. Select your instance
3. Click on Security Group
4. Edit Inbound Rules
5. Add Rule:
   - Type: HTTPS
   - Port: 443
   - Source: 0.0.0.0/0 (Anywhere)
6. Save

## Test After Setup:

```bash
# Test HTTP
curl http://web.saksolution.com

# Test HTTPS (after SSL setup)
curl https://web.saksolution.com

# Check Nginx status
sudo systemctl status nginx

# Check app status
sudo systemctl status whatsapp-ai
```

## Troubleshooting:

### If HTTP doesn't work:
```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check if app is running
sudo systemctl status whatsapp-ai

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check if port 8080 is listening
sudo netstat -tlnp | grep 8080
```

### If you can't SSH:
Use AWS EC2 Console → Connect → Session Manager (browser-based terminal)

## Quick Test (No SSH Needed):

Try these URLs in your browser:
1. http://13.62.57.240:8080 (Direct app access)
2. http://web.saksolution.com (via Nginx)
3. https://web.saksolution.com (SSL - won't work until configured)
