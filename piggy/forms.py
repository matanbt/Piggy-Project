from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, FloatField, RadioField, SelectField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError
from .models import User


class RegisterForm(FlaskForm):

    # my validators:

    def unique_username(self, username):
        if User.query.filter_by(username=username.data.lower()).first():
            raise ValidationError('Username is taken, try different one')

    def unique_email(self, email):
        if User.query.filter_by(email=email.data.lower()).first():
            raise ValidationError('Email is taken, try different one (Maybe you should log in?)')

    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20), unique_username])
    email = StringField('Email', validators=[DataRequired(), Email(), unique_email])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=3)])  # add func?
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    balance = FloatField("Current Balance",
                         validators=[DataRequired('Field must be a valid number.')])  # numbers indeed!
    submit = SubmitField('Sign Up')


class LoginForm(FlaskForm):
    username = StringField('Username',
                           validators=[DataRequired(message='Username is not valid.'),
                                       Length(min=2, max=20, message='Username is not valid.')])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')


class AddLogForm(FlaskForm):
    def check_log_type(self, log_type):
        if log_type.data not in ('in', 'out'):
            raise ValidationError('Type was not chosen')

    log_type = RadioField('',validators=[DataRequired()], choices=[('in', 'Income'),('out','Expanse')]) # defined in HTML
    amount = FloatField("Amount", description='Amount of Income/Expanse in NIS, Positive value',
                        validators=[DataRequired('Field must be a valid number.')])
    # todo lists originated in SQL table, _ illigal key
    in_cats=[('in_salary','Salary'),('in_allowance','Allowance'),('in_bonus','Bonus')]
    out_cats=[('out_food','Food'),('out_entertainment','Entertainment'),('out_transportation','Transportation'),
              ('out_education','Education'),('out_health','Health'),('out_beauty','Beauty'),('out_household','Household')]

    category = SelectField("Category",default='other',choices=[('other','Other')]+in_cats+ out_cats,
                           validators=[DataRequired()])
    title = StringField("Title", description='Optional short description',
                        default='', validators=[Length(max=20)])

    def validate(self):
        result = True

        if not FlaskForm.validate(self):
            result = False

        # cross-fields validators
        if self.category.data != 'other' and self.category.data.split('_')[0] != self.log_type.data:
            self.category.errors.append('Error with chosen category')
            result = False

        return result
