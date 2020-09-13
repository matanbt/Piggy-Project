import {tableUI} from './table-view.js';
import {Helpers} from "./table-model.js";

export const myViews={
    miniTable : document.getElementById('mini_table'),
    miniTable_body: () => document.querySelector('#mini_table tbody'),
    table_rows : () => document.querySelectorAll('table#mini_table tbody tr'),
};

export const miniTableUI ={
    renderTable : function (logs) {
        let markup='';
        let [inc,exp,prevLog]=[0,0,null];
        console.log(logs);
        for (let log of logs){
            if (prevLog && log.getShortDate() !== prevLog.getShortDate()) {
                markup += this.makeTags_sumMonth(prevLog.getShortDate(),inc, exp,false);
                [inc,exp]=[0,0];
            }

            markup+=tableUI.makeTags_row(log,false);
            inc += Math.max(0,log.amount);
            exp += Math.min(0,log.amount);

            prevLog=log;
        }
        if(prevLog) markup += this.makeTags_sumMonth(prevLog.getShortDate(),inc, exp,false);
        myViews.miniTable.insertAdjacentHTML('beforeend',markup);
    },

    //todo add show and hide rows
    makeTags_sumMonth : (month,inc,exp,big_table=true) =>{
        let total=Helpers.removeDigits(inc + exp);
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
        for (let row of myViews.table_rows()) { row.remove();}
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

export const filtersUI ={

};