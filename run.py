import os
from piggy import app

if __name__ == "__main__":
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    app.run(debug=True)