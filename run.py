import os
from piggy import app,db

if 'ON_PRODUCTION' not in os.environ and __name__ == "__main__":
    print('-------- DEVELOPER MODE --------')
    app.run(debug=True,host='192.168.1.209',port='5002')