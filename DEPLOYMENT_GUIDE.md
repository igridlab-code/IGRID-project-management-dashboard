# 🚀 IGRID Project Management Dashboard - Production Cloud Deployment Guide

This guide walks you through deploying the **IGRID Innovation Lab Management Dashboard** to a cloud platform so that it remains online 24/7 with zero dependency on your local computer or WiFi.

---

## 🌟 Why Render? (Recommended Choice)
- **Free Tier Available**: Includes free hosting for Node.js Web Services.
- **Unified Monolith**: Deploys both the frontend UI and the REST API from this single repository with zero CORS issues.
- **Automatic SSL (HTTPS)**: Provides a free permanent https://<your-app>.onrender.com domain.
- **Automatic GitHub Deploys**: Every git push automatically rebuilds and redeploys your live app.

---

## 📋 Step-by-Step Deployment on Render

### Step 1: Push Code to GitHub
Ensure all your latest changes are pushed to your GitHub repository:
\\\ash
git add .
git commit -m "feat: Prepare for production cloud deployment"
git push origin main
\\\

---

### Step 2: Create a Free Account on Render
1. Go to [https://render.com](https://render.com).
2. Click **Sign Up** (Sign in with your **GitHub** account for instant integration).

---

### Step 3: Create a New Web Service
1. On your Render Dashboard, click **New +** in the top right and select **Web Service**.
2. Select **Build and deploy from a Git repository**.
3. Connect your GitHub account and select your repository: \IGRID-project-management-dashboard\.
4. Configure the service settings:
   - **Name**: \igrid-project-management-dashboard\ (or your preferred name)
   - **Region**: Closest to your users (e.g. *Singapore*, *Oregon*, or *Frankfurt*)
   - **Branch**: \main\
   - **Root Directory**: *(leave blank / default)*
   - **Runtime**: \Node\
   - **Build Command**: \
pm install && npm run build\
   - **Start Command**: \
pm start\
   - **Instance Type**: **Free**

---

### Step 4: Add Environment Variables
Under the **Environment Variables** section in Render, add the following key-value pairs:

| Key | Value | Description |
| :--- | :--- | :--- |
| \NODE_ENV\ | \production\ | Enables production optimizations |
| \ENABLE_NGROK\ | \alse\ | Disables local ngrok tunneling |
| \JWT_SECRET\ | *(Generate a 32+ character random string)* | Encrypts session tokens |
| \ADMIN_EMAIL\ | \dmin@igridlab.edu.in\ | Default administrator email |
| \ADMIN_DEFAULT_PASSWORD\ | \Admin@123\ | Default administrator password |
| \PORT\ | \3000\ | *(Render assigns this automatically, but setting 3000 is good)* |

*(Optional)* If using Claude AI Chatbot:
- \ANTHROPIC_API_KEY\: \sk-ant-...\

---

### Step 5: Deploy & Get Your Permanent URL
1. Click **Create Web Service**.
2. Render will pull the code, install dependencies, run the build check, and start the server.
3. Once the deployment status turns green (**Live**), your permanent URL will be displayed at the top:
   \\\
   https://igrid-project-management-dashboard.onrender.com
   \\\

---

## 🔒 Step 6: Update Google OAuth Console (If using Google Sign-In)

If you use Google OAuth:
1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials).
2. Select your OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, add:
   - \https://igrid-project-management-dashboard.onrender.com\
4. Under **Authorized redirect URIs**, add:
   - \https://igrid-project-management-dashboard.onrender.com/api/auth/google/callback\
   - \https://igrid-project-management-dashboard.onrender.com/login\
5. Click **Save**.

---

## 🧪 Step 7: Verification & Testing Checklist

Once live on your production domain:
- [ ] Visit \https://<your-app>.onrender.com\ → Ensure the dashboard loads immediately.
- [ ] Log in with **Admin** credentials: \dmin@igridlab.edu.in\ / \Admin@123\.
- [ ] Verify that all **20 projects** appear under Board and **Batch Hub** (Batches 1–4).
- [ ] Verify that the **Student Teams** directory displays the 76 official students.
- [ ] Test adding/editing a task or project to confirm database persistence.

---

## 🚂 Alternative: Deploy on Railway
If you prefer Railway:
1. Go to [https://railway.app](https://railway.app) and click **Start a New Project**.
2. Select **Deploy from GitHub repo** and choose \IGRID-project-management-dashboard\.
3. Add the environment variables from Step 4 in Railway's **Variables** tab.
4. Click **Deploy**. Railway will generate a permanent \*.up.railway.app\ domain.
