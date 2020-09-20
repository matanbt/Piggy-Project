export default class Log {
    constructor(id, utc_ms_verification, is_exp, amount, category, title, time_logged) {
        this.id = parseInt(id);
        this.utc_ms_verification = parseInt(utc_ms_verification);
        this.is_exp = is_exp;
        this.amount = parseFloat(amount);
        this.category = category;
        this.title = title;
        this.time_logged = time_logged;
        //this.expanded=false;
        //this.marked? mark a row

        this.time_logged_parsed = new Date(this.time_logged);
        this.time_logged_unix_day = new Date(this.time_logged).setHours(0, 0, 0, 0);
    }

    getPosAmount() {
        return Math.abs(this.amount);
    }

    getShortType() {
        return this.is_exp ? 'exp' : 'inc';
    }

    getTitleType (){
        return this.is_exp ? 'Expanse' : 'Income';
    }

    getCategoryOnly() {
        let word = this.category.split('_').slice(-1)[0];
        return word.charAt(0).toUpperCase() + word.slice(1)

    }

    getCategory(){
        if(this.category==='other') return this.is_exp? 'exp' : 'in' + '_other';
        return this.category;
    }

    getShortDate() {
        let options = {month: "short", year: "2-digit"};
        return new Intl.DateTimeFormat('en-IL', options).format(this.time_logged_parsed);
    }

    getShortMonth() {
        let options = {month: 'numeric', day: 'numeric',};
        return new Intl.DateTimeFormat('en-IL', options).format(this.time_logged_parsed);
    }

    getMedDate() {
        let options = {year: 'numeric', month: 'numeric', day: 'numeric',};
        return new Intl.DateTimeFormat('en-IL', options).format(this.time_logged_parsed);
    }

    getTime() {
        let options = {hour: 'numeric', minute: 'numeric', hour12: false};
        return new Intl.DateTimeFormat('en-IL', options).format(this.time_logged_parsed);
    }

    getLongDate() {
        let options = {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: false
        };
        return new Intl.DateTimeFormat('en-IL', options).format(this.time_logged_parsed);
    }

    getTimeToForm() {
        //return this.time_logged.toISOString().split('.')[0].slice(0, -3);}
        return this.time_logged;
    }

    getTimeInt(){
        new Date(this.time_logged).getTime();
    }

    static parseTo(obj) {
        //parse given Log-like object to Log
        return new Log(obj.id, obj.utc_ms_verification, obj.is_exp, obj.amount, obj.category, obj.title, obj.time_logged);
    }

    static logsArrToCSV(logs) {

        let fields = ['Month', 'Full Date', 'Type' ,'Amount', 'Category', 'Title'];
        let str=fields.join(',')+'\n';
        for(let log of logs){
            let row=[];
            row.push(log.getShortDate());
            row.push(log.getLongDate().replace(',',' - '));
            row.push(log.getTitleType());
            row.push(log.amount);
            row.push(log.getCategoryOnly());
            row.push(log.title);
            str+=row.join(',')+'\n';
        }

        return str;
    }
};

export const validators = {
    amount: function (amount) {
        return !isNaN(amount) && amount >= 0 && amount.trim().length > 0;
    },
    title: function (title) {
        return title.length <= 20 && title.trim() === title;
    },
    category: function (category, log_type) {
        return log_type && (category === 'other' || category.split('_')[0] === log_type);
    },
    time_logged: function (time_logged) {
        return time_logged;
    }
};
