import sys
import os

# Hardcode the backend path
BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE, 'backend'))

# Force import
import importlib
spec = importlib.util.spec_from_file_location(
    'app',
    os.path.join(BASE, 'backend', 'app', '__init__.py')
)
app_module = importlib.util.module_from_spec(spec)

# Patch: inject the models path too
sys.path.insert(0, os.path.join(BASE, 'backend', 'app'))

spec.loader.exec_module(app_module)
create_app = app_module.create_app

config_name = 'prod' if os.environ.get('FLASK_ENV') == 'production' else 'dev'
app = create_app(config_name)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
