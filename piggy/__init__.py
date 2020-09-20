import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager


app = Flask(__name__, static_folder='static', template_folder='templates')
#app.add_url_rule('/js/<filename>', endpoint='js')

print(":) - piggy's __init__.py : and my name is - "+__name__)

#app configs
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')

db=SQLAlchemy(app)

bcrypt = Bcrypt(app)
login_manager=LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category='info'

from . import routes


