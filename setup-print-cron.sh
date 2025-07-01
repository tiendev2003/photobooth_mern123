#!/bin/bash
# This script is for setting up the print queue worker as a cron job on the VPS

# Get the absolute path of the application
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

# Create log directory
mkdir -p logs

# Create the cron job to run every minute
(crontab -l 2>/dev/null; echo "* * * * * cd $APP_DIR && /usr/bin/node dist/lib/cron/print-queue-worker.js >> $APP_DIR/logs/print-queue.log 2>&1") | crontab -

echo "Cron job has been set up to run the print queue worker every minute."
echo "Logs will be written to $APP_DIR/logs/print-queue.log"
