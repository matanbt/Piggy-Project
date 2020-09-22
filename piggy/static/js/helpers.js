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

    setCategories: async (toAdd, toDelete) => {
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
            ok: resp.ok,
            json: await resp.json()
        };
    }
};

export const extraUI = {

    setSpinner: (parent, tr_wrap_colspan = undefined) => {
        const spinner = `<div class="d-flex align-items-center justify-content-center ${!tr_wrap_colspan ? 'spinner-cont' : ''}">
                       <div class="spinner-border" role="status">
                       <span class="sr-only">Loading...</span></div></div>`
        const wrapped = `<tr class="spinner-cont"><td colspan="${tr_wrap_colspan}">${spinner}</td></tr>`;
        parent.insertAdjacentHTML('beforeend', tr_wrap_colspan ? wrapped : spinner);
    },

    delSpinner: (parent) => {
        //parent could also be a general ancestor
        parent.querySelector('.spinner-cont').remove();
    },

    getErrorMarkup: (msg) => {
        return `
                <div class="d-flex align-items-center justify-content-center text-white bg-${msg ? 'info' : 'danger'}">
                    ${msg ? msg : 'Error!'}
                </div>`;
    },

    // HTML CODE TO INJECT

    // --> Pages: Home, Table, Analysis
    //  makes log-row for a table, table_type in (big, med,sm)
    //  (when 'big' used in table-page, 'med' used in analysis-page, and 'sm' in home)
    makeTags_row: (log, size) => { //

        let markup = `<tr id='row_${log.id}' class="${size === 'med' ?
            log.getShortDate().replace(' ', '_') : 'log_row'}"
                style="${size === 'med' ? 'display:none;' : ''}">`;

        if (size === 'big') markup += `  <td>${log.getShortDate()}</td>`;

        markup += `<td>${size === 'big' ? log.getMedDate() : log.getMedDate()}</td>
                    <td class="${log.getShortType()}_cell">${log.amount}</td>
                    <td>${log.getCategoryOnly()}
                    ${size === 'med' ? `<small style='display: block; font-weight: bold'>${log.title}</small>` : ''}
                    </td>`

        if (size === 'big') {
            markup += `<td>
                            <button class='btn btn-info' type="button" id='btn-expand_${log.id}' data-target="#expand-row_${log.id}"
                                    data-toggle="collapse" aria-expanded="false">
                                <svg class="icon-white">
                                    <use href="${window.from_server.url_for.static}/my-icons.svg#more_ic"/>
                                </svg>
                            </button>
                        </td>
                    <tr class="collapse" id='expand-row_${log.id}'>
                        <td>
                        <svg class="icon">
                            <use href='${window.from_server.url_for.static}/my-icons.svg#expanded-row_ic'>
                        </svg>
                        </td>
                        <td>${log.getTime()}</td>
                        <td colspan="2"><b>${log.title}</b></td>
                        <td>

                        <button class='btn btn-warning' type="button" title='Edit' id='btn-edit_${log.id}'>
                                <svg class="icon">
                                    <use href='${window.from_server.url_for.static}/my-icons.svg#edit_ic'>
                                </svg>
                            </button>
                        </td>
                                                
                    </tr>`;
        }
        markup += `</tr>`;

        return markup;
    },

    // --> Pages: Table, Analysis
    // makes monthly-summarize-row for a table
    //@param size in ('med','big')
    makeTags_sumMonth: (month, inc, exp, isBefore = -1, size) => {
        let total = helpers.removeDigits(inc + exp);
        let markup = `<tr class="row-sum" ${size === 'big' ? `data-isBefore='${isBefore}'` : ''}>
            <td colspan="${size === 'big' ? 2 : 1}"><b>-- ${month} --</b></td>
            <td colspan="${size === 'big' ? 3 : 2}" style="text-align: right !important;">`

        if (size === 'big')
            markup += `<small>${inc ? "In: " + inc : " "} ${inc && exp ? " , " : ""} ${exp ? "Out: " + exp + " " : ""}</small> `

        markup += `<span class="${total >= 0 ? 'inc' : 'exp'}_span" style="padding:0.7em;">
                <b>Total: ${total}</b>
                </span>`

        if (size === 'med')
            markup += ` <button class='btn btn-secondary' style="vertical-align: initial; padding: 0.3em; margin-left:0.3em;" 
                type="button" id='btn-expand_month' data-month="${month}">
                    <svg class="icon-white">
                        <use href="${window.from_server.url_for.static}/my-icons.svg#more_ic"/>
                    </svg>
                </button>`

        markup += `</td></tr>`

        return markup;
    },

    // --> Pages: Table
    //makes filters-results-summarize-row for a table
    makeTags_sumResults: () => {
        return `
        <tfoot>
        <tr id="sum_results" class="row-sum" style="display:none;text-align: center;"><td colspan="5">
            Found <b><span></span></b> Matches.
        </td></tr>
        </tfoot>
        `;
    },

    // --> Pages: Table, Analysis (@Filters Dialog)
    //  makes small category badge, used in FiltersUI
    makeTags_category: (id, title) => {
        return `<a href="" id="${id}" class="badge badge-secondary mr-1">${title}</a>`;
    }

};

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
