# Deploy WhatsApp Web to Hostinger VPS

## 🚀 Quick Setup (10 minutes)

### Step 1: Access Your Hostinger VPS

```bash
# SSH to your Hostinger VPS
ssh root@YOUR_VPS_IP
```

### Step 2: Clone & Deploy

```bash
# Clone repository
cd /opt
git clone https://github.com/qutubkothari/SAK-Whatsapp-AI-Sales-Assistant.git whatsapp-ai
cd whatsapp-ai

# Make script executable and run
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Step 3: Configure Environment

```bash
nano .env
```

Add your credentials:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Session Secret
SESSION_SECRET=your_random_secret_here

# Port
PORT=8080
```

Save: `Ctrl+X`, `Y`, `Enter`

### Step 4: Open Firewall Port

```bash
# Allow port 8080
ufw allow 8080
ufw status
```

### Step 5: Start Application

```bash
# Service starts automatically, or manually:
sudo systemctl start whatsapp-ai
sudo systemctl status whatsapp-ai
```

### Step 6: Access Dashboard

Open browser:
```
http://YOUR_VPS_IP:8080/dashboard
```

## 🔐 Setup Domain with SSL (Optional but Recommended)

### Point Domain to VPS
In Hostinger control panel:
1. Go to Domains → DNS/Nameservers
2. Add A record: `@` → `YOUR_VPS_IP`
3. Add A record: `www` → `YOUR_VPS_IP`

### Install Nginx & SSL

```bash
# Install Nginx
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/whatsapp-ai
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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
```

Enable & get SSL:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/whatsapp-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

Now access via: `https://yourdomain.com/dashboard`

## 📊 Service Management

```bash
# View logs
sudo journalctl -u whatsapp-ai -f

# Restart service
sudo systemctl restart whatsapp-ai

# Stop service
sudo systemctl stop whatsapp-ai

# Check status
sudo systemctl status whatsapp-ai
```

## 🔄 Update Application

```bash
cd /opt/whatsapp-ai
git pull
./deploy-vps.sh
```

## 🎯 Use WhatsApp Web

1. Login to dashboard: `http://YOUR_VPS_IP:8080/dashboard`
2. Go to **WhatsApp Web** tab
3. Click **Connect**
4. Wait 10-15 seconds for QR code
5. Scan with WhatsApp on your phone
6. Status changes to "Connected & Ready" ✅
7. Now you can send broadcasts via WhatsApp Web!

## 💡 Hostinger VPS Recommendations

**Minimum Requirements:**
- **VPS 1**: 1 vCPU, 4GB RAM, 50GB SSD (~$4-6/month)
- Works perfectly for WhatsApp Web

**Better Option:**
- **VPS 2**: 2 vCPU, 8GB RAM, 100GB SSD (~$8-10/month)
- Can handle multiple WhatsApp connections

## ✅ Why Hostinger is Perfect:

| Feature | Hostinger VPS | App Engine |
|---------|---------------|------------|
| Price | 💰 $4-10/month | 💰 $20-50/month |
| Puppeteer Support | ✅ Perfect | ❌ Fails |
| WhatsApp Web | ✅ Works | ❌ Doesn't work |
| Setup Time | ⏱️ 10 minutes | ⏱️ Hours of debugging |
| Control | ✅ Full root access | ❌ Limited |
| Sessions | ✅ Persist forever | ❌ Restart every deploy |

## 🆘 Troubleshooting

### Port 8080 not accessible?
```bash
# Check firewall
sudo ufw status
sudo ufw allow 8080

# Check service
sudo systemctl status whatsapp-ai
sudo journalctl -u whatsapp-ai -n 50
```

### Service won't start?
```bash
# Check .env file exists
ls -la /opt/whatsapp-ai/.env

# Check Node.js installed
node --version  # Should be v18 or higher

# Reinstall dependencies
cd /opt/whatsapp-ai
npm install
sudo systemctl restart whatsapp-ai
```

### QR code not appearing?
```bash
# Check Chromium installed
which chromium-browser

# Check logs for errors
sudo journalctl -u whatsapp-ai -f
# Should see: "[WA_WEB] Creating client without persistent auth"
```

## 🎉 Success Indicators

You know it's working when:
1. ✅ Service status shows "active (running)"
2. ✅ Dashboard loads at `http://YOUR_VPS_IP:8080/dashboard`
3. ✅ WhatsApp Web tab shows status card
4. ✅ Click Connect → QR code appears in 10-15 seconds
5. ✅ After scanning → Status becomes "Connected & Ready"
6. ✅ Green dot indicator shows online

---

**Need help?** Check logs: `sudo journalctl -u whatsapp-ai -f`
