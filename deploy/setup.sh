#!/bin/bash
# ============================================
# Personal FX Finance Assistant - Deployment Script
# Target: Ubuntu 20.04+ / Debian 11+
# ============================================
set -e

APP_DIR="/opt/fx-assistant"
DATA_DIR="/var/data/fx-assistant"
LOG_DIR="/var/log/fx-assistant"
VENV_DIR="$APP_DIR/venv"

echo "=== FX Assistant Deployment ==="

# 1. System dependencies
echo "[1/7] Installing system packages..."
sudo apt update
sudo apt install -y python3-venv python3-pip nginx supervisor

# 2. Create directories
echo "[2/7] Creating directories..."
sudo mkdir -p "$APP_DIR" "$DATA_DIR/exports" "$LOG_DIR"
sudo chown -R www-data:www-data "$DATA_DIR" "$LOG_DIR"

# 3. Copy application files
echo "[3/7] Copying application..."
sudo cp -r backend frontend deploy "$APP_DIR/"
sudo cp requirements.txt "$APP_DIR/backend/"

# 4. Python virtual environment
echo "[4/7] Setting up Python environment..."
sudo python3 -m venv "$VENV_DIR"
sudo "$VENV_DIR/bin/pip" install --upgrade pip
sudo "$VENV_DIR/bin/pip" install -r "$APP_DIR/backend/requirements.txt"

# 5. Database initialization
echo "[5/7] Initializing database..."
cd "$APP_DIR/backend"
sudo FLASK_APP=manage.py "$VENV_DIR/bin/flask" db upgrade
sudo FLASK_APP=manage.py "$VENV_DIR/bin/flask" seed-currencies
sudo FLASK_APP=manage.py "$VENV_DIR/bin/flask" seed-sample-rates --days 90

# 6. Generate PWA icons (optional, requires Python)
echo "[6/7] Generating PWA icons..."
sudo "$VENV_DIR/bin/python" "$APP_DIR/backend/generate_icons.py" || echo "Icon generation skipped"

# 7. Configure services
echo "[7/7] Configuring Nginx and Supervisor..."

# Nginx
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/fx-assistant
sudo ln -sf /etc/nginx/sites-available/fx-assistant /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Supervisor
sudo cp "$APP_DIR/deploy/supervisor.conf" /etc/supervisor/conf.d/fx-assistant.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start fx-assistant

echo ""
echo "=== Deployment Complete ==="
echo "App directory: $APP_DIR"
echo "Data directory: $DATA_DIR"
echo "Access your app at: http://your-server-ip/"
echo ""
echo "To create an admin user:"
echo "  cd $APP_DIR/backend"
echo "  sudo FLASK_APP=manage.py $VENV_DIR/bin/flask create-user --username admin --email admin@example.com --password YOUR_PASSWORD"
