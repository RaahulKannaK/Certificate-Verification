import numpy as np
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

# =====================================================
# FACE VECTOR VERIFICATION (WITH FULL DEBUG)
# =====================================================
@app.route("/verify-face", methods=["POST"])
def verify_face():
    try:
        print("\n================ VERIFY DEBUG START ================")

        data = request.json

        stored_vector = data.get("storedVector")
        new_vector = data.get("newVector")

        if not stored_vector or not new_vector:
            print("❌ Missing vectors")
            return jsonify({
                "success": False,
                "match": False,
                "confidence": 0
            }), 400

        print("📏 Stored vector length:", len(stored_vector))
        print("📏 New vector length:", len(new_vector))

        stored_np = np.array(stored_vector, dtype=np.float32)
        new_np = np.array(new_vector, dtype=np.float32)

        # Validate size
        if stored_np.shape != (128,) or new_np.shape != (128,):
            print("❌ Invalid vector size")
            return jsonify({
                "success": False,
                "match": False,
                "confidence": 0
            }), 400

        # Distance calculation
        distance = np.linalg.norm(stored_np - new_np)

        # Confidence calculation
        confidence = float(max(0, 1 - distance))

        # Threshold (tune if needed)
        threshold = 0.42
        match = distance < threshold

        print("📐 Distance:", round(float(distance), 4))
        print("🎯 Confidence:", round(confidence, 4))
        print("📊 Threshold:", threshold)
        print("✅ Match Result:", match)

        print("================ VERIFY DEBUG END ================\n")

        return jsonify({
            "success": True,
            "match": bool(match),
            "confidence": round(confidence, 3),
            "distance": round(float(distance), 4),
            "threshold": threshold
        })

    except Exception as e:
        print("❌ Server Error:", str(e))
        return jsonify({
            "success": False,
            "match": False,
            "confidence": 0
        }), 500


# =====================================================
# HEALTH CHECK
# =====================================================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "Face Biometric AI",
        "status": "running (debug vector mode)"
    })


# =====================================================
# RUN
# =====================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)