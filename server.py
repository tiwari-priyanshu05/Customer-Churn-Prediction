import os
import io
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

app = FastAPI(title="Churn Prediction API", version="2.0")

# Load model
try:
    model = joblib.load("churn_model.pkl")
except Exception as e:
    print(f"Error loading churn_model.pkl: {e}")
    model = None

# Single Prediction Request Model
class CustomerProfile(BaseModel):
    CreditScore: int
    Geography: str
    Gender: str
    Age: int
    Tenure: int
    Balance: float
    NumOfProducts: int
    HasCrCard: int
    IsActiveMember: int
    EstimatedSalary: float

# Helper function to preprocess single prediction input
def preprocess_input(profile: CustomerProfile):
    # Encoding
    enc_gender = 1 if profile.Gender.strip().lower() == "male" else 0
    enc_geo_germany = 1 if profile.Geography.strip().lower() == "germany" else 0
    enc_geo_spain = 1 if profile.Geography.strip().lower() == "spain" else 0
    
    # Create DataFrame in the exact sequence as expected by model
    df = pd.DataFrame({
        "CreditScore": [profile.CreditScore],
        "Gender": [enc_gender],
        "Age": [profile.Age],
        "Tenure": [profile.Tenure],
        "Balance": [profile.Balance],
        "NumOfProducts": [profile.NumOfProducts],
        "HasCrCard": [profile.HasCrCard],
        "IsActiveMember": [profile.IsActiveMember],
        "EstimatedSalary": [profile.EstimatedSalary],
        "Geography_Germany": [enc_geo_germany],
        "Geography_Spain": [enc_geo_spain]
    })
    return df

# Helper to generate insights and recommendations
def get_insights(profile: CustomerProfile, prob: float):
    factors = []
    recs = []
    
    # Factors
    if profile.Age > 45:
        factors.append("Advanced Age: Age is a highly weighted predictor. Customers above 45 show increased churn probability.")
    if profile.IsActiveMember == 0:
        factors.append("Inactivity: Inactive status greatly reduces account stickiness.")
    if profile.NumOfProducts == 1:
        factors.append("Low Product Density: Customers with only 1 product have lower exit barriers.")
    elif profile.NumOfProducts >= 3:
        factors.append("High Product Multiplicity: Historically, 3+ product accounts demonstrate high churn rates (complexity/price issues).")
    if profile.Geography.strip().lower() == "germany":
        factors.append("Regional Variation: Customers in Germany exhibit higher churn rates.")
    if profile.Balance == 0.0:
        factors.append("Zero Balance: Empty accounts represent minimal customer commitment.")
        
    # Recommendations
    if profile.IsActiveMember == 0:
        recs.append("📧 Re-engage Member: Propose personalized transaction offers or a free relationship consultation to reactivate account status.")
    if profile.NumOfProducts == 1:
        recs.append("🎒 Cross-Sell Products: Introduce bundle benefits (e.g. credit cards or savings plans) to increase customer stickiness.")
    if profile.NumOfProducts >= 3:
        recs.append("🔧 Simplify Products: Offer custom account consolidation to clean up billing or system complexities.")
    if profile.Balance > 100000 and profile.CreditScore < 600:
        recs.append("💎 VIP Financial Counseling: Customer has a high balance but a low credit score. Reach out with dedicated credit-repair or wealth management tools.")
    if profile.Age > 50 and profile.Geography.strip().lower() == "germany":
        recs.append("🎁 Senior Retention Package: Offer fee waivers or loyalty dividend accounts specialized for regional senior portfolios.")
    if profile.Tenure <= 2:
        recs.append("🌱 Onboarding Check-in: Proactively schedule a 24-month feedback call to ensure smooth integration.")
        
    if prob >= 0.60:
        recs.append("🚨 Priority Contact: Churn risk is critical. Flag account for a personal outreach from relationship managers within 48 hours.")
    elif not recs:
        recs.append("🌟 Maintain Services: Churn risk is healthy. Send routine loyalty appreciations and keep under standard monitoring.")
        
    return factors, recs

