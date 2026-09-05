from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import os


# ============================================================
# AIRGUARD AI - MACHINE LEARNING API
# ============================================================

app = FastAPI(
    title="AirGuard AI ML API",
    version="2.1.0",
    description=(
        "AirGuard AI machine-learning risk analysis API. "
        "The ML model provides an AI-estimated risk score. "
        "The live AirGuard Risk Engine remains the authoritative "
        "real-time risk source."
    )
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "airguard_risk_model_v2.pkl"
)

FEATURE_INFO_PATH = os.path.join(
    BASE_DIR,
    "models",
    "risk_model_v2_feature_info.json"
)


# ============================================================
# LOAD MODEL
# ============================================================

model = None

try:

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}"
        )

    model = joblib.load(MODEL_PATH)

    print("==========================================")
    print("✅ AirGuard AI model loaded successfully")
    print(f"📦 Model: {MODEL_PATH}")
    print("==========================================")

except Exception as error:

    print("==========================================")
    print("❌ Failed to load AirGuard AI model")
    print(error)
    print("==========================================")


# ============================================================
# INPUT MODEL
# ============================================================

class SensorInput(BaseModel):

    temperature: float = Field(
        ...,
        description="Temperature in Celsius"
    )

    humidity: float = Field(
        ...,
        description="Relative humidity percentage"
    )

    mq135: float = Field(
        ...,
        description="MQ-135 raw ADC value"
    )

    co: float = Field(
        ...,
        description="MQ-7 raw ADC value"
    )

    currentRiskScore: float | None = Field(
        default=None,
        description="Current AirGuard Risk Score from the live Risk Engine"
    )


# ============================================================
# CONSTANTS
# ============================================================

RISK_MIN = 0.0
RISK_MAX = 500.0


# ============================================================
# HELPERS
# ============================================================

def clamp_risk_score(value: float) -> float:

    return max(
        RISK_MIN,
        min(
            float(value),
            RISK_MAX
        )
    )


def get_risk_level(risk_score: float):

    if risk_score < 100:
        return "LOW"

    elif risk_score < 250:
        return "ELEVATED"

    elif risk_score < 400:
        return "HIGH"

    else:
        return "CRITICAL"


def get_direction(risk_change: float | None):

    if risk_change is None:
        return "UNKNOWN"

    if risk_change > 5:
        return "RISING"

    elif risk_change < -5:
        return "FALLING"

    return "STABLE"


