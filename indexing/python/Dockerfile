# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install system dependencies required by ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# The command to run when the container starts
ENTRYPOINT ["python", "main_pipeline.py"]
