import base64
import numpy as np
import face_recognition
import cv2
from flask import Flask, request, jsonify
from functools import lru_cache

app = Flask(__name__)

# =====================================================
# CONFIGURATION - ADJUSTED FOR RELIABILITY
# =====================================================
USE_CNN = False  # False = HOG (fast), True = CNN (accurate but slow)
RESIZE_SCALE = 0.75  # Increased from 0.5 to 0.75 for better detection
MIN_FACE_SIZE = 80  # Minimum face size in pixels after resize

# =====================================================
# Fast Base64 Decode
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
# Optimized Face Embedding (128-D) - FIXED
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
        original_h, original_w = h, w
        
        if debug:
            print("🖼 Original resolution:", w, "x", h)

        # ========== SMART RESIZE: Don't resize if already small ==========
        # Only resize if image is large enough, otherwise use original
        if h > 800 or w > 800:
            # Calculate scale to bring largest dimension to ~600px
            max_dim = max(h, w)
            scale = 600 / max_dim
            new_w = int(w * scale)
            new_h = int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
            if debug:
                print("⚡ Resized to:", new_w, "x", new_h, f"({scale*100:.0f}%)")
        else:
            if debug:
                print("✅ Using original size (no resize needed)")

        # Convert BGR to RGB
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # ========== DETECTION: Try multiple strategies ==========
        model = "cnn" if use_cnn else "hog"
        
        if debug:
            print(f"🧠 Using model: {model.upper()}")
            start_time = cv2.getTickCount()

        # Strategy 1: Try with num_jitters=1 (faster upsampling)
        locations = face_recognition.face_locations(rgb, model=model, number_of_times_to_upsample=1)
        
        # Strategy 2: If no face found with HOG, try with more upsampling
        if len(locations) == 0 and not use_cnn:
            if debug:
                print("🔄 Retrying with higher upsampling...")
            locations = face_recognition.face_locations(rgb, model="hog", number_of_times_to_upsample=2)
        
        # Strategy 3: If still no face and image was resized, try original size
        if len(locations) == 0 and (original_h != h or original_w != w):
            if debug:
                print("🔄 Retrying with original resolution...")
            img_original = decode_base64_to_image(base64_image)  # Reload original
            if img_original is not None:
                rgb_original = cv2.cvtColor(img_original, cv2.COLOR_BGR2RGB)
                locations = face_recognition.face_locations(rgb_original, model="hog", number_of_times_to_upsample=2)
                if len(locations) > 0:
                    rgb = rgb_original  # Use original for encoding too
                    if debug:
                        print("✅ Found face in original resolution")

        if debug:
            elapsed = (cv2.getTickCount() - start_time) / cv2.getTickFrequency()
            print(f"⏱ Detection time: {elapsed:.3f}s")
            print(f"🧠 Faces detected: {len(locations)}")

        if len(locations) == 0:
            if debug:
                print("❌ No face detected in image")
                print("================ FACE DEBUG END ================\n")
            return None

        # Check face size
        top, right, bottom, left = locations[0]
        face_w = right - left
        face_h = bottom - top
        if debug:
            print(f"📏 Face size: {face_w}x{face_h}")

        # Warn if face is too small
        if face_w < MIN_FACE_SIZE or face_h < MIN_FACE_SIZE:
            if debug:
                print(f"⚠️ Warning: Face is very small (<{MIN_FACE_SIZE}px)")

        # Generate embedding
        encodings = face_recognition.face_encodings(rgb, locations, num_jitters=1)
        
        if debug:
            print("✅ Embedding generated successfully")
            print("================ FACE DEBUG END ================\n")

        if len(encodings) == 0:
            return None

        return encodings[0].tolist()

    except Exception as e:
        print("❌ Embedding error:", e)
        import traceback
        traceback.print_exc()
        return None


# =====================================================
# 1️⃣ Extract face (ENROLLMENT)
# =====================================================
@app.route("/extract-face", methods=["POST"])
def extract_face():
    try:
        data = request.json
        image = data.get("image")
        use_cnn = data.get("useCnn", USE_CNN)

        if not image:
            return jsonify({"success": False, "message": "No image provided"})

        # For enrollment, try CNN first if requested, fallback to HOG
        embedding = get_face_embedding(image, debug=True, use_cnn=use_cnn)
        
        # If CNN fails and was requested, try HOG as fallback
        if embedding is None and use_cnn:
            print("🔄 CNN failed, trying HOG...")
            embedding = get_face_embedding(image, debug=True, use_cnn=False)

        if embedding is None:
            return jsonify({
                "success": False, 
                "message": "Face not detected. Please ensure good lighting, face the camera directly, and fill most of the frame."
            })

        return jsonify({
            "success": True,
            "embedding": embedding,
            "model": "cnn" if use_cnn else "hog"
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
        use_cnn = data.get("useCnn", False)

        print("\n================ VERIFY DEBUG START ================")

        if not image or not stored_vector:
            print("❌ Missing image or stored vector")
            return jsonify({"match": False, "confidence": 0.0, "error": "Missing data"})

        # Convert to numpy array
        stored_np = np.array(stored_vector, dtype=np.float32)
        
        # Generate new embedding
        new_embedding = get_face_embedding(image, debug=True, use_cnn=use_cnn)
        
        # Fallback to HOG if CNN fails
        if new_embedding is None and use_cnn:
            print("🔄 CNN verification failed, trying HOG...")
            new_embedding = get_face_embedding(image, debug=True, use_cnn=False)
        
        if new_embedding is None:
            print("❌ Face not detected in new image")
            return jsonify({
                "match": False, 
                "confidence": 0.0, 
                "error": "Face not detected. Please ensure good lighting and face the camera."
            })

        new_np = np.array(new_embedding, dtype=np.float32)

        # Calculate distance
        dist = np.linalg.norm(stored_np - new_np)
        dist = float(dist)
        
        # Convert to confidence (0-1)
        # face_distance typically ranges 0.4-0.6 for same person, >0.6 for different
        # Linear mapping: 0.0 -> 1.0 confidence, 0.6 -> 0.0 confidence
        confidence = max(0.0, min(1.0, 1.0 - (dist / 0.6)))

        # Threshold
        threshold = 0.42 if use_cnn else 0.50
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
# 3️⃣ Batch Verify
# =====================================================
@app.route("/verify-face-batch", methods=["POST"])
def verify_face_batch():
    try:
        data = request.json
        image = data.get("image")
        stored_vectors = data.get("storedVectors", [])
        
        if not image or not stored_vectors:
            return jsonify({"matches": [], "error": "Missing data"})

        new_embedding = get_face_embedding(image, debug=False, use_cnn=False)
        if new_embedding is None:
            return jsonify({"matches": [], "error": "No face detected"})

        new_np = np.array(new_embedding, dtype=np.float32)
        stored_nps = [np.array(v, dtype=np.float32) for v in stored_vectors]
        
        distances = face_recognition.face_distance(stored_nps, new_np)
        
        results = []
        threshold = 0.50
        for i, dist in enumerate(distances):
            dist_float = float(dist)
            conf_float = float(max(0.0, min(1.0, 1.0 - (dist_float / 0.6))))
            
            results.append({
                "index": i,
                "match": bool(dist_float < threshold),
                "confidence": round(conf_float, 3),
                "distance": round(dist_float, 4)
            })
        
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
            "default_model": "hog",
            "resize_scale": "adaptive",
            "min_face_size": MIN_FACE_SIZE
        }
    })


# =====================================================
# Run server
# =====================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, threaded=True, debug=False)