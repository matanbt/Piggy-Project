import datetime
from flask_login import UserMixin
from . import db, login_manager


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    # todo register time
    logs = db.relationship('Log', backref='owner', lazy=True)  # lazy="dynamic"

    def __repr__(self):
        return f"User('{self.username}','{self.email}')"


class Log(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    is_exp = db.Column(db.Boolean, nullable=False)
    title = db.Column(db.String(100), nullable=False, default="")
    amount = db.Column(db.Float, nullable=False)
    time_logged = db.Column(db.DateTime, nullable=False)

    #chosen from Users List TODO
    category = db.Column(db.String(100), nullable=False, default="Other")

    # real post-time (in unix), will be used to verify when modifying Log by ID
    # ASSUMES user won't post and delete in the *same* milli-second
    utc_ms_verification=db.Column(db.Integer, nullable=False)

    # logger ID
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def modify_log(self, title, amount, time_logged, category):
        self.title = title
        self.amount = amount
        self.time_logged = time_logged
        self.category = category

    def serialize_dev(self):
        return {
            'id' : self.id,
            'is_exp' : self.is_exp,
            'title' : self.title,
            'amount' : self.amount,
            'category' : self.category,
            'time_logged': self.time_logged.strftime('%Y-%m-%dT%H:%M'),
            'user_id': self.user_id
        }

    def serialize_api_user(self):
        return {
            'id' : self.id,
            'is_exp' : self.is_exp,
            'title' : self.title,
            'amount' : self.amount,
            'category' : self.category,
            'time_logged': self.time_logged.strftime('%Y-%m-%dT%H:%M'),
            'user_id': self.user_id
        }
    def __repr__(self):
        return f"Log('{self.title}','{self.amount}','{self.category}', '{self.time_logged}')"
