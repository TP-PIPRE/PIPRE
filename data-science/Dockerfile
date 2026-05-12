# Usamos una imagen de Python oficial slim
FROM python:3.11-slim

# Dependencias para compilar paquetes de ML (gcc, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requerimientos e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el contenido del módulo
COPY . .

# Variables de entorno críticas:
# 1. PYTHONUNBUFFERED para ver logs en tiempo real
# 2. PYTHONPATH para que Python reconozca la carpeta /app como raíz de módulos
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Exponer el puerto de FastAPI
EXPOSE 8000

# Ejecutar el servidor apuntando a la ruta exacta del main.py
CMD ["uvicorn", "app.adapters.api.main:app", "--host", "0.0.0.0", "--port", "8000"]