import datetime
import json
import time

from flask import render_template, flash, \
    redirect, url_for, request, abort, jsonify
from flask_login import login_user, logout_user, current_user, login_required
from wtforms import SelectField
from wtforms.validators import DataRequired

from . import app, db, bcrypt
from .forms import RegisterForm, LoginForm, AddLogForm
from .models import User, Log
from .py_helper import misc


# ==============   USER PAGES  ============== #
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        flash(f'<b>{current_user.username.title()}</b>, you are already logged in', "info")
        return redirect(url_for('home'))

    form = LoginForm()
    if form.validate_on_submit():
        # if session and check form.username.data as validator
        user = User.query.filter_by(username=form.username.data.lower().strip()).first()
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            flash(f'<b>{user.username.title()}</b> Logged in Succesfully!', "success")
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('home'))
        else:
            flash(f'Login Unsuccessful, Please verify your Email and Password', "danger")
    return render_template('login.html', title="Login", form=form)


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        flash(f'<b>{current_user.username.title()}</b>, you are already logged in', "info")
        return redirect(url_for('home'))

    form = RegisterForm()
    if form.validate_on_submit():
        hashed_pass = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user = User(username=form.username.data.lower(), email=form.email.data.lower().strip(), password=hashed_pass)
        user.setDefaultOnRegister()
        db.session.add(user)
        db.session.commit()
        new_log = Log(is_exp=(form.balance.data < 0), title='Initial Balance', user_id=user.id,
                      utc_ms_verification=int(time.time() * 1000),
                      time_logged=datetime.datetime.now(), category='other', amount=form.balance.data)
        db.session.add(new_log)
        db.session.commit()
        flash(f'<b>{user.username.title()}</b> Registered Succesfully! Please Login to start Piggying', "success")
        return redirect(url_for('login'))
    return render_template('register.html', form=form)


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))


@app.route('/account', methods=['GET', 'POST'])
@login_required
def account():
    if request.method == 'POST' and request.is_json:
        # AJAX modify categories
        cats = current_user.getCategoriesList()
        active_cats = current_user.getActiveCategories()
        to_add, to_delete = request.get_json()['toAdd'], request.get_json()['toDelete']

        if len(to_add) == 0 and len(to_delete) == 0:
            return jsonify({'error': f'No Changes were made'}), 400

        # deletions:
        for cat in to_delete:
            if cat in cats and cat not in active_cats:
                cats.remove(cat)
            else:
                if cat in active_cats:
                    err = f"Couldn't Delete <b>{cat.split('_')[1].title()}</b>  (category is active)"
                else:
                    err = f"Couldn't Delete <b>{cat}</b> as requested"
                return jsonify({'error': err}), 400

        # additions:
        for cat in to_add:
            if cat.split('_')[0] not in User.CATEGORIES_TYPES or len(cat.split('_')) != 2 or \
                    any(char in cat for char in ('=', '?', '&', '#', ',', '(', ')', '{', '}', ';')) or len(
                cat.split('_')[1]) > 15 \
                    or cat in cats:
                return jsonify({'error': f"Couldn't Add {cat} as requested"}), 400
            else:
                cats.append(cat)

        if len(cats) > User.CATEGORIES_LIMIT:
            return jsonify({'error': f"Too Many Categories Were Added"}), 400

        # COMMIT:
        current_user.categories = json.dumps(cats)
        db.session.commit()
        return jsonify({'msg': f"Saved <b>Categories</b> Changes Successfully"}), 200

    elif 'user_deletion' in request.form:
        if bcrypt.check_password_hash(current_user.password, request.form['password']):
            for log in current_user.logs:
                db.session.delete(log)
            db.session.delete(current_user)
            db.session.commit()
            flash(f'<b>Well, We Sad to See You Go  &#128549;</b> User Was Deleted Successfully.', "info")
            return redirect(url_for('about'))
        else:
            flash(f'<b>Deletion Failed</b>, Incorrect Password', "danger")

    return render_template('account.html')


