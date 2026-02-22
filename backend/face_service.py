import base64
import numpy as np
import cv2
import mediapipe as mp
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.5)

# =====================================================
# Extract Face Vector (Lightweight)
# =====================================================
@app.route("/extract-face", methods=["POST"])
def extract_face():
    try:
        image = request.json.get("image")

        if not image:
            return jsonify({"success": False, "message": "No image provided"}), 400

        image_bytes = base64.b64decode(image.split(",")[-1])
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"success": False, "message": "Invalid image"}), 400

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = face_detector.process(rgb)

        if not results.detections:
            return jsonify({"success": False, "message": "Face not detected"}), 400

        # Use bounding box as feature vector
        detection = results.detections[0]
        bbox = detection.location_data.relative_bounding_box

        vector = [
            bbox.xmin,
            bbox.ymin,
            bbox.width,
            bbox.height
        ]

        return jsonify({
            "success": True,
            "embedding": vector
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =====================================================
# Verify Face
# =====================================================
@app.route("/verify-face", methods=["POST"])
def verify_face():
    try:
        data = request.json
        stored_vector = np.array(data.get("storedVector"))
        new_vector = np.array(data.get("newVector"))

        if stored_vector.shape != (4,) or new_vector.shape != (4,):
            return jsonify({"success": False}), 400

        distance = np.linalg.norm(stored_vector - new_vector)
        threshold = 0.2
        match = distance < threshold
        confidence = max(0, 1 - distance)

        return jsonify({
            "success": True,
            "match": bool(match),
            "distance": float(distance),
            "confidence": float(confidence)
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =====================================================
# Health Check
# =====================================================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "Face Biometric AI",
        "status": "running (no dlib version)"
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)