def get_warning(
    risk_score: float,
    direction: str
):

    if risk_score >= 400:

        if direction == "RISING":
            return (
                "AI analysis indicates critical risk "
                "and a strong increase relative to the "
                "current Risk Engine score."
            )

        return (
            "AI analysis indicates critical air-quality risk."
        )

    elif risk_score >= 250:

        if direction == "RISING":
            return (
                "AI analysis indicates high risk "
                "with increasing conditions."
            )

        return (
            "AI analysis indicates high air-quality risk."
        )

    elif direction == "RISING":

        return (
            "AI analysis indicates that air-quality "
            "risk is increasing."
        )

    elif direction == "FALLING":

        return (
            "AI analysis indicates improving "
            "air-quality conditions."
        )

    else:

        return (
            "AI analysis indicates relatively "
            "stable air-quality risk."
        )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def home():

    return {

        "success": True,

        "service": "AirGuard AI ML API",

        "version": "2.1.0",

        "status": "running",

        "model": "AirGuard Random Forest V2",

        "purpose": "AI risk estimation",

        "liveRiskSource": "AirGuard Risk Engine"

    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {

        "success": True,

        "mlModelLoaded": model is not None,

        "modelPath": MODEL_PATH,

        "featureInfoPath": FEATURE_INFO_PATH,

        "modelVersion": "V2",

        "purpose": "AI risk estimation",

        "liveRiskSource": "AirGuard Risk Engine"

    }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
def predict(data: SensorInput):

    # --------------------------------------------------------
    # CHECK MODEL
    # --------------------------------------------------------

    if model is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "AirGuard AI ML model is not loaded. "
                "Check the model file."
            )
        )


    # --------------------------------------------------------
    # VALIDATE TEMPERATURE
    # --------------------------------------------------------

    if not (-40 <= data.temperature <= 85):

        raise HTTPException(
            status_code=400,
            detail=(
                "Temperature must be between "
                "-40 and 85 °C"
            )
        )


    # --------------------------------------------------------
    # VALIDATE HUMIDITY
    # --------------------------------------------------------

    if not (0 <= data.humidity <= 100):

        raise HTTPException(
            status_code=400,
            detail=(
                "Humidity must be between "
                "0 and 100%"
            )
        )


    # --------------------------------------------------------
    # VALIDATE MQ135
    # --------------------------------------------------------

    if not (0 <= data.mq135 <= 4095):

        raise HTTPException(
            status_code=400,
            detail=(
                "MQ-135 value must be between "
                "0 and 4095"
            )
        )


    # --------------------------------------------------------
    # VALIDATE MQ7
    # --------------------------------------------------------

    if not (0 <= data.co <= 4095):

        raise HTTPException(
            status_code=400,
            detail=(
                "MQ-7 value must be between "
                "0 and 4095"
            )
        )


    # --------------------------------------------------------
    # CURRENT RISK SCORE
    # --------------------------------------------------------

    current_risk_score = None

    if data.currentRiskScore is not None:

        current_risk_score = clamp_risk_score(
            data.currentRiskScore
        )


    # ========================================================
    # MODEL INPUT
    # ========================================================
    #
    # IMPORTANT:
    #
    # These four features MUST remain in exactly the same
    # order used during V2 training.
    #
    # 1. temperature
    # 2. humidity
    # 3. mq135
    # 4. co
    #
    # ========================================================

    input_data = [[

        data.temperature,

        data.humidity,

        data.mq135,

        data.co

    ]]


    # ========================================================
    # MODEL PREDICTION
    # ========================================================

    try:

        prediction = model.predict(
            input_data
        )[0]

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"AirGuard AI prediction failed: {error}"
            )
        )


    # --------------------------------------------------------
    # CLAMP PREDICTION
    # --------------------------------------------------------

    ai_estimated_risk = clamp_risk_score(
        prediction
    )

    ai_estimated_risk = round(
        ai_estimated_risk,
        2
    )


    # ========================================================
    # COMPARE WITH LIVE RISK ENGINE
    # ========================================================

    risk_difference = None

    if current_risk_score is not None:

        risk_difference = round(
            ai_estimated_risk - current_risk_score,
            2
        )


    # --------------------------------------------------------
    # DIRECTION
    # --------------------------------------------------------

    direction = get_direction(
        risk_difference
    )


    # ========================================================
    # AI RISK LEVEL
    # ========================================================

    ai_risk_level = get_risk_level(
        ai_estimated_risk
    )


    # ========================================================
    # WARNING
    # ========================================================

    warning = get_warning(
        ai_estimated_risk,
        direction
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "success": True,

        # ----------------------------------------------------
        # LIVE RISK ENGINE SCORE
        # ----------------------------------------------------

        "currentRiskScore": (
            round(
                current_risk_score,
                2
            )
            if current_risk_score is not None
            else None
        ),

        # ----------------------------------------------------
        # ML RESULT
        # ----------------------------------------------------

        "predictedRiskScore": ai_estimated_risk,

        "aiEstimatedRisk": ai_estimated_risk,

        "riskChange": risk_difference,

        "direction": direction,

        "riskLevel": ai_risk_level,

        "warning": warning,

        # ----------------------------------------------------
        # INPUT SENSOR VALUES
        # ----------------------------------------------------

        "inputs": {

            "temperature": round(
                data.temperature,
                2
            ),

            "humidity": round(
                data.humidity,
                2
            ),

            "mq135": round(
                data.mq135,
                2
            ),

            "co": round(
                data.co,
                2
            )

        },

        # ----------------------------------------------------
        # MODEL INFORMATION
        # ----------------------------------------------------

        "model": {

            "name": "AirGuard Random Forest V2",

            "type": "RandomForestRegressor",

            "purpose": (
                "AI-estimated AirGuard Risk Score"
            ),

            "features": [

                "temperature",

                "humidity",

                "mq135",

                "co"

            ]

        },

        # ----------------------------------------------------
        # IMPORTANT DISCLAIMER
        # ----------------------------------------------------

        "note": (
            "The AirGuard Risk Score is a project-specific "
            "0-500 score and is not a regulatory AQI, "
            "laboratory measurement, or calibrated gas "
            "concentration. The Random Forest result is an "
            "AI estimate and should not be interpreted as "
            "a guaranteed future forecast."
        )

    }