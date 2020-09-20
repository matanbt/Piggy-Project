import os
from piggy import app

print(':) - run.py : not yet in main!')

if __name__ == "__main__":
    print(':) - run.py : in main!')
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    app.run(debug=True)