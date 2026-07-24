import os
from flask import Flask
from app.config import config_map
from app.extensions import db, migrate, bcrypt, jwt, cors
from app.utils.errors import register_error_handlers
from app.api import register_blueprints

app = Flask(__name__, static_folder='../../frontend', static_url_path='/')
app.config.from_object(config_map.get(os.environ.get('FLASK_ENV', 'prod'), config_map['default']))

db.init_app(app)
migrate.init_app(app, db)
bcrypt.init_app(app)
jwt.init_app(app)
cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

register_error_handlers(app)
register_blueprints(app)

with app.app_context():
    from app.models import User, Currency, UserSetting
    db.create_all()
    if Currency.query.count() == 0:
        from app.models import Currency as C
        for code, name, symbol, country, order in [
            ('USD','US Dollar','$','United States',1),
            ('EUR','Euro','€','Eurozone',2),
            ('JPY','Japanese Yen','¥','Japan',3),
            ('GBP','British Pound','£','United Kingdom',4),
            ('AUD','Australian Dollar','A$','Australia',5),
            ('HKD','Hong Kong Dollar','HK$','Hong Kong',6),
            ('CAD','Canadian Dollar','C$','Canada',7),
            ('CHF','Swiss Franc','Fr','Switzerland',8),
            ('SGD','Singapore Dollar','S$','Singapore',9),
            ('KRW','South Korean Won','₩','South Korea',10),
        ]:
            db.session.add(C(code=code, name=name, symbol=symbol, country=country, sort_order=order))
        db.session.commit()

from .tasks.scheduled import init_scheduler
init_scheduler(app)
