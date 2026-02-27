import base64
import numpy as np
import face_recognition
import cv2
from flask import Flask, request, jsonify
from functools import lru_cache
import threading

app = Flask(__name__)

# =====================================================
# CONFIGURATION
# =====================================================
USE_CNN = False  # Set True only if you have GPU, False for CPU (HOG is 10x faster)
RESIZE_SCALE = 0.5  # Resize image to 50% for faster processing
SKIP_FRAMES = 0  # Process every Nth frame (0 = process all)

# =====================================================
# Fast Base64 Decode with caching
# =====================================================
@lru_cache(maxsize=100)
def decode_base64_to_image_cached(base64_str):
    """Cache recent decodes to avoid repeated processing"""
    try:
        image_bytes = base64.b64decode(base64_str.split(",")[-1])
        np_arr = np.frombuffer(image_bytes, np.uint8)
        return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"Decode error: {e}")
        return None

def decode_base64_to_image(base64_str):
    """Non-cached version for unique images"""
    try:
        image_bytes = base64.b64decode(base64_str.split(",")[-1])
        np_arr = np.frombuffer(image_bytes, np.uint8)
        return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"Decode error: {e}")
        return None

# =====================================================
# Optimized Face Embedding (128-D)
# =====================================================
def get_face_embedding(base64_image, debug=False, use_cnn=USE_CNN):
    try:
        if debug:
            print("\n================ FACE DEBUG START ================")

        # Decode base64
        img = decode_base64_to_image(base64_image)
        
        if img is None:
            if debug:
                print("❌ OpenCV failed to decode image")
            return None

        h, w = img.shape[:2]
        if debug:
            print("🖼 Original resolution:", w, "x", h)

        # ========== OPTIMIZATION 1: Resize for speed ==========
        if RESIZE_SCALE < 1.0:
            new_w = int(w * RESIZE_SCALE)
            new_h = int(h * RESIZE_SCALE)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
            if debug:
                print("⚡ Resized to:", new_w, "x", new_h, f"({RESIZE_SCALE*100}%)")

        # Convert BGR to RGB
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # ========== OPTIMIZATION 2: Use HOG instead of CNN ==========
        model = "cnn" if use_cnn else "hog"
        
        if debug:
            print(f"🧠 Using model: {model.upper()}")
            start_time = cv2.getTickCount()

        # Detect faces
        locations = face_recognition.face_locations(rgb, model=model, number_of_times_to_upsample=1)
        
        if debug:
            elapsed = (cv2.getTickCount() - start_time) / cv2.getTickFrequency()
            print(f"⏱ Detection time: {elapsed:.3f}s")
            print(f"🧠 Faces detected: {len(locations)}")

        if len(locations) == 0:
            if debug:
                print("❌ No face detected")
                print("================ FACE DEBUG END ================\n")
            return None

        # ========== OPTIMIZATION 3: Generate embedding with jitters=1 ==========
        encodings = face_recognition.face_encodings(rgb, locations, num_jitters=1, model="small")
        
        if debug:
            print("✅ Embedding generated")
            print("================ FACE DEBUG END ================\n")

        if len(encodings) == 0:
            return None

        return encodings[0].tolist()

    except Exception as e:
        print("❌ Embedding error:", e)
        return None


# =====================================================
# 1️⃣ Extract face (ENROLLMENT) - Optimized
# =====================================================
@app.route("/extract-face", methods=["POST"])
def extract_face():
    try:
        data = request.json
        image = data.get("image")
        use_cnn = data.get("useCnn", USE_CNN)

        if not image:
            return jsonify({"success": False, "message": "No image provided"})

        embedding = get_face_embedding(image, debug=True, use_cnn=use_cnn)

        if embedding is None:
            return jsonify({"success": False, "message": "Face not detected"})

        return jsonify({
            "success": True,
            "embedding": embedding,
            "model": "cnn" if use_cnn else "hog"
        })

    except Exception as e:
        print("❌ Extract error:", e)
        return jsonify({"success": False, "message": "Server error"}), 500