# ==============   DATA PAGES  ============== #
@app.route('/table', methods=['GET', 'POST'])
@login_required
def table():
    current_user.logs.sort(reverse=True, key=lambda log: (log.time_logged, log.id))
    logs_pack = {'sorted_logs': current_user.logs, 'balance': sum([log.amount for log in current_user.logs])}

    # ADD-LOG form:
    cats = [(cat, cat.split('_')[-1].title()) for cat in json.loads(current_user.categories)]

    class DynamicForm(AddLogForm):
        category = SelectField("Category", default='other', choices=[('other', 'Other')] + cats,
                               validators=[DataRequired()])

    add_form = DynamicForm()

    add_form_pack = {'radio_lst': list(add_form.log_type), 'open_dialog_on_load': False}
    is_exp = add_form.log_type.data == 'exp'

    print(request.form)
    print(add_form.data)
    # DELETE
    if add_form.is_submitted() and add_form.submit_type.data=='delete' and add_form.log_id.data:
        curr_log = Log.query.get_or_404(int(add_form.log_id.data))
        if current_user.id != curr_log.user_id:
            abort(403)  # trying to access another user's log
        if int(add_form.log_utc.data) != curr_log.utc_ms_verification:
            abort(403)  # time stamp verification failed --> not the designated log

        db.session.delete(curr_log)
        db.session.commit()
        flash(f'<b>{"Expanse" if curr_log.is_exp else "Income"}</b> Was Deleted Successfully!', "success")
        return redirect(url_for('table'))

    elif add_form.validate_on_submit():
        # ADD
        if not add_form.log_id.data:
            new_log = Log(is_exp=is_exp, title=add_form.title.data.strip(), user_id=current_user.id,
                          utc_ms_verification=int(time.time() * 1000),
                          time_logged=datetime.datetime.strptime(str(add_form.time_logged.data), "%Y-%m-%d %H:%M:%S"),
                          category=add_form.category.data,
                          amount=((-1 if is_exp else 1) * misc.limit_digits(float(add_form.amount.data))))
            db.session.add(new_log)
            db.session.commit()
            flash(f'New <b>{"Expanse" if is_exp else "Income"}</b> Added Succesfully!', "success")
            return redirect(url_for('table'))

        # MODIFY
        else:
            curr_log = Log.query.get_or_404(int(add_form.log_id.data))
            if current_user.id != curr_log.user_id:
                abort(403)  # trying to access another user's log
            if int(add_form.log_utc.data) != curr_log.utc_ms_verification:
                abort(403)  # time stamp verification failed --> not the designated log

            curr_log.modify_log(title=add_form.title.data.strip(), category=add_form.category.data,
                                time_logged=datetime.datetime.strptime(str(add_form.time_logged.data),
                                                                       "%Y-%m-%d %H:%M:%S"),
                                amount=((-1 if is_exp else 1) * misc.limit_digits(float(add_form.amount.data))))
            db.session.commit()
            db.session.commit()
            flash(f'<b>{"Expanse" if curr_log.is_exp else "Income"}</b> Updated Succesfully!', "success")
            return redirect(url_for('table'))

    # ERRORS IN FORM
    elif add_form.is_submitted():  # there are errors in add_form
        print(add_form.errors)
        print(add_form.data)
        flash(f"Failed add Income/Expanse, Try Again", "danger")
        add_form_pack['open_dialog_on_load'] = True

    return render_template("table.html", add_form=add_form, add_form_pack=add_form_pack, logs_pack=logs_pack)


@app.route('/analysis')
@login_required
def analysis():
    return render_template('analysis.html')


# ==============   BASIC PAGES  ============== #
@app.route('/home')
@app.route('/')
def home():
    return render_template("home.html")


@app.route('/about')
def about():
    return render_template('about.html')

# ==============   ERROR PAGES  ============== #

@app.errorhandler(404)
def error_404(e):
    return render_template('error-pages/404.html')

@app.errorhandler(403)
def error_403(e):
    return render_template('error-pages/403.html')

# ==============   API  =============== #
@app.route('/json/<data_type>')
@login_required
def getJson(data_type):
    if data_type == 'logs':
        current_user.logs.sort(reverse=True, key=lambda log: (log.time_logged, log.id))
        return jsonify([log.serialize_dev() for log in current_user.logs])
    if data_type == 'categories':
        return jsonify(json.loads(current_user.categories))
    else:
        abort(404)