@app.post("/api/predict")
def predict_single(profile: CustomerProfile):
    if model is None:
        raise HTTPException(status_code=500, detail="Machine learning model is not loaded.")
    
    df = preprocess_input(profile)
    
    # Run predictions
    try:
        prob = float(model.predict_proba(df)[0][1])
        pred = int(model.predict(df)[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {e}")
        
    # Risk category
    if prob < 0.30:
        risk_level = "Low"
    elif prob < 0.60:
        risk_level = "Medium"
    else:
        risk_level = "High"
        
    factors, recs = get_insights(profile, prob)
    
    return {
        "churn_probability": prob,
        "prediction": pred,
        "risk_level": risk_level,
        "key_factors": factors,
        "recommendations": recs
    }

@app.post("/api/predict_batch")
async def predict_batch(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Machine learning model is not loaded.")
        
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
        
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {e}")
        
    required_cols = ["CreditScore", "Geography", "Gender", "Age", "Tenure", "Balance", "NumOfProducts", "HasCrCard", "IsActiveMember", "EstimatedSalary"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Uploaded CSV is missing columns: {missing}")
        
    # Create copy for preprocessing
    proc_df = df.copy()
    proc_df["Gender"] = proc_df["Gender"].apply(lambda x: 1 if str(x).strip().lower() == "male" else 0)
    proc_df["Geography_Germany"] = proc_df["Geography"].apply(lambda x: 1 if str(x).strip().lower() == "germany" else 0)
    proc_df["Geography_Spain"] = proc_df["Geography"].apply(lambda x: 1 if str(x).strip().lower() == "spain" else 0)
    
    model_features = [
        "CreditScore", "Gender", "Age", "Tenure", "Balance", 
        "NumOfProducts", "HasCrCard", "IsActiveMember", "EstimatedSalary",
        "Geography_Germany", "Geography_Spain"
    ]
    
    try:
        probabilities = model.predict_proba(proc_df[model_features])[:, 1]
        predictions = model.predict(proc_df[model_features])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model failed to calculate: {e}")
        
    # Append calculations
    df["ChurnProbability"] = probabilities
    df["PredictedLabel"] = [int(p) for p in predictions]
    df["RiskLevel"] = pd.cut(
        df["ChurnProbability"],
        bins=[0, 0.3, 0.6, 1.0],
        labels=["Low", "Medium", "High"],
        include_lowest=True
    ).astype(str)
    
    # Calculate aggregate stats
    total = len(df)
    churn_cnt = int(np.sum(predictions))
    avg_churn_rate = float(churn_cnt / total) if total > 0 else 0.0
    high_risk_cnt = int(np.sum(probabilities >= 0.60))
    
    # Country-wise statistics
    country_stats = df.groupby("Geography")["ChurnProbability"].mean().reset_index()
    country_data = {
        "labels": country_stats["Geography"].tolist(),
        "values": [float(v) * 100 for v in country_stats["ChurnProbability"]]
    }
    
    # Age-wise statistics
    df["AgeGroup"] = pd.cut(df["Age"], bins=[18, 30, 40, 50, 60, 100], labels=["18-30", "31-40", "41-50", "51-60", "60+"])
    age_stats = df.groupby("AgeGroup", observed=False)["ChurnProbability"].mean().reset_index()
    age_data = {
        "labels": age_stats["AgeGroup"].tolist(),
        "values": [float(v) * 100 if not pd.isna(v) else 0.0 for v in age_stats["ChurnProbability"]]
    }
    
    # Output list (first 100 rows for preview)
    records = df.head(100).to_dict(orient="records")
    
    # Generate full CSV back to client for download
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    return {
        "kpis": {
            "total_analyzed": total,
            "predicted_churns": churn_cnt,
            "average_churn_rate": avg_churn_rate * 100,
            "high_risk_count": high_risk_cnt
        },
        "charts": {
            "country": country_data,
            "age": age_data
        },
        "preview": records,
        "csv_content": stream.getvalue()
    }

@app.get("/api/model_info")
def model_info():
    # Hardcoded importance values from RF model for accuracy and speed
    features = [
        'Geography (Spain)', 'Gender', 'Has Credit Card', 
        'Geography (Germany)', 'Is Active Member', 'Tenure', 
        'Num of Products', 'Balance', 'Credit Score', 
        'Estimated Salary', 'Age'
    ]
    importances = [0.013, 0.019, 0.019, 0.026, 0.041, 0.082, 0.130, 0.139, 0.144, 0.147, 0.240]
    
    return {
        "model_type": "Random Forest Classifier",
        "features": features,
        "importances": importances
    }

# Mount static folder for website hosting
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
else:
    @app.get("/")
    def read_root():
        return HTMLResponse("<h2>Error: 'static' folder not found. Please place your index.html inside a 'static' directory.</h2>")
