from datetime import datetime

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, FloatField, \
                    RadioField, SelectField,HiddenField
from wtforms.fields.html5 import DateTimeLocalField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError, NumberRange
from .models import User
# import email_validator # used implicitly


class RegisterForm(FlaskForm):

    # my validators:
    def unique_username(self, username):
        if User.query.filter_by(username=username.data.lower()).first():
            raise ValidationError('Username is taken, try different one (Maybe you should log in?)')

    def rules_username(self,username):
        #no spaces allowed
        if username.data.replace(' ','') != username.data or len(username.data.strip()) == 0:
            raise ValidationError('Invalid Username')

    def unique_email(self, email):
        if User.query.filter_by(email=email.data.lower()).first():
            raise ValidationError('Email is taken, try different one (Maybe you should log in?)')

    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20),
                                                   rules_username,unique_username])
    email = StringField('Email', validators=[DataRequired(), Email(), unique_email])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=3)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    balance = FloatField("Current Balance",
                         validators=[DataRequired('Field must be a valid number.')])
    submit = SubmitField('Sign Up')


class LoginForm(FlaskForm):
    username = StringField('Username',
                           validators=[DataRequired(message='Username is not valid.'),
                                       Length(min=2, max=20, message='Username is not valid.')])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')



class AddLogForm(FlaskForm):

    #my validators:
    def rules_title(self, title):
        # no spaces allowed
        if title.data.strip() != title.data or (len(title.data.strip()) == 0 and len(title.data)!=0):
            raise ValidationError('Invalid Title')


    log_id = HiddenField('', default='') # new log - '', existing log - 'number of id'
    submit_type = HiddenField('', default='') # new log - '', existing log - 'number of id'
    log_utc = HiddenField('', default='')

    log_type = RadioField('',validators=[DataRequired()], choices=[('in', 'Income'),('exp','Expanse')]) # defined in HTML
    amount = FloatField("Amount", description='Amount of Income/Expanse in NIS, Positive value',
                        validators=[DataRequired('Field must be a valid number.'),NumberRange(min=0)])

    time_logged=DateTimeLocalField('Time',format='%Y-%m-%dT%H:%M',validators=[DataRequired()],description='Default time is now')

    categories=[]
    # category - SelectField - dynamic field --> defined in 'routes'

    title = StringField("Title", description='*Optional short description',
                        default="", validators=[Length(max=20), rules_title])
    submit_dialog=SubmitField('Add')
    delete_dialog=SubmitField('Delete (!)')



    def validate(self):
        result = True

        if not FlaskForm.validate(self):
            result = False

        # cross-fields validators
        if self.category.data != 'other' and self.category.data.split('_')[0] != self.log_type.data:
            self.category.errors.append('Error with chosen category')
            result = False

        return result


