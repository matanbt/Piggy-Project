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

    getCategoryOnly() {
        let word = this.category.split('_').slice(-1)[0];
        return word.charAt(0).toUpperCase() + word.slice(1)

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

    static parseTo(obj) {
        //parse given Log-like object to Log
        return new Log(obj.id, obj.utc_ms_verification, obj.is_exp, obj.amount, obj.category, obj.title, obj.time_logged);
    }

    static getNowToForm() {
        //return new Date().toISOString().split('.')[0].slice(0, -3);
        let timezoneFactor = new Date().getTimezoneOffset() * 60000;
        return new Date(Date.now() - timezoneFactor).toISOString().split('.')[0].slice(0, -3);
    }
};

export class Categories{
    constructor() {
        this.categories=null;
        getData.getCategories(this);
    }

    getMap(){
        let map=new Map();
        for (let cat of this.categories) {
            map.set(cat,{
                type: cat.split('_')[0],
                title: cat.split('_')[1].charAt(0).toUpperCase()+cat.split('_')[1].slice(1) }
                );
        }
        return map;
    }

    getOBJ() {
        let obj= {
            in: [],
            exp: []
        };
        for (let cat of this.categories) {
            cat = cat.split('_');
            obj[cat[0]].push(cat[1].charAt(0).toUpperCase()+cat[1].slice(1));
        }
        return obj;
    }

    getArr(){
        return this.categories;
    }

    //static
    static getTitle(cat){
        return cat==='other'? cat : cat.split('_')[1].charAt(0).toUpperCase()+cat.split('_')[1].slice(1);
    }
}

export const qTypes = {
    search: 'search',
    sortBy: 'sortBy',
    filters: {
        type: 'type', //inc/exp/''
        date: {from: 'date_from', until: 'date_until'}, //int of unix date
        amount: {min: 'amount_min', max: 'amount_max'}, //will calculate in ABS
        category: 'category' //set of cats
    },

    filters_arr: ['type', 'date_from', 'date_until', 'amount_min', 'amount_max', 'category']
}
qTypes.qtypes_arr = [qTypes.sortBy,qTypes.search, ...qTypes.filters_arr];

qTypes.qtypes_arr_ = [qTypes.search, ...qTypes.filters_arr].slice(0,-1);

export class TQuery {

    constructor() {
        this.mapQ = new Map();
        this.getQueriesFromURL();
        console.log(this);
    }

    getFilteredLogs(logs) {
        if (this.isEmpty()) return logs; //no filters
        let filtered = [];
        for (let log of logs) {
            if (this.logAnswersFilters(log)) {
                filtered.push(log);
            }
        }
        return filtered;
    }

    logAnswersFilters(log) {
        let filters = [];
        if (this.mapQ.has(qTypes.search)) {
            let searchVal = this.mapQ.get(qTypes.search).toLowerCase().trim();
            if (log.getCategoryOnly().toLowerCase().includes(searchVal) || log.title.toLowerCase().includes(searchVal) ||
                log.getShortDate().toLowerCase().includes(searchVal) || log.getMedDate().includes(searchVal)) {
                filters.push(true);
            } else {
                filters.push(false);
            }
        }

        if (this.mapQ.has(qTypes.filters.type)) {
            filters.push(this.mapQ.get(qTypes.filters.type) === log.getShortType());
        }

        if (this.mapQ.has(qTypes.filters.amount.min)) {
            filters.push(this.mapQ.get(qTypes.filters.amount.min) <= log.getPosAmount());
        }

        if (this.mapQ.has(qTypes.filters.amount.max)) {
            filters.push(this.mapQ.get(qTypes.filters.amount.max) >= log.getPosAmount());
        }

        if (this.mapQ.has(qTypes.filters.date.from)) {
            filters.push(this.mapQ.get(qTypes.filters.date.from) <= log.time_logged_unix_day);
        }

        if (this.mapQ.has(qTypes.filters.date.until)) {
            filters.push(this.mapQ.get(qTypes.filters.date.until) >= log.time_logged_unix_day);
        }

        if (this.mapQ.has(qTypes.filters.category)) {
            filters.push(this.mapQ.get(qTypes.filters.category).has(log.category));
        }

        return !filters.some(b => !b); //true if all array is true IFF given log answers all filters
    }

    resetAll() {
        this.mapQ.clear();
        this.updateURL();
    }

    resetFilters() {
        for (let type of this.mapQ.keys()) {
            if (qTypes.filters_arr.includes(type)) {
                this.mapQ.delete(type);
            }
        }
        this.updateURL();
    }

    getQ(qType) {
        return this.mapQ.get(qType);
        //not in map ==> undefined
    }

