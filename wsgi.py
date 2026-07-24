import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app import create_app

config_name = 'prod' if os.environ.get('FLASK_ENV') == 'production' else 'dev'
app = create_app(config_name)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
