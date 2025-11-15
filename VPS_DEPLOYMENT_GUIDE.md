# WhatsApp Web on VPS - Quick Setup Guide

## Why VPS is Best for WhatsApp Web:
✅ Full Puppeteer support (no restrictions)
✅ Persistent sessions (no container restarts)
✅ More control over resources
✅ Cost-effective (Oracle free tier available)
✅ WhatsApp Web works perfectly

## Quick Deploy to Your Oracle VM:

### 1. SSH to Your VM
```bash
ssh ubuntu@YOUR_VM_IP
```

### 2. Clone Repository (First Time Only)
```bash
sudo mkdir -p /opt/whatsapp-ai
sudo chown $USER:$USER /opt/whatsapp-ai
cd /opt
git clone https://github.com/qutubkothari/SAK-Whatsapp-AI-Sales-Assistant.git whatsapp-ai
cd whatsapp-ai
```

### 3. Run Deployment Script
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### 4. Configure Environment
```bash
nano .env
# Add your Supabase, OpenAI, etc. credentials
```

### 5. Open Port 8080
```bash
# Oracle Cloud: Add ingress rule in Security List
# Firewall:
sudo ufw allow 8080
```

### 6. Access Dashboard
```
http://YOUR_VM_IP:8080/dashboard
```

## Service Management:

```bash
# Start service
sudo systemctl start whatsapp-ai

# Stop service
sudo systemctl stop whatsapp-ai

# Restart service
sudo systemctl restart whatsapp-ai

# View logs
sudo journalctl -u whatsapp-ai -f

# Check status
sudo systemctl status whatsapp-ai
```

## Update & Redeploy:

```bash
cd /opt/whatsapp-ai
./deploy-vps.sh
```

## Benefits vs Cloud Run/App Engine:

| Feature | VPS | App Engine | Cloud Run |
|---------|-----|------------|-----------|
| Puppeteer Support | ✅ Perfect | ❌ Limited | ⚠️ Complex |
| Session Persistence | ✅ Yes | ❌ No | ❌ No |
| Cost | 💰 $0-10/mo | 💰 $20-50/mo | 💰 $15-30/mo |
| Setup Complexity | ⭐⭐ Medium | ⭐ Easy | ⭐⭐⭐ Hard |
| WhatsApp Web | ✅ Works | ❌ Fails | ⚠️ Unreliable |

## Recommendation:
**Use your Oracle VM** - it's free, reliable, and perfect for WhatsApp Web!

Your existing system stays on App Engine, WhatsApp Web runs on VPS.
