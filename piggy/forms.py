from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, FloatField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError
from .models import User

class RegisterForm(FlaskForm):

    # my validators:

    def cont_a(self, password, message="A not in Password"):
        if 'a' not in password.data:
            pass
            # raise ValidationError('message')

    def unique_username(self, username):
        if User.query.filter_by(username=username.data.lower()).first():
            raise ValidationError('Username is taken, try different one')

    def unique_email(self, email):
        if User.query.filter_by(email=email.data.lower()).first():
            raise ValidationError('Email is taken, try different one (Maybe you should log in?)')

    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20),unique_username])
    email = StringField('Email', validators=[DataRequired(), Email(),unique_email])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=3), cont_a])  # add func?
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    balance = FloatField("Current Balance",
                         validators=[DataRequired('Field must be a valid number.')])  # numbers indeed!
    submit = SubmitField('Sign Up')


class LoginForm(FlaskForm):
    username = StringField('Username',
                           validators=[DataRequired(message='Username is not valid.'), Length(min=2, max=20, message='Username is not valid.')])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')
