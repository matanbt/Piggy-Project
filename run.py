import os
from piggy import app

if __name__ == "__main__":
    #developer mode:
    print('-------- DEVELOPER MODE --------')
    app.config['SECRET_KEY'] = '42bb4f60250681687b6325e7783061ba'
    app.run(debug=True,host='192.168.1.209',port='5000')