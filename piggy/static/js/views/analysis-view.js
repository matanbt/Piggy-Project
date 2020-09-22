import {tableUI} from './table-view.js';
import {extraUI, helpers} from "../helpers.js";

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
                markup += extraUI.makeTags_sumMonth(prevLog.getShortDate(),inc, exp,undefined,'med');
                [inc,exp]=[0,0];
            }

            markup+=extraUI.makeTags_row(log,'med');
            balance+=log.amount;
            inc += Math.max(0,log.amount);
            exp += Math.min(0,log.amount);

            prevLog=log;
        }
        if(prevLog) markup += extraUI.makeTags_sumMonth(prevLog.getShortDate(),inc, exp,undefined,'med');

        //footer balance:
        markup+=`<tr class='row-sum'>
                    <td colspan="3"><h5>Total Balance: ${balance}</h5></td>
                </tr>`
        views.miniTable.insertAdjacentHTML('beforeend',markup);
    },



    clearTable: () => {
        for (let row of views.table_rows()) { row.remove();}
    },

    loading : ()=>{
        extraUI.setSpinner(views.miniTable,3);
    },

    error : (msg) =>{
        views.miniTable.insertAdjacentHTML('beforeend', `<tr><td colspan="3">
            ${extraUI.getErrorMarkup(msg)}
            </td></tr>`);
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

