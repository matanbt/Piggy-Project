from piggy import db
from piggy.models import User,Log

def create_table():
    db.create_all()

def clear_table():
    db.drop_all()

