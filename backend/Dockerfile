# Use official Python image (stable version)
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (important for dlib & opencv)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Upgrade pip
RUN pip install --upgrade pip

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Expose port (Railway will override with PORT env)
EXPOSE 5000

# Start app using gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:5000", "face_service:app"]