import os
from piggy import app

if __name__ == "__main__":
    app.config['SECRET_KEY'] = os.environ.get('SECRET')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    app.run(debug=True)