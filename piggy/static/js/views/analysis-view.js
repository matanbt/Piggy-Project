import {tableUI} from './table-view.js';
import {helpers} from "../helpers.js";

export const views={
    miniTable : document.getElementById('mini_table'),
    miniTable_body: () => document.querySelector('#mini_table tbody'),
    table_rows : () => document.querySelectorAll('table#mini_table tbody tr'),
    sync_table_btn :document.getElementById('sync_table_btn'),


    graph_views :{
        expVSinc : 'exp_vs_inc',
        expVSincPerMonth : 'exp_vs_inc_per_month',
        netPerMonth : 'net_per_month',
        balanceTracker : 'balance_tracker',
        expPerCategory : 'exp_per_category',
        incPerCategory : 'inc_per_category',
    },
};

export const miniTableUI ={
    renderTable : function (logs) {
        let markup='';
        let [inc,exp,prevLog,balance]=[0,0,null,0];

        for (let log of logs){
            if (prevLog && log.getShortDate() !== prevLog.getShortDate()) {
                markup += this.makeTags_sumMonth(prevLog.getShortDate(),inc, exp,false);
                [inc,exp]=[0,0];
            }

            markup+=tableUI.makeTags_row(log,false);
            balance+=log.amount;
            inc += Math.max(0,log.amount);
            exp += Math.min(0,log.amount);

            prevLog=log;
        }
        if(prevLog) markup += this.makeTags_sumMonth(prevLog.getShortDate(),inc, exp,false);

        //footer balance:
        markup+=`<tr class='row-sum'>
                    <td colspan="3"><h5>Total Balance: ${balance}</h5></td>
                </tr>`
        views.miniTable.insertAdjacentHTML('beforeend',markup);
    },

    //todo add show and hide rows
    makeTags_sumMonth : (month,inc,exp,big_table=true) =>{
        let total=helpers.removeDigits(inc + exp);
        return `
        <tr class="row-sum" style="">
            <td colspan="${big_table ? 2 :1}"><b>-- ${month} --</b></td>
            <td colspan="${big_table ? 3 :2}" style="text-align: right !important;">
                <!--<small>${inc ? "In: "+inc: " "} ${inc&&exp ? " , " : ""} ${exp ? "Out: "+exp+" " : ""}</small> -->
                <span class="${total >=0 ?'inc' : 'exp'}_span" style="padding:0.7em;">
                <b>Total: ${total}</b> 
                </span>
                
                <button class='btn btn-secondary' style="vertical-align: initial; padding: 0.3em; margin-left:0.3em;" 
                type="button" id='btn-expand_month' data-month="${month}">
                    <svg class="icon-white">
                        <use href="${window.from_server.url_for.static}/my-icons.svg#more_ic"/>
                    </svg>
                </button>
                
            </td>
        </tr>
        `;
    },

    clearTable: () => {
        for (let row of views.table_rows()) { row.remove();}
    },

    toggleMonth : (state,event) =>{
        if(event.target.closest('button')){
            let shortDate=event.target.closest('button').dataset.month.replace(' ','_');
            for(let row of document.querySelectorAll(`tr.${shortDate}`)){
                row.style.display = row.style.display ==='none' ? '' : 'none';
            }
        }
    }



};

