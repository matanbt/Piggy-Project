"""
additional helper functions (mostly deals with data-structures) to the web-app
"""
from typing import List,Dict
from piggy.models import Log
import datetime


def count_by_months(user_logs: List[Log]) -> Dict:
    """ gets Logs-list and counts amount of logs for each month (in a year), assumes list sorted by date"""
    out_dict={}
    for log in user_logs:
        curr_month=log.time_logged.date().strftime("%B %y'")
        if curr_month not in out_dict:
            out_dict[curr_month]=[1,log]
        else:
            out_dict[curr_month][0]=out_dict[curr_month][0]+1
    print(out_dict)
    return out_dict
