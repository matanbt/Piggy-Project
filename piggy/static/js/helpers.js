import Log from "./models/log-model.js";

export const getData = {
    getLogs: async (state) => { //!could Throw error!
        const res = await fetch(window.from_server.url_for.json_logs);
        if (!res.ok) throw `Error, response status:${res.status}`;
        let json_logs = await res.json();

        let logs = [];
        for (let log of json_logs) {
            logs.push(Log.parseTo(log));
        }
        state.logs = logs;
    },

    getCategories: async (obj) => { //!could Throw error!
        //get obj: Categories
        try {
            const res = await fetch(window.from_server.url_for.json_categories);
            if (!res.ok) throw `Error, response status:${res.status}`;
            obj.categories = await res.json();
        } catch (err) {
            console.log(err);
            obj.categories = null;
        }

    },

    setCategories : async (toAdd,toDelete) =>{
      const resp = await fetch('', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                toAdd,
                toDelete,
            })
        });
        return {
            ok : resp.ok,
            json : await resp.json()
        };
    }
};

export const extraUI = {

    setSpinner : (parent,tr_wrap_colspan=undefined) =>{
        const spinner=`<div class="d-flex align-items-center justify-content-center ${! tr_wrap_colspan ? 'spinner-cont' :''}">
                       <div class="spinner-border" role="status">
                       <span class="sr-only">Loading...</span></div></div>`
        const wrapped=`<tr class="spinner-cont"><td colspan="${tr_wrap_colspan}">${spinner}</td></tr>`;
        parent.insertAdjacentHTML('beforeend',tr_wrap_colspan ? wrapped : spinner);
    },

    delSpinner :(parent) =>{
        //parent could also be a general ancestor
      parent.querySelector('.spinner-cont').remove();
    },

    getErrorMarkup :()=>{
        return `
                <div class="d-flex align-items-center justify-content-center text-white bg-danger">
                    Error!
                </div>`;
    }

}

export const helpers = {
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
            if (val instanceof Set || val instanceof Array) val = helpers.parseSETtoHASH(val);
            hash += `${type}=${val}&`;
        }
        return hash.slice(0, -1);
    },

    parseSETtoHASH: s => {
        return Array.from(s).join(',');
    },

    isSetsEqual: (a, b) => {
        if (a.size !== b.size) return false;
        for (let el of a) {
            if (!b.has(el)) return false;
        }
        return true;
    },

    async loadResponse(resp) {
        document.querySelector('html').innerHTML = await resp.text();
        dispatchEvent(new Event('load'));
    },

    getNowToForm() {
        //return new Date().toISOString().split('.')[0].slice(0, -3);
        let timezoneFactor = new Date().getTimezoneOffset() * 60000;
        return new Date(Date.now() - timezoneFactor).toISOString().split('.')[0].slice(0, -3);
    },

     getShortDate() {
        let options = {month: "short", year: "2-digit"};
        return new Intl.DateTimeFormat('en-IL', options).format(Date.now());
    }


};