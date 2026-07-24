import sys, os

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
sys.path.insert(0, os.path.join(BASE, 'backend'))

from backend.app import create_app
app = create_app('prod')
