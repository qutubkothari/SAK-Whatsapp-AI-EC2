# Oracle Cloud VM Setup Guide for WhatsApp Web

## Prerequisites
- ✅ Oracle Cloud account created
- ✅ Credit card verified (won't be charged)
- ✅ Logged into Oracle Cloud Console

## Step 1: Create Compute Instance (VM)

### In Oracle Cloud Console:

1. **Navigate to Compute Instances**
   - Click ☰ (hamburger menu) → Compute → Instances

2. **Create Instance**
   - Click "Create Instance"
   - Name: `whatsapp-bot-vm`

3. **Choose Image and Shape**
   - Image: **Ubuntu 22.04** (Canonical Ubuntu)
   - Shape: Click "Change Shape"
     - **Ampere (ARM)** → VM.Standard.A1.Flex
     - OCPUs: **2** (or up to 4 if available)
     - Memory: **12 GB** (or up to 24 GB if available)
     - This is **FREE forever**! ⭐

4. **Networking**
   - Create new VCN: Yes (keep default)
   - Public IP: **Assign public IPv4 address** ✅

5. **Add SSH Keys**
   - Generate SSH key pair (download both private and public keys)
   - **IMPORTANT: Save the private key file!** You'll need it to connect

6. **Boot Volume**
   - Keep default (50 GB is free)

7. **Click "Create"**
   - Wait 2-3 minutes for provisioning

## Step 2: Configure Firewall Rules

### Open Required Ports:

1. **In your Instance details page:**
   - Click on the VCN name (under "Primary VNIC")
   - Click on the subnet
   - Click "Default Security List for [vcn-name]"

2. **Add Ingress Rules:**
   - Click "Add Ingress Rules"
   
   **Rule 1 - HTTP:**
   - Source CIDR: `0.0.0.0/0`
   - Destination Port: `80`
   - Description: HTTP
   
   **Rule 2 - HTTPS:**
   - Source CIDR: `0.0.0.0/0`
   - Destination Port: `443`
   - Description: HTTPS
   
   **Rule 3 - App Port:**
   - Source CIDR: `0.0.0.0/0`
   - Destination Port: `8080`
   - Description: WhatsApp Bot

## Step 3: Connect to VM

### On Your Windows Machine:

```powershell
# Convert Oracle's key to proper format (if needed)
# Save your private key as C:\Users\musta\.ssh\oracle-vm-key

# Connect via SSH
ssh -i C:\Users\musta\.ssh\oracle-vm-key ubuntu@<YOUR_VM_PUBLIC_IP>
```

**Your VM Public IP** is shown in the Instance details page.

## Step 4: Run Setup Script

### Once connected to VM via SSH:

```bash
# Download setup script
wget https://raw.githubusercontent.com/qutubkothari/SAK-Whatsapp-AI-Sales-Assistant/main/setup-oracle-vm.sh

# Make executable
chmod +x setup-oracle-vm.sh

# Run setup
./setup-oracle-vm.sh
```

This installs:
- ✅ Node.js 20
- ✅ Google Chrome
- ✅ PM2 (process manager)
- ✅ All dependencies

## Step 5: Deploy Application

```bash
# Navigate to app directory
cd /opt/whatsapp-bot

# Clone repository
git clone https://github.com/qutubkothari/SAK-Whatsapp-AI-Sales-Assistant.git .

# Create .env file
nano .env
```

### Copy your .env contents:
```bash
# Paste all your environment variables from local .env
# Make sure to set:
USE_WHATSAPP_WEB=true
NODE_ENV=production
PORT=8080

# Save: Ctrl+O, Enter, Ctrl+X
```

### Install and start:
```bash
# Install dependencies
npm install

# Start with PM2
pm2 start index.js --name whatsapp-bot

# Save PM2 process list
pm2 save

# Enable PM2 startup on boot
pm2 startup
# Run the command it shows you (starts with 'sudo env...')

# Check status
pm2 status
pm2 logs whatsapp-bot
```

## Step 6: Test WhatsApp Web

### Access your bot:
```
http://<YOUR_VM_PUBLIC_IP>:8080/health
http://<YOUR_VM_PUBLIC_IP>:8080/whatsapp-setup.html
```

### Initialize WhatsApp Web:
1. Open `/whatsapp-setup.html`
2. Select your tenant
3. Click "Connect WhatsApp Web"
4. Scan QR code with WhatsApp mobile app
5. ✅ Connected!

## Step 7: Setup Domain (Optional)

### Point your domain to VM:
1. Get VM public IP
2. Create A record: `whatsapp.yourdomain.com` → `<VM_IP>`
3. Install Nginx as reverse proxy
4. Setup SSL with Let's Encrypt (free)

## Monitoring & Management

### Useful PM2 Commands:
```bash
pm2 status              # Check status
pm2 logs whatsapp-bot   # View logs
pm2 restart whatsapp-bot # Restart app
pm2 stop whatsapp-bot   # Stop app
pm2 delete whatsapp-bot # Remove from PM2
```

### View Chrome processes:
```bash
ps aux | grep chrome    # See Chrome instances
top                     # Monitor CPU/RAM usage
```

## Troubleshooting

### If Chrome fails to start:
```bash
# Check if Chrome is installed
google-chrome --version

# Test Chrome headless
google-chrome --headless --disable-gpu --dump-dom https://google.com
```

### If app crashes:
```bash
# Check logs
pm2 logs whatsapp-bot --lines 100

# Restart
pm2 restart whatsapp-bot
```

## Cost Breakdown

| Resource | Allocation | Monthly Cost |
|----------|-----------|--------------|
| VM (Ampere A1) | 4 OCPU, 24GB RAM | **$0.00** |
| Boot Volume | 50 GB | **$0.00** |
| Network Egress | 10 TB/month | **$0.00** |
| **TOTAL** | | **$0.00** |

**FREE FOREVER!** 🎉

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs whatsapp-bot`
2. Check system resources: `free -h` and `df -h`
3. Verify Chrome: `google-chrome --version`
4. Check firewall: `sudo iptables -L`

## Next Steps After Setup

1. ✅ Update DNS records (if using custom domain)
2. ✅ Setup SSL certificate (Let's Encrypt)
3. ✅ Configure automatic backups
4. ✅ Setup monitoring alerts
5. ✅ Migrate all tenants from Maytapi to WhatsApp Web

---

**Estimated Setup Time:** 30-45 minutes  
**Monthly Cost:** $0  
**Savings vs Maytapi (10 tenants):** $990/month = $11,880/year 💰
