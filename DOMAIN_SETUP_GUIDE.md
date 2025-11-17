# Domain Setup Guide for WhatsApp AI System

## Prerequisites
- Your domain name (e.g., `whatsapp.yourdomain.com`)
- Access to your domain's DNS settings
- Email address for SSL certificate notifications

## Quick Setup (3 Steps)

### Step 1: Run the Setup Script

```bash
# Upload and run the domain setup script
ssh -i ~/Downloads/whatsapp-ai-key.pem ubuntu@13.62.57.240

# Download the script
wget https://raw.githubusercontent.com/qutubkothari/SAK-Whatsapp-AI-EC2/main/setup-domain.sh
# OR copy it manually

chmod +x setup-domain.sh
sudo ./setup-domain.sh your-domain.com your-email@domain.com
```

**Example:**
```bash
sudo ./setup-domain.sh whatsapp.sakstore.com admin@sakstore.com
```

### Step 2: Configure DNS

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add:

**A Record:**
- **Type:** A
- **Name:** `@` (for root domain) or `whatsapp` (for subdomain)
- **Value:** `13.62.57.240` (your EC2 IP)
- **TTL:** 300 (5 minutes)

**Example configurations:**

#### For root domain (yourdomain.com):
```
Type: A
Name: @
Value: 13.62.57.240
TTL: 300
```

#### For subdomain (whatsapp.yourdomain.com):
```
Type: A
Name: whatsapp
Value: 13.62.57.240
TTL: 300
```

### Step 3: Enable SSL (After DNS Propagation)

Wait 5-30 minutes for DNS to propagate, then:

```bash
# Check if DNS is working
dig your-domain.com
# Should show your EC2 IP: 13.62.57.240

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos -m your-email@domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Verification

### Check DNS Propagation
```bash
# Linux/Mac
dig your-domain.com

# Windows PowerShell
nslookup your-domain.com

# Online tools
https://dnschecker.org
```

### Test Your Domain
```bash
# HTTP (before SSL)
curl http://your-domain.com

# HTTPS (after SSL)
curl https://your-domain.com
```

### Access Your Dashboard
- **HTTP:** `http://your-domain.com`
- **HTTPS:** `https://your-domain.com` (after SSL)

## Troubleshooting

### DNS Not Propagating
```bash
# Check current DNS
dig your-domain.com +short

# Should return: 13.62.57.240
```
**Solution:** Wait longer (up to 24 hours) or flush DNS cache

### Nginx Not Starting
```bash
# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

### SSL Certificate Fails
```bash
# Common issues:
# 1. DNS not propagated - wait longer
# 2. Port 80 blocked - check AWS Security Group
# 3. Domain not pointing to server

# Check if domain resolves to your IP
dig your-domain.com +short
# Should show: 13.62.57.240

# Retry SSL
sudo certbot --nginx -d your-domain.com -m your-email@domain.com
```

### AWS Security Group Settings

Ensure these ports are open in your EC2 Security Group:

```
Type        Protocol    Port Range    Source
HTTP        TCP         80            0.0.0.0/0
HTTPS       TCP         443           0.0.0.0/0
Custom TCP  TCP         8080          0.0.0.0/0 (optional, can close after Nginx)
SSH         TCP         22            Your-IP/32
```

## Manual Nginx Configuration (Alternative)

If the script doesn't work, configure manually:

### 1. Install Nginx
```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### 2. Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/whatsapp-ai
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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
        
        client_max_body_size 50M;
    }
}
```

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-ai /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Get SSL
```bash
sudo certbot --nginx -d your-domain.com -m your-email@domain.com
```

## Post-Setup

### Update Application URLs
After domain is live, update any hardcoded URLs in your app:
- Webhook URLs (if using external services)
- CORS origins (if restricted)
- Email templates with links

### Monitor SSL Certificate
Certbot auto-renews certificates. Verify with:
```bash
sudo certbot renew --dry-run
```

### Check Logs
```bash
# Application logs
sudo journalctl -u whatsapp-ai.service -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Using Subdomain vs Root Domain

### Root Domain (yourdomain.com)
- DNS: `A @ 13.62.57.240`
- SSL: `sudo certbot --nginx -d yourdomain.com`
- Access: `https://yourdomain.com`

### Subdomain (whatsapp.yourdomain.com)
- DNS: `A whatsapp 13.62.57.240`
- SSL: `sudo certbot --nginx -d whatsapp.yourdomain.com`
- Access: `https://whatsapp.yourdomain.com`

### Multiple Domains
```bash
# Add multiple domains to same server
sudo certbot --nginx -d domain1.com -d www.domain1.com -d domain2.com
```

## Need Help?

**Common Questions:**

1. **How long does DNS take?** - Usually 5-30 minutes, max 48 hours
2. **Can I use Cloudflare?** - Yes! Point A record to 13.62.57.240
3. **Do I need to change app code?** - No, Nginx handles routing
4. **Can I keep IP access?** - Yes, both work simultaneously

**Your current IP:** `13.62.57.240`
**Your current port:** `8080`

Once domain is set up:
- Old: `http://13.62.57.240:8080` ✅ Still works
- New: `https://your-domain.com` ✅ Also works
