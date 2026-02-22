FROM python:3.10-slim

WORKDIR /app

# System dependencies (IMPORTANT)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .

# Install Python packages
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend

# Start server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.face_service:app"]