# Churn Prediction App - Deployment Guide 🚀

This handbook outlines step-by-step methods to host your FastAPI + HTML/CSS/JS customer churn prediction application on a live, public URL.

---

## Method 1: Render (Recommended & Easiest for FastAPI)
Render is a cloud platform that makes it extremely simple to deploy Python web applications for free.

### Step 1: Upload Project to GitHub
1. Create a new repository on GitHub (e.g., `churn-prediction-portal`).
2. Run these commands in your local directory (or upload files manually to GitHub):
   ```bash
   git init
   git add .
   git commit -m "Initialize FastAPI app"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
   git push -u origin main
   ```
   *(Note: Ensure `churn_model.pkl` is pushed. Since it is ~18MB, standard git commands will push it easily without needing Git LFS, as GitHub's limit is 100MB per file).*

### Step 2: Deploy to Render
1. Log in or sign up at [render.com](https://render.com/).
2. Click **New +** in the top right and select **Web Service**.
3. Connect your GitHub repository.
4. Configure your Web Service:
   - **Name**: `churn-prediction-portal`
   - **Environment**: `Python`
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Select the **Free Instance Type**.
6. Click **Deploy Web Service**.
7. Render will automatically build the service and host it at `https://YOUR_APP_NAME.onrender.com/`.

---

## Method 2: Hugging Face Spaces (Free & Reliable)
Hugging Face offers free hosting for ML applications using Docker.

### Step 1: Create a Space
1. Log in or sign up at [huggingface.co](https://huggingface.co/).
2. Click on **Spaces** in the header, then click **Create new Space**.
3. Configure your Space:
   - **Space Name**: `churn-prediction-portal`
   - **SDK**: **Docker**
   - **Template**: **Blank**
   - **Hardware**: **CPU Basic (Free)**
   - **Visibility**: **Public**
4. Click **Create Space**.

### Step 2: Create a Dockerfile
Create a file named `Dockerfile` (no file extension) in your repository root with the following content:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860

ENTRYPOINT ["python", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
```

### Step 3: Upload Files
Upload all files (including the `Dockerfile`, `server.py`, `churn_model.pkl`, `requirements.txt`, and the `static` folder) to your Space. You can do this by dragging and dropping them into the Hugging Face web UI on the **Files** tab, or via Git.
Hugging Face will automatically build the Docker container and start your FastAPI service.

---

## Method 3: Deploy via Docker (General Cloud Hosting)
For VPS providers (DigitalOcean, AWS, GCP, etc.), you can run the app inside a Docker container.

### Step 1: Build the Image
```bash
docker build -t churn-prediction-app .
```

### Step 2: Run the Container
```bash
docker run -d -p 8000:8000 churn-prediction-app
```
Your app will be accessible at `http://your-server-ip:8000`.
