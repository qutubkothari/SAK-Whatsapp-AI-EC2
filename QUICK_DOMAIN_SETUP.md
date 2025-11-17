# 🌐 Quick Domain Setup - WhatsApp AI

## What You Need
1. **Your domain name** (e.g., `whatsapp.sakstore.com` or `sakstore.com`)
2. **Access to DNS settings** (GoDaddy, Namecheap, Cloudflare, etc.)
3. **Your email** for SSL certificate notifications

## 3-Step Setup

### Step 1️⃣: Run Setup Script (2 minutes)

SSH into your server and run:

```bash
ssh -i ~/Downloads/whatsapp-ai-key.pem ubuntu@13.62.57.240

# Make script executable
chmod +x setup-domain.sh

# Run with YOUR domain and email
sudo ./setup-domain.sh YOUR-DOMAIN.com YOUR-EMAIL@domain.com
```

**Example:**
```bash
sudo ./setup-domain.sh whatsapp.sakstore.com admin@sakstore.com
```

### Step 2️⃣: Configure DNS (5-30 minutes)

1. **Log into your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Go to DNS settings**
3. **Add A Record:**

```
Type:  A
Name:  @ (for root) or whatsapp (for subdomain)
Value: 13.62.57.240
TTL:   300
```

**Wait 5-30 minutes for DNS to propagate**

### Step 3️⃣: Enable SSL (1 minute)

After DNS works, run:

```bash
# Check DNS first
dig YOUR-DOMAIN.com

# Get SSL certificate
sudo certbot --nginx -d YOUR-DOMAIN.com --non-interactive --agree-tos -m YOUR-EMAIL@domain.com

# Done! 🎉
```

## Verify It Works

```bash
# Check DNS
dig YOUR-DOMAIN.com
# Should show: 13.62.57.240

# Test HTTP
curl http://YOUR-DOMAIN.com

# Test HTTPS (after SSL)
curl https://YOUR-DOMAIN.com

# Open in browser
https://YOUR-DOMAIN.com
```

## After Setup

✅ Your dashboard: `https://YOUR-DOMAIN.com`
✅ Old IP still works: `http://13.62.57.240:8080`
✅ SSL auto-renews every 90 days
✅ All broadcasts continue working

## Common Issues

### "DNS not propagating"
**Wait longer** - Can take up to 24 hours, usually 5-30 minutes

### "Certbot fails"
1. Check DNS: `dig YOUR-DOMAIN.com` (should show 13.62.57.240)
2. Check Security Group allows port 80/443
3. Retry: `sudo certbot --nginx -d YOUR-DOMAIN.com`

### "Port 80/443 blocked"
**Fix AWS Security Group:**
1. Go to EC2 Console → Security Groups
2. Add inbound rules:
   - Port 80 (HTTP) from 0.0.0.0/0
   - Port 443 (HTTPS) from 0.0.0.0/0

## Need Help?

Full guide: See `DOMAIN_SETUP_GUIDE.md`

Your current setup:
- **IP:** 13.62.57.240
- **Port:** 8080
- **WhatsApp:** Connected (96567709452)
