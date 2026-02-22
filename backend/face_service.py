import base64
import numpy as np
import face_recognition
import cv2
from flask import Flask, request, jsonify

app = Flask(__name__)

# =====================================================
# Convert Base64 → Face Embedding (128-D)
# =====================================================
def get_face_embedding(base64_image, debug=False):
    try:
        print("\n================ FACE DEBUG START ================")

        # Decode base64
        image_bytes = base64.b64decode(base64_image.split(",")[-1])
        print("📦 Image byte size:", len(image_bytes))

        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            print("❌ OpenCV failed to decode image")
            return None

        h, w = img.shape[:2]
        print("🖼 Resolution:", w, "x", h)

        # Brightness check
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        print("💡 Brightness level:", round(brightness, 2))

        # Blur check
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        print("🔍 Blur score:", round(blur_score, 2))

        # Convert to RGB
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # ================= CNN FACE DETECTION =================
        locations = face_recognition.face_locations(rgb, model="cnn")
        print("🧠 CNN faces detected:", len(locations))

        if len(locations) == 0:
            print("❌ No face detected in image")
            print("================ FACE DEBUG END ================\n")
            return None

        # Face size debug
        top, right, bottom, left = locations[0]
        face_w = right - left
        face_h = bottom - top
        print("📏 Face size:", face_w, "x", face_h)

        # Landmarks check
        landmarks = face_recognition.face_landmarks(rgb, locations)
        print("👁 Landmarks detected:", len(landmarks) > 0)

        # Generate embedding
        encodings = face_recognition.face_encodings(rgb, locations)

        if len(encodings) == 0:
            print("❌ Encoding failed")
            print("================ FACE DEBUG END ================\n")
            return None

        print("✅ Embedding generated successfully")
        print("================ FACE DEBUG END ================\n")

        return encodings[0].tolist()

    except Exception as e:
        print("❌ Embedding error:", e)
        return None


# =====================================================
# 1️⃣ Extract face (ENROLLMENT)
# =====================================================
@app.route("/extract-face", methods=["POST"])
def extract_face():
    try:
        image = request.json.get("image")

        if not image:
            return jsonify({"success": False, "message": "No image provided"})

        embedding = get_face_embedding(image, debug=True)

        if embedding is None:
            return jsonify({"success": False, "message": "Face not detected"})

        return jsonify({
            "success": True,
            "embedding": embedding
        })

    except Exception as e:
        print("❌ Extract error:", e)
        return jsonify({"success": False, "message": "Server error"}), 500


# =====================================================
# 2️⃣ Verify face (MATCHING)
# =====================================================
@app.route("/verify-face", methods=["POST"])
def verify_face():
    try:
        data = request.json
        image = data.get("image")
        stored_vector = data.get("storedVector")

        print("\n================ VERIFY DEBUG START ================")

        if not image or not stored_vector:
            print("❌ Missing image or stored vector")
            return jsonify({"match": False, "confidence": 0})

        print("📏 Stored vector length:", len(stored_vector))

        new_embedding = get_face_embedding(image, debug=True)

        if new_embedding is None:
            print("❌ New embedding not generated")
            return jsonify({"match": False, "confidence": 0})

        # Convert to numpy
        stored_np = np.array(stored_vector)
        new_np = np.array(new_embedding)

        # Distance calculation
        distance = face_recognition.face_distance([stored_np], new_np)[0]
        confidence = float(1 - distance)

        print("📐 Face distance:", round(distance, 4))
        print("🎯 Confidence:", round(confidence, 4))

        # Threshold (realistic)
        threshold = 0.42
        match = distance < threshold

        print("📊 Threshold:", threshold)
        print("✅ Match result:", match)
        print("================ VERIFY DEBUG END ================\n")

        return jsonify({
            "match": bool(match),
            "confidence": round(confidence, 3)
        })

    except Exception as e:
        print("❌ Verify error:", e)
        return jsonify({"match": False, "confidence": 0}), 500


# =====================================================
# Health check
# =====================================================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "Face Biometric AI",
        "status": "running (CNN mode)"
    })


# =====================================================
# Run server
# =====================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)