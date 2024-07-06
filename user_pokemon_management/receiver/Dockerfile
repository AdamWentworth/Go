# Start with the official Ubuntu base image
FROM ubuntu:20.04

# Set the maintainer label to your email
LABEL maintainer="adamjohnwentworth@gmail.com"

# Prevent interactive prompts during the build
ARG DEBIAN_FRONTEND=noninteractive

# Install Python, pip, and other necessary tools
RUN apt-get update -y && \
    apt-get install -y python3 python3-pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory to /app
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies from the requirements file
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the rest of your application's source code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Use the entrypoint to use bash (if needed for setup commands)
ENTRYPOINT [ "/bin/bash", "-c" ]

# Specify the command to run your application
CMD ["exec python3 -m app"]
