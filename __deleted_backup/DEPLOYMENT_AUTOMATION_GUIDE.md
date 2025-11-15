# Automatic Deployment Setup Guide

This guide provides multiple options for automating deployment to Google App Engine.

## ⚡ Quick Options (Choose One)

### Option 1: Quick Deploy Script (EASIEST)
**Perfect for: Manual deployments with one command**

Simply run:
```powershell
.\deploy.ps1
```

That's it! The script will deploy your changes to Google Cloud.

---

### Option 2: Git Alias (SIMPLEST)
**Perfect for: Quick deployments after git commit**

Already set up! Just run:
```bash
git deploy
```

---

### Option 3: GitHub Actions (AUTOMATIC - RECOMMENDED)
**Perfect for: Automatic deployment when you push code**

#### Setup Steps:

1. **Create a Service Account Key** (one-time setup):
   ```powershell
   gcloud iam service-accounts create github-deployer --display-name="GitHub Deployer"
   
   gcloud projects add-iam-policy-binding sak-whatsapp-ai-sales-assist \
     --member="serviceAccount:github-deployer@sak-whatsapp-ai-sales-assist.iam.gserviceaccount.com" \
     --role="roles/appengine.appAdmin"
   
   gcloud projects add-iam-policy-binding sak-whatsapp-ai-sales-assist \
     --member="serviceAccount:github-deployer@sak-whatsapp-ai-sales-assist.iam.gserviceaccount.com" \
     --role="roles/storage.admin"
   
   gcloud projects add-iam-policy-binding sak-whatsapp-ai-sales-assist \
     --member="serviceAccount:github-deployer@sak-whatsapp-ai-sales-assist.iam.gserviceaccount.com" \
     --role="roles/cloudbuild.builds.editor"
   
   gcloud iam service-accounts keys create github-key.json \
     --iam-account=github-deployer@sak-whatsapp-ai-sales-assist.iam.gserviceaccount.com
   ```

2. **Add the key to GitHub Secrets**:
   - Go to: https://github.com/qutubkothari/SAK-Whatsapp-AI-Sales-Assistant/settings/secrets/actions
   - Click "New repository secret"
   - Name: `GCP_SA_KEY`
   - Value: Paste the contents of `github-key.json`
   - Click "Add secret"

3. **Push the workflow file**:
   ```powershell
   git add .github/workflows/deploy-to-gcp.yml
   git commit -m "Add automatic deployment workflow"
   git push origin main
   ```

4. **Done!** Now every time you push to main, it automatically deploys!

---

### Option 4: Pre-commit Hook (AUTOMATIC ON COMMIT)
**Perfect for: Deploy before every git commit**

⚠️ **Warning**: This deploys EVERY time you commit, which can be slow.

The hook is already created at `.git/hooks/pre-commit` but needs to be made executable:

```powershell
# On Windows with Git Bash:
chmod +x .git/hooks/pre-commit
```

Now every `git commit` will automatically deploy first!

To disable: `rm .git/hooks/pre-commit`

---

## 📋 Current Session Workflow

**For this session (when I make changes), I'll use:**

After each file change, I'll automatically run:
```powershell
.\deploy.ps1
```

This ensures:
- ✅ Every change is immediately deployed
- ✅ You can test right away
- ✅ No manual deployment needed

---

## 🎯 Recommended Setup

**For your workflow, I recommend:**

1. **Now**: I'll use `.\deploy.ps1` after each change I make
2. **Long-term**: Set up GitHub Actions (Option 3) for automatic deployment when you push code

---

## 🔧 Testing the Setup

Let's test the quick deploy script right now:

```powershell
.\deploy.ps1
```

If it works, you'll see:
```
🚀 Starting deployment to Google App Engine...
📦 Version: auto-deploy-20251015-075123
✅ Deployment successful!
🌐 URL: https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com
```

---

## 📝 Notes

- **GitHub Actions**: Best for team collaboration, automatic deployment
- **Quick Script**: Best for solo development, manual control
- **Git Alias**: Best for quick one-liner deployment
- **Pre-commit Hook**: Best if you want to force deployment before commit (can be slow)

Choose what works best for your workflow!
