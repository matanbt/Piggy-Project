import {helpers} from "../helpers.js";
import {Categories} from "./categories.js";

export const qTypes = {
    search: 'search',
    sortBy: 'sortBy',
    filters: {
        type: 'type', //inc/exp/''
        date: {from: 'date_from', until: 'date_until'}, //int of unix date
        amount: {min: 'amount_min', max: 'amount_max'}, //will calculate in ABS
        category: 'category' //set of cats
    },

    filters_arr: ['type', 'date_from', 'date_until', 'amount_min', 'amount_max', 'category'],
    sort_arr : ['date','amount','category'],
    sort_order_arr : ['desc','asc'],
}
qTypes.qtypes_arr = [qTypes.sortBy,qTypes.search, ...qTypes.filters_arr];



export class TQuery {

    constructor(categories_array) {
        this.mapQ = new Map();
        this.categories_array =categories_array;
        this.getQueriesFromURL();
    }


    getFilteredLogs(logs) {
        if (this.isEmpty()) return logs; //no filters

        //filter:
        let filtered = [];
        for (let log of logs) {
            if (this.logAnswersFilters(log)) {
                filtered.push(log);
            }
        }

        //sort:
        let [sort,order] = ['date','asc']; //default order
        if(this.mapQ.has(qTypes.sortBy)){
            [sort,order] = this.mapQ.get(qTypes.sortBy).split('_');
        }
        let comparator;
        if(sort==='date') comparator = (a,b) =>{
            [a,b] = [a.time_logged_unix_day,b.time_logged_unix_day];
             return (b-a) * (order==='desc' ? -1 : 1);
        }
        if(sort==='amount') comparator=(a,b) =>{
            [a,b] = [a.amount,b.amount];
            return (b-a) * (order==='desc' ? -1 : 1);
        }
        else if (sort==='category') comparator = (a,b) =>{
            a=a.getCategoryOnly();
            b=b.getCategoryOnly();
            return order==='desc' ? b.localeCompare(a) : a.localeCompare(b);
        }

        filtered.sort(comparator);

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
        //parse values:
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
        }


        //validate values
        if(this.validateBeforeSet(qType,val)) {
            console.log('set: '+qType);
            this.mapQ.set(qType, val);
        } else {
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
                let str = Array.from(this.mapQ.get(key)).map(el => Categories.getTitle(el)).join(', ');
                msgMap.set(key, str);
            } else if (key === qTypes.sortBy){
                let str=this.mapQ.get(key).split('_')[0]
                    + (this.mapQ.get(key).split('_')[1] ==='desc' ? ' (Descending)' :'');
                msgMap.set(key, str);
            }else {
                msgMap.set(key, this.mapQ.get(key));
            }
        }

        return msgMap;
    }

    isEmpty() {
        return this.mapQ.size === 0;
    }

    updateURL() {
        //gets data from here and sends it to url
        window.location.hash = helpers.parseMAPtoHASH(this.mapQ);
    }

    getQueriesFromURL() {
        if (!window.location.hash) return false;
        let params = helpers.parseHASHtoOBJ(window.location.hash);
        console.log(params);
        console.log(this);
        //parse strings from url if needed
        if(params[qTypes.filters.category])
                params[qTypes.filters.category] = new Set(params[qTypes.filters.category].split(','));


        //check if url is different than current queries
        let isUserChange=false;
        for (let q of qTypes.qtypes_arr){
            if (params[q]===undefined ^ this.getQ(q)===undefined) isUserChange=true;
            else if(q === qTypes.filters.category) {
              if (params[q]!==undefined && this.getQ(q)!==undefined &&
                  !helpers.isSetsEqual(params[q],this.getQ(q))) isUserChange=true;
            }
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
        if(qType === qTypes.filters.category){
            if (val.size===0) return false;
            if (Array.from(val).filter(el=> !this.categories_array.includes(el)).length !==0) return false;
        }
        if(qType === qTypes.sortBy && (val==='date_asc' ||
            ! qTypes.sort_order_arr.includes(val.split('_')[1])||! qTypes.sort_arr.includes(val.split('_')[0])) )
            return false;

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