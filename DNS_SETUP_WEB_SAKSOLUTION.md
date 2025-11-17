# 🎯 DNS Setup for web.saksolution.com

## ✅ Server Setup Complete!
- Nginx installed and running
- Configuration ready for web.saksolution.com
- Waiting for DNS to point to: **13.62.57.240**

---

## 🌐 Step 1: Configure DNS (Do this NOW)

### Go to your domain registrar
(Where you registered saksolution.com - GoDaddy, Namecheap, Cloudflare, etc.)

### Add an A Record:

```
Type:  A
Name:  web
Value: 13.62.57.240
TTL:   300 (or 5 minutes)
```

### Visual Guide:

**For GoDaddy:**
1. Log in → My Products → DNS
2. Click "Add" under Records
3. Select Type: A
4. Name: `web`
5. Value: `13.62.57.240`
6. TTL: 5 minutes
7. Click Save

**For Namecheap:**
1. Dashboard → Domain List → Manage
2. Advanced DNS tab
3. Add New Record
4. Type: A Record
5. Host: `web`
6. Value: `13.62.57.240`
7. TTL: 5 min
8. Save

**For Cloudflare:**
1. Select your domain
2. DNS → Records → Add record
3. Type: A
4. Name: `web`
5. IPv4 address: `13.62.57.240`
6. Proxy status: DNS only (gray cloud)
7. TTL: Auto
8. Save

---

## ⏱️ Step 2: Wait for DNS Propagation (5-30 minutes)

Check if DNS is working:

### On Windows (PowerShell):
```powershell
nslookup web.saksolution.com
# Should show: 13.62.57.240
```

### Online checker:
https://dnschecker.org/#A/web.saksolution.com

When you see `13.62.57.240` in the results, proceed to Step 3!

---

## 🔒 Step 3: Enable SSL Certificate (After DNS works)

Once DNS propagation is complete, run:

```bash
ssh -i ~/Downloads/whatsapp-ai-key.pem ubuntu@13.62.57.240

sudo certbot --nginx -d web.saksolution.com --non-interactive --agree-tos -m admin@saksolution.com
```

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/web.saksolution.com/fullchain.pem
Deploying certificate
Successfully deployed certificate for web.saksolution.com to /etc/nginx/sites-enabled/whatsapp-ai
Congratulations! You have successfully enabled HTTPS on https://web.saksolution.com
```

---

## ✅ Verify It's Working

### Test DNS:
```powershell
nslookup web.saksolution.com
```

### Test HTTP (before SSL):
```powershell
curl http://web.saksolution.com
```

### Test HTTPS (after SSL):
```powershell
curl https://web.saksolution.com
```

### Open in Browser:
- **Before SSL:** http://web.saksolution.com
- **After SSL:** https://web.saksolution.com ✨

---

## 🎉 After Setup

Your dashboard will be accessible at:
- **New URL:** https://web.saksolution.com
- **Old URL still works:** http://13.62.57.240:8080

Both will continue working simultaneously!

---

## 🚨 Troubleshooting

### DNS not propagating?
**Solution:** Wait longer (can take up to 24 hours, usually 5-30 minutes)

### Certbot fails with "Connection refused"?
**Solution:** DNS not propagated yet. Wait and retry.

### Port 80/443 blocked?
**Check AWS Security Group:**
```
Go to EC2 Console → Security Groups
Ensure these inbound rules exist:
- Port 80 (HTTP) from 0.0.0.0/0
- Port 443 (HTTPS) from 0.0.0.0/0
```

### Still not working?
**Check Nginx status:**
```bash
ssh -i ~/Downloads/whatsapp-ai-key.pem ubuntu@13.62.57.240
sudo systemctl status nginx
sudo nginx -t
```

---

## 📞 Current Status

- ✅ Server IP: 13.62.57.240
- ✅ App Port: 8080
- ✅ Nginx: Running
- ✅ Configuration: web.saksolution.com
- ⏳ DNS: **Waiting for you to configure**
- ⏳ SSL: **Will configure after DNS**

---

## ⏭️ What to Do Right Now

1. **Go to your domain registrar** (where you manage saksolution.com)
2. **Add the A record** as shown above
3. **Wait 5-30 minutes** for DNS to propagate
4. **Check DNS** with: `nslookup web.saksolution.com`
5. **When DNS works, enable SSL** with the certbot command above
6. **Done!** Access at https://web.saksolution.com
