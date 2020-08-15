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
    init_balance = db.Column(db.Float, nullable=False, default=0)
    password = db.Column(db.String(60), nullable=False)
    logs = db.relationship('Log', backref='owner', lazy=True)  # lazy="dynamic"

    def __repr__(self):
        return f"User('{self.username}','{self.email}')"


class Log(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    is_outcome = db.Column(db.Boolean, nullable=False)
    title = db.Column(db.String(100), nullable=False, default="")
    amount = db.Column(db.Float, nullable=False)
    date_logged = db.Column(db.DateTime, nullable=False, default=datetime.datetime.now)  # also updated
    category = db.Column(db.String(100), nullable=False, default="Other")

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f"Log('{self.title}','{self.amount}','{self.category}', '{self.date_logged}')"
