import datetime,time

from flask import render_template, flash, \
    redirect, url_for, request, abort, jsonify
from flask_login import login_user,logout_user, current_user,login_required

from . import app, db, bcrypt, login_manager
from .scripts import news_scraping  # TO DELETE
from .scripts import misc
from .models import User,Log
from .forms import RegisterForm,LoginForm, AddLogForm


@app.route('/home')
@app.route('/')
def home():
    print(request.args)
    return render_template("home.html")

@app.route('/login', methods=['GET','POST'])
def login():
    if current_user.is_authenticated:
        flash(f'<b>{current_user.username}</b>, you are already logged in', "info")
        return redirect(url_for('home'))

    form=LoginForm()
    if form.validate_on_submit():
        #if session and check form.username.data as validator
        user=User.query.filter_by(username=form.username.data.lower()).first()
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
        user=User(username=form.username.data.lower(), email=form.email.data.lower(), password=hashed_pass)
        db.session.add(user)
        db.session.commit()
        new_log = Log(is_exp=(form.balance.data < 0), title='Initial Balance', user_id=user.id,
                      utc_ms_verification=int(time.time() * 1000),
                      time_logged=datetime.datetime.now(), category='other', amount=form.balance.data)
        db.session.add(new_log)
        db.session.commit()
        flash(f'<b>{form.username.data}</b> Registered Succesfully! Please Login to start Piggying',"success")
        return redirect(url_for('login')) # ... todo auto login and guide (helper)
    return render_template('register.html', form=form)

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

@app.route('/json/logs')
@login_required
def getLogsJson():
    current_user.logs.sort(reverse=True,key=lambda log:(log.time_logged, log.id))
    print(type(current_user.logs),current_user.logs)
    return jsonify([log.serialize_dev() for log in current_user.logs])


@app.route('/table',methods=['GET', 'POST'])
@login_required
def table():
    current_user.logs.sort(reverse=True,key=lambda log: (log.time_logged, log.id))
    logs_pack={'sorted_logs':current_user.logs,'months_count':misc.count_by_months(current_user.logs),
               'balance':sum([log.amount for log in current_user.logs])}
    #ADD-LOG form:
    add_form = AddLogForm()
    add_form_pack = {'radio_lst': list(add_form.log_type),'open_dialog_on_load': False}
    is_exp = add_form.log_type.data == 'exp'

    #DELETE
    if add_form.is_submitted() and add_form.delete_dialog.data and add_form.log_id.data:
        curr_log = Log.query.get_or_404(int(add_form.log_id.data))
        if current_user.id!=curr_log.user_id:
            abort(403) #trying to access another user's log
        if int(add_form.log_utc.data)!=curr_log.utc_ms_verification:
            abort(403) # time stamp verification failed --> not the designated log

        db.session.delete(curr_log)
        db.session.commit()
        flash(f'<b>{"Expanse" if curr_log.is_exp else "Income"}</b> Deleted Succesfully!', "success")
        return redirect(url_for('table'))

    elif add_form.validate_on_submit():
        # ADD
        if not add_form.log_id.data:
            new_log=Log(is_exp=is_exp,title=add_form.title.data,user_id=current_user.id,
                        utc_ms_verification=int(time.time()*1000),
                        time_logged=datetime.datetime.strptime(str(add_form.time_logged.data),"%Y-%m-%d %H:%M:%S"),
                        category=add_form.category.data,amount=((-1 if is_exp else 1) * float(add_form.amount.data)))
            db.session.add(new_log)
            db.session.commit()
            flash(f'<b>{"Expanse" if is_exp else "Income" }</b> Added Succesfully!', "success")
            return redirect(url_for('table'))

        # MODIFY
        else:
            curr_log=Log.query.get_or_404(int(add_form.log_id.data))
            if current_user.id != curr_log.user_id:
                abort(403) # trying to access another user's log
            if int(add_form.log_utc.data) != curr_log.utc_ms_verification:
                abort(403)  # time stamp verification failed --> not the designated log

            curr_log.modify_log(title=add_form.title.data, category=add_form.category.data,
                                time_logged=datetime.datetime.strptime(str(add_form.time_logged.data), "%Y-%m-%d %H:%M:%S"),
                                amount=((-1 if curr_log.is_exp else 1) * float(add_form.amount.data)))
            db.session.commit()
            flash(f'<b>{"Expanse" if curr_log.is_exp else "Income"}</b> Updated Succesfully!', "success")
            return redirect(url_for('table'))

    #ERRORS IN FORM
    elif add_form.is_submitted(): # there are errors in add_form
        print(add_form.errors)
        print(add_form.data)
        flash(f"Failed add Income/Expanse, Try Again", "danger")
        add_form_pack['open_dialog_on_load']=True

    return render_template("table.html", add_form=add_form, add_form_pack=add_form_pack,logs_pack=logs_pack)


@app.route('/goals')
@login_required
def goals():
    return render_template("goals.html")

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

