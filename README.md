# 🔮 Customer Churn Prediction Dashboard

A premium, interactive Single-Page Web Application (SPA) built with a **FastAPI** backend and a custom **HTML/CSS/JS** frontend (powered by **Chart.js**). This dashboard loads a pre-trained **Random Forest Classifier** model to identify customer churn risks, explore feature influences, and run batch predictions.

## 🚀 Live Demo & Deployment
You can deploy this decoupled application on cloud providers like **Render** or **Hugging Face Spaces**. See the [Deployment Guide](file:///c:/Users/priya/Downloads/Churn_Prediction-main/Churn_Prediction-main/deployment_guide.md) for full instructions.

---

## ✨ Features

### 1. 👤 Single Customer Prediction
* Input details such as credit score, country, age, balance, salary, and membership active status.
* View predictions using a gorgeous, dynamic **Circular Churn Risk Gauge**.
* View a risk categorization card (Low, Medium, High risk) with specific flags showing which details contribute to the risk.
* Generate **actionable retention recommendations** based on the customer's specific profile (e.g. re-engagement emails, cross-selling, fee waivers).

### 2. 📂 Batch CSV Analysis
* Upload large sheets (`.csv`) of customers to check churn probability in bulk.
* Instantly download a sample template CSV.
* Display high-level dashboard KPIs: **Average Churn Rate**, **Total Analyzed**, **Predicted Churns**, and **High-Risk Alerts**.
* Interactive analytics: View Churn Rate distributions by Country and Age Groups.
* Download the scored list of customers containing prediction labels, exact probabilities, and risk tiers.

### 3. 🧠 Model Insights & Simulation Sandbox
* **Feature Importances**: Explore what factors the Random Forest Classifier values most.
* **What-If Sandbox**: Run real-time interactive simulations by modifying key values on sliders to instantly observe how the churn risk changes.

---

## 🛠️ Setup & Local Installation

### Prerequisites
* Python 3.9 to 3.12 installed on your system.

### Steps
1. Clone this repository or open the project folder.
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI server locally:
   ```bash
   python -m uvicorn server:app --reload
   ```
4. Open your browser and navigate to `http://localhost:8000`.

---

## 📁 Repository Structure
```
├── static/
│   ├── index.html           # Main dashboard UI
│   ├── style.css            # Premium dark theme and layout rules
│   └── app.js               # Frontend AJAX logic and Chart.js integrations
├── server.py                # FastAPI backend server
├── churn_model.pkl          # Trained Random Forest model file (18MB)
├── requirements.txt         # Project package requirements
├── deployment_guide.md      # Deployment handbook for live hosting
└── README.md                # Project documentation (this file)
```

---

## 📊 Feature Reference List
The machine learning model uses the following features for calculation:
* `CreditScore` (350 - 850)
* `Geography` (France, Germany, Spain)
* `Gender` (Male, Female)
* `Age` (18 - 100)
* `Tenure` (0 - 10 years)
* `Balance` (Account balance in USD)
* `NumOfProducts` (1 to 4 products)
* `HasCrCard` (Whether the customer has a credit card)
* `IsActiveMember` (Whether the member is actively transacting)
* `EstimatedSalary` (Salary in USD)
