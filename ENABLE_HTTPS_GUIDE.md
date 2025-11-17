# Enable HTTPS on AWS EC2 - Complete Guide

## 🎯 What You Need to Do:

### Option 1: Automatic (Recommended) ⚡

1. **Connect to your EC2 instance** via AWS Console:
   - Go to AWS EC2 Console: https://console.aws.amazon.com/ec2
   - Select your instance
   - Click "Connect" button
   - Choose "Session Manager" or "EC2 Instance Connect"
   - Click "Connect" (opens browser terminal)

2. **Run these commands** in the terminal:
   ```bash
   cd whatsapp-ai-bot
   sudo bash enable-https.sh
   ```

3. **Done!** Your site will be available at `https://web.saksolution.com`

---

### Option 2: Manual Steps (If automatic fails)

#### Step 1: Open Port 443 in AWS Security Group

1. Go to **AWS EC2 Console**: https://console.aws.amazon.com/ec2
2. Click on your **EC2 instance**
3. Scroll down to **Security** tab
4. Click on the **Security Group** link (e.g., `sg-xxxxx`)
5. Click **Edit inbound rules**
6. Click **Add rule**
7. Configure:
   - **Type:** HTTPS
   - **Protocol:** TCP
   - **Port range:** 443
   - **Source:** 0.0.0.0/0 (Anywhere IPv4)
8. Click **Add rule** again for IPv6:
   - **Type:** HTTPS
   - **Protocol:** TCP
   - **Port range:** 443
   - **Source:** ::/0 (Anywhere IPv6)
9. Click **Save rules**

#### Step 2: Connect to EC2 and Install SSL

**Connect to EC2:**
- **Option A:** AWS Console → EC2 → Select instance → Connect → Session Manager
- **Option B:** SSH (if you have the key): `ssh -i your-key.pem ubuntu@13.62.57.240`

**Run these commands:**

```bash
# 1. Install Nginx and Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Create Nginx configuration
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

# 3. Enable the configuration
sudo ln -sf /etc/nginx/sites-available/whatsapp-ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 4. Get SSL certificate (this auto-configures HTTPS)
sudo certbot --nginx -d web.saksolution.com --non-interactive --agree-tos -m admin@saksolution.com --redirect

# 5. Verify
curl -I https://web.saksolution.com
```

---

## ✅ Verification

After setup, test these URLs:

1. **HTTP (should redirect to HTTPS):** http://web.saksolution.com
2. **HTTPS:** https://web.saksolution.com
3. **Login page:** https://web.saksolution.com/login.html
4. **Dashboard:** https://web.saksolution.com/dashboard.html

---

## 🔧 Troubleshooting

### If HTTPS doesn't work:

**1. Check if port 443 is open:**
```bash
# On your local computer (PowerShell)
Test-NetConnection -ComputerName web.saksolution.com -Port 443
```
Should show `TcpTestSucceeded : True`

**2. Check Nginx status:**
```bash
sudo systemctl status nginx
sudo nginx -t
```

**3. Check SSL certificate:**
```bash
sudo certbot certificates
```

**4. Check Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**5. Manually renew certificate:**
```bash
sudo certbot renew --dry-run
```

---

## 🔄 SSL Certificate Auto-Renewal

Let's Encrypt certificates expire after 90 days, but Certbot automatically renews them.

**Check auto-renewal is configured:**
```bash
sudo systemctl status certbot.timer
```

**Test renewal:**
```bash
sudo certbot renew --dry-run
```

---

## 📝 Quick Summary

**What this does:**
1. Opens port 443 (HTTPS) in AWS Security Group
2. Installs Nginx as reverse proxy
3. Gets free SSL certificate from Let's Encrypt
4. Configures automatic HTTPS redirect
5. Sets up auto-renewal for SSL certificate

**Result:**
- ✅ http://web.saksolution.com → redirects to HTTPS
- ✅ https://web.saksolution.com → works with SSL
- ✅ SSL certificate auto-renews every 90 days

---

## 🚀 Next Steps After HTTPS Setup

Once HTTPS is working:
1. Test login at: https://web.saksolution.com/login.html
2. Update any hardcoded HTTP URLs in your code to HTTPS
3. Share the secure link with users: https://web.saksolution.com

---

## ⚠️ Important Notes

- SSL certificates are FREE from Let's Encrypt
- They auto-renew every 90 days
- Port 443 MUST be open in AWS Security Group
- DNS must point to your server (already done ✅)
- If you change servers, you'll need to get a new certificate
