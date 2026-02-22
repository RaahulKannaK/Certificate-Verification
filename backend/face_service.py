import numpy as np
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

# =====================================================
# VECTOR VERIFICATION ONLY
# =====================================================
@app.route("/verify-face", methods=["POST"])
def verify_face():
    try:
        data = request.json

        stored_vector = data.get("storedVector")
        new_vector = data.get("newVector")

        if not stored_vector or not new_vector:
            return jsonify({
                "success": False,
                "message": "Missing vectors",
                "match": False,
                "confidence": 0
            }), 400

        # Convert to numpy
        stored_np = np.array(stored_vector, dtype=np.float32)
        new_np = np.array(new_vector, dtype=np.float32)

        if stored_np.shape != (128,) or new_np.shape != (128,):
            return jsonify({
                "success": False,
                "message": "Invalid vector size",
                "match": False,
                "confidence": 0
            }), 400

        # Euclidean distance
        distance = np.linalg.norm(stored_np - new_np)

        # Convert distance to confidence
        confidence = float(max(0, 1 - distance))

        # Threshold (you can tune this)
        threshold = 0.42
        match = distance < threshold

        return jsonify({
            "success": True,
            "match": bool(match),
            "confidence": round(confidence, 3),
            "distance": round(float(distance), 4)
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({
            "success": False,
            "match": False,
            "confidence": 0
        }), 500


# =====================================================
# Health Check
# =====================================================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "Face Biometric AI",
        "status": "running (vector mode)"
    })


# =====================================================
# Run Server
# =====================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)