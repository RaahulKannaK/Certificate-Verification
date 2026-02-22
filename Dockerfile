FROM python:3.10-slim

WORKDIR /app

ENV PIP_NO_CACHE_DIR=1
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY backend ./backend

EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "backend.face_service:app"]