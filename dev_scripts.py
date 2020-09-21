import datetime
import time
import sys

from piggy import db, bcrypt
from piggy.models import User,Log

def create_tables():
    db.create_all()

def clear_tables():
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



if __name__=='__main__':

    # Mini CLI:
    if len(sys.argv) == 2 and callable(globals().get(sys.argv[1])):
        func=globals().get(sys.argv[1])
        func()
        print(f"'{func.__name__}' ran successfully")
    else:
        print('Error')