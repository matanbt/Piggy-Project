import datetime
import time

from piggy import db, bcrypt
from piggy.models import User,Log

def create_table():
    db.create_all()

def clear_table():
    db.drop_all()

def createDemoUser():
    hashed_pass = bcrypt.generate_password_hash('123').decode('utf-8')
    user = User(username='user', email='user@user.com', password=hashed_pass)
    user.setDefaultOnRegister()
    db.session.add(user)
    db.session.commit()
    new_log = Log(is_exp=False, title='Initial Balance', user_id=user.id,
                  utc_ms_verification=int(time.time() * 1000),
                  time_logged=datetime.datetime.now(), category='other', amount=2020)
    db.session.add(new_log)
    db.session.commit()