# =====================================================
# 2️⃣ Verify face (MATCHING) - Ultra Fast
# =====================================================
@app.route("/verify-face", methods=["POST"])
def verify_face():
    try:
        data = request.json
        image = data.get("image")
        stored_vector = data.get("storedVector")
        use_cnn = data.get("useCnn", False)

        print("\n================ VERIFY DEBUG START ================")

        if not image or not stored_vector:
            print("❌ Missing image or stored vector")
            return jsonify({"match": False, "confidence": 0.0, "error": "Missing data"})

        # Convert to numpy array
        stored_np = np.array(stored_vector, dtype=np.float32)
        
        # Generate new embedding
        new_embedding = get_face_embedding(image, debug=True, use_cnn=use_cnn)
        
        if new_embedding is None:
            print("❌ Face not detected in new image")
            return jsonify({"match": False, "confidence": 0.0, "error": "No face detected"})

        new_np = np.array(new_embedding, dtype=np.float32)

        # Calculate distance
        dist = np.linalg.norm(stored_np - new_np)
        
        # Convert numpy types to Python native types for JSON serialization
        dist = float(dist)
        
        confidence = float(1 - (dist / 1.5))
        confidence = max(0.0, min(1.0, confidence))

        # Threshold
        threshold = 0.50 if not use_cnn else 0.42
        match = bool(dist < threshold)

        print("📐 Face distance:", round(dist, 4))
        print("🎯 Confidence:", round(confidence, 4))
        print("📊 Threshold:", threshold)
        print("✅ Match:", match)
        print("================ VERIFY DEBUG END ================\n")

        return jsonify({
            "match": match,
            "confidence": round(confidence, 3),
            "distance": round(dist, 4),
            "model": "cnn" if use_cnn else "hog",
            "threshold": threshold
        })

    except Exception as e:
        print("❌ Verify error:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"match": False, "confidence": 0.0, "error": str(e)}), 500


# =====================================================
# 3️⃣ Batch Verify (for multiple comparisons)
# =====================================================
@app.route("/verify-face-batch", methods=["POST"])
def verify_face_batch():
    """Compare one face against multiple stored embeddings at once"""
    try:
        data = request.json
        image = data.get("image")
        stored_vectors = data.get("storedVectors", [])
        
        if not image or not stored_vectors:
            return jsonify({"matches": [], "error": "Missing data"})

        # Get embedding once
        new_embedding = get_face_embedding(image, debug=False, use_cnn=False)
        if new_embedding is None:
            return jsonify({"matches": [], "error": "No face detected"})

        new_np = np.array(new_embedding, dtype=np.float32)
        stored_nps = [np.array(v, dtype=np.float32) for v in stored_vectors]
        
        # Batch distance calculation
        distances = face_recognition.face_distance(stored_nps, new_np)
        
        results = []
        threshold = 0.50
        for i, dist in enumerate(distances):
            # Convert to Python float
            dist_float = float(dist)
            conf_float = float(max(0.0, min(1.0, 1 - (dist_float / 1.5))))
            
            results.append({
                "index": i,
                "match": bool(dist_float < threshold),
                "confidence": round(conf_float, 3),
                "distance": round(dist_float, 4)
            })
        
        # Sort by confidence
        results.sort(key=lambda x: x["confidence"], reverse=True)
        
        return jsonify({
            "matches": results,
            "bestMatch": results[0] if results else None
        })

    except Exception as e:
        print("❌ Batch verify error:", e)
        return jsonify({"matches": [], "error": str(e)}), 500


# =====================================================
# Health check
# =====================================================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "Face Biometric AI",
        "status": "running",
        "config": {
            "default_model": "hog" if not USE_CNN else "cnn",
            "resize_scale": RESIZE_SCALE
        }
    })


# =====================================================
# Run server
# =====================================================
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        threaded=True,
        debug=False
    )