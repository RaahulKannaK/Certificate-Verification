FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for dlib + opencv
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-all-dev \
    libjpeg-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend

EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "backend.face_service:app"]