    setQ(qType, val) {
        //validators:
        console.log('----set-----');
        if (qType === qTypes.search) {
            val = val.toLowerCase();
        }
        if (qType === qTypes.filters.amount.max ||qType === qTypes.filters.amount.min) {
            val=parseInt(val);
        }
        if (qType === qTypes.filters.date.from || qType === qTypes.filters.date.until) {
            let prev=val;
            if(isNaN(val)) val = new Date(val).setHours(0, 0, 0, 0);
            else val=parseInt(val);
            console.log(`${prev} --> ${val}`);
        }

        if(this.validateBeforeSet(qType,val)) {
            console.log('set: '+qType);
            this.mapQ.set(qType, val);
        } else{
            this.delQ(qType);
        }
        this.updateURL();
    }

    delQ(qType) {
        this.mapQ.delete(qType);
        this.updateURL();
    }

    getValMap() {
        //turns every value of query to a text (shown in filters bar)
        let msgMap = new Map();
        for (let key of this.mapQ.keys()) {
            if (key === qTypes.filters.type) {
                msgMap.set(key, this.mapQ.get(key) === 'exp' ? 'Expanses Only' : 'Incomes Only');
            } else if (key === qTypes.filters.date.from || key === qTypes.filters.date.until) {
                let options = {year: 'numeric', month: 'numeric', day: 'numeric'};
                let str = new Intl.DateTimeFormat('en-IL', options).format(this.mapQ.get(key));
                msgMap.set(key, str);
            } else if (key === qTypes.filters.category) {
                let str = Array.from(this.mapQ.get(key)).join(', ');
                msgMap.set(key, str);
            } else {
                msgMap.set(key, this.mapQ.get(key));
            }
        }
        console.log(msgMap);
        return msgMap;
    }

    isEmpty() {
        return this.mapQ.size === 0;
    }

    updateURL() {
        //gets data from here and sends it to url
        window.location.hash = Helpers.parseMAPtoHASH(this.mapQ);
    }

    getQueriesFromURL() {
        if (!window.location.hash) return false;
        let params = Helpers.parseHASHtoOBJ(window.location.hash);
        console.log(params);
        console.log(this);
        //parse strings from url if needed
        if(params[qTypes.filters.category])
                params[q] = new Set(params[q].split(',').map(cat=>Categories.getTitle(cat)));


        //check if url is different than current queries
        let isUserChange=false;
        for (let q of qTypes.qtypes_arr){
            if (params[q]===undefined ^ this.getQ(q)===undefined) isUserChange=true;
            else if(params[q]!==undefined && this.getQ(q)!==undefined
                && params[q]!=this.getQ(q)) {
                isUserChange = true;
                console.log((""+params[q]!==undefined) +" & "+ (""+this.getQ(q)!==undefined) + " & "+(""+params[q]!==this.getQ(q)));
            }
        }
        console.log('user changed the url? '+isUserChange);
        if(!isUserChange) return false;


        this.resetAll();
        for (let [type, val] of Object.entries(params)) {
            if (qTypes.qtypes_arr.includes(type)) this.setQ(type, val);
        }
        return true; //user change
    }

     validateBeforeSet(qType, val) {
        //false ~ validation failed
        if (qType === qTypes.filters.type && (val !== 'exp' && val !== 'inc'))  return false;

        if (qType === qTypes.search && !val.trim()) return false;
        if ((qType === qTypes.filters.amount.max ||qType === qTypes.filters.amount.min) && isNaN(val)) return false;
        if((qType === qTypes.filters.date.until || qType ===qTypes.filters.date.from) && isNaN(val) ) return false;
        if(qType === qTypes.filters.category && val.size===0) return false;

        return true;
    }


    //mini helpers:
    getDateToForm(qType) {
        if (this.getQ(qType)) {
            let timezoneFactor = new Date().getTimezoneOffset() * 60000;
            return new Date(this.mapQ.get(qType) - timezoneFactor).toISOString().split('T')[0];
        }
        else return undefined;

    }

}

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

export const getData = {

    getLogs: async (state) => { //!could Throw error!
        const res = await fetch(window.from_server.url_for.json_logs);
        let json_logs = await res.json();

        let logs = [];
        for (let log of json_logs) {
            logs.push(Log.parseTo(log));
        }
        state.logs = logs;
    },

    getCategories: async (obj) => { //!could Throw error!
        try {
            const res = await fetch(window.from_server.url_for.json_categories);
            obj.categories = await res.json();
        } catch (err) {
            state.categories = null;
            console.log('Error loading categories:')
            console.log(err);
        }

    }
};



export const Helpers = {
    removeDigits: (num, digits = 3) => {
        return parseInt(num * 10 ** digits) / 10 ** digits
    },

    parseHASHtoOBJ: (hash) => {
        let params = hash.slice(1).split('&');
        let obj = {};
        for (let p of params) {
            p = decodeURI(p).split('=');
            if (p[0] && p[1]) obj[p[0]] = p[1];
        }
        return obj;
    },

    parseMAPtoHASH: (map) => {
        let hash = "";
        for (let [type, val] of map.entries()) {
            if(val instanceof Set || val instanceof Array) val=Helpers.parseSETtoHASH(val);
            hash += `${type}=${val}&`;
        }
        return hash.slice(0, -1);
    },

    parseSETtoHASH: s =>{
        return Array.from(s).join(',');
    }

};