"""
additional helper functions (mostly deals with data-structures) to the web-app
"""

def limit_digits(num,digits=3):
    return int(num*10**digits)/10**digits
