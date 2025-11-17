# 🔐 New Login System Setup Guide

## ✅ What's Changed

The WhatsApp AI Dashboard now has a **proper username/password login system** instead of the WhatsApp token-based login.

---

## 🌐 Access Your Dashboard

### **New Login URL:**
- **Domain:** https://web.saksolution.com/login.html (after DNS is set up)
- **IP:** http://13.62.57.240:8080/login.html

---

## 🔑 Default Login Credentials

### **Phone Number:** Your registered WhatsApp number
### **Password:** Your Business Name (by default)

**Example:**
- Phone: `96567709452`
- Password: `sak solutions store` (or whatever your business name is)

---

## 📋 How to Login

1. **Go to:** https://web.saksolution.com/login.html
2. **Enter your phone number** (e.g., 96567709452)
3. **Enter your password** (default is your business name)
4. **Click "Sign In"**

---

## 🔒 Change Your Password (Recommended)

After first login:

1. Go to **Settings** in the dashboard sidebar
2. Or visit: https://web.saksolution.com/change-password.html
3. Enter your **current password** (business name)
4. Enter your **new password** (at least 6 characters)
5. Confirm and save

---

## 🗄️ Database Setup Required

Run this SQL in your Supabase dashboard to enable the password system:

```sql
-- Add password column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Set default passwords (business name)
UPDATE tenants 
SET password = business_name 
WHERE password IS NULL;
```

**Steps:**
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Paste the SQL above
4. Click **Run**

---

## 📱 Login Flow

### Before:
1. WhatsApp → Get login link → Click link → Dashboard opens
2. **Problem:** Required WhatsApp, complex for users

### After:
1. Open https://web.saksolution.com/login.html
2. Enter phone + password
3. Dashboard opens
4. **Benefits:** Simple, standard login, no WhatsApp needed

---

## 🔧 Technical Details

### Files Created:
- ✅ `public/login.html` - Login page
- ✅ `public/change-password.html` - Password management
- ✅ `routes/api/auth.js` - Authentication API
- ✅ `migrations/add_password_to_tenants.sql` - Database migration

### API Endpoints:
- `POST /api/auth/login` - Login with phone + password
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Session Storage:
- Sessions stored in `localStorage` (client-side)
- No more token-based authentication
- Persistent login (stays logged in)

---

## 🎯 User Experience

### ✅ Improvements:
1. **No WhatsApp dependency** - Login from any device
2. **Standard login** - Familiar username/password
3. **Persistent sessions** - Stay logged in
4. **Mobile-friendly** - Works on all devices
5. **Secure** - Password-based authentication

### 🔄 Migration:
- Old WhatsApp token login: **Removed**
- New password login: **Active**
- All users get default password: **Business Name**

---

## 🆘 Troubleshooting

### "Invalid phone number or password"
**Solution:** 
- Check phone number format (no spaces/dashes)
- Default password is your business name (exact match)
- Run the SQL migration if not done yet

### "Dashboard stuck on loading"
**Solution:**
- Clear browser cache
- Go to login page: `/login.html`
- Enter credentials and login

### "Forgot password"
**Solution:**
- Default password is your **business name**
- Contact admin to reset if you changed it

---

## 📊 Current Status

- ✅ Login system deployed
- ✅ Auth API active
- ✅ Dashboard updated
- ⏳ SQL migration (you need to run)
- ⏳ DNS setup for domain

---

## 🚀 Quick Start

```bash
# 1. Run SQL migration in Supabase
# 2. Go to login page
https://web.saksolution.com/login.html

# 3. Login with:
Phone: [Your WhatsApp number]
Password: [Your business name]

# 4. Change password after first login
# 5. Done! 🎉
```

---

## 📞 Support

**Current Server:** http://13.62.57.240:8080
**Domain (pending DNS):** https://web.saksolution.com
**WhatsApp Status:** Connected (96567709452)

**Need help?** Check the server logs or contact support.
