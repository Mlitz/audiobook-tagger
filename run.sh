#!/bin/bash

# Set default paths or use environment variables if set
AUDIOBOOKS_PATH=${AUDIOBOOKS_PATH:-"$PWD/audiobooks"}
OUTPUT_PATH=${OUTPUT_PATH:-"$PWD/output"}
LOGS_PATH=${LOGS_PATH:-"$PWD/logs"}

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Create directories if they don't exist
mkdir -p "$OUTPUT_PATH" "$LOGS_PATH"

# Run the Docker container
docker run -it --rm \
  -v "$AUDIOBOOKS_PATH:/audiobooks:ro" \
  -v "$OUTPUT_PATH:/app/output" \
  -v "$LOGS_PATH:/app/logs" \
  -e AUDNEXUS_API_KEY="$AUDNEXUS_API_KEY" \
  -e LOG_LEVEL="${LOG_LEVEL:-info}" \
  yourusername/audiobook-tagger "$@"

# Check exit code
if [ $? -ne 0 ]; then
  echo "Error: Command failed. Check the logs at $LOGS_PATH for more information."
  exit 1
fi
