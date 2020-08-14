import datetime

from flask import render_template, flash,\
                redirect,url_for, request
from flask_login import login_user,logout_user, current_user,login_required

from . import app, db, bcrypt, login_manager
from .scripts import news_scraping  # TO DELETE
from .forms import RegisterForm,LoginForm
from .models import User,Log


@app.route('/home')
@app.route('/')
def home():
    return render_template("home.html")

@app.route('/login', methods=['GET','POST'])
def login():

    if current_user.is_authenticated:
        flash(f'<b>{current_user.username}</b>, you are already logged in', "info")
        return redirect(url_for('home'))

    form=LoginForm()
    if form.validate_on_submit():
        #if session and check form.username.data as validator
        user=User.query.filter_by(username=form.username.data).first()
        if user and bcrypt.check_password_hash(user.password,form.password.data):
            login_user(user,remember=form.remember.data)
            flash(f'<b>{form.username.data}</b> Logged in Succesfully!',"success")
            next_page=request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('home'))
        else:
            flash(f'Login Unsuccessful, Please verify your Email and Password', "danger")
    return render_template('login.html',title="Login", form=form)


@app.route('/register',methods=['GET','POST'])
def register():
    if current_user.is_authenticated:
        flash(f'<b>{current_user.username}</b>, you are already logged in', "info")
        return redirect(url_for('home'))

    form=RegisterForm()
    if form.validate_on_submit():
        hashed_pass=bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user=User(username=form.username.data.lower(), email=form.email.data.lower(),
                  password=hashed_pass,init_balance=form.balance.data)
        db.session.add(user)
        db.session.commit()
        flash(f'<b>{form.username.data}</b> Registered Succesfully! Please Login to start Piggying',"success")
        return redirect(url_for('login')) # ... bonus auto login and guide (helper)
    return render_template('register.html',title="Register", form=form)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))


@app.route('/account')
@login_required
def account():
    return render_template('account.html')

# @app.route('/login',methods=['GET','POST'])
# def login():
#     if request.method=='POST':
#         username=request.form['username']
#         return render_template("login.html", status=username)
#     else: # GET
#         return render_template("login.html",status="Not Logged In :(")

@app.route('/table')
@login_required
def table():
    return render_template("maintable.html")


LAST_UPDATED_NEWS=None
@app.route('/news')
def news():
    global LAST_UPDATED_NEWS
    df_tuple, was_updated= news_scraping.get_actual_data(LAST_UPDATED_NEWS)
    if was_updated:
        LAST_UPDATED_NEWS=datetime.datetime.now()
    print(df_tuple[1])
    countries_ids,countries_names = news_scraping.get_countries_id_from_df(df_tuple[0])
    countries_ids= ' , '.join(["."+c_id for c_id in countries_ids])
    # countries_lst - all marked countries IDs separated by commas; ig .us, .il, .gb
    return render_template("news.html", countries_lst=countries_ids,
                           countries_names=countries_names,df_tuple=df_tuple,
                           last_updated=LAST_UPDATED_NEWS)



