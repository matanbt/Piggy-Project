import {getData, helpers} from "./helpers.js";
import {chartsCalcs, ChartsUI} from "./logs-charts.js";
import {tableUI} from "./views/table-view.js";

const state = {
    logs: null,
    calcs: null,
    exampleChart: null,

}
const views = {
    example_chart: document.getElementById('net_per_month').getContext('2d'),

    balance: document.querySelector('#balance'),

    curr_month: document.querySelector('#curr_month'),
    net_month: document.querySelector('#net_month>span'),
    net_month_ic: document.querySelector('#net_month>svg'),
    month_desc: document.querySelector('#month_desc'),

    act_head: document.querySelector('#act_head'),
    act_desc: document.querySelector('#act_desc'),

    table: document.querySelector('#mini_table>tbody'),
}

const cardsUI = {

    loadCards: (state) => {
        //1 - balance
        views.balance.textContent = `${state.calcs.curr_balance} ₪`;
        views.balance.classList.remove('text-danger','text-success');
        views.balance.classList.add(`text-${state.calcs.curr_balance >= 0 ? 'success' : 'danger'}`);

        //2 - curr month
        let curr_month = helpers.getShortDate();
        views.curr_month.textContent = curr_month;

        let month_index=state.calcs.active_months.indexOf(curr_month);
        if (month_index === -1) {
            views.net_month.textContent = '-';
            views.month_desc.innerHTML = `No Expanses or Incomes of this month, yet.
                                        <a href='${from_server.url_for.table}'>Add...</a>`
        } else {
            let net_month = state.calcs.net_arr[month_index];
            let diff = helpers.removeDigits(Math.abs(net_month - state.calcs.net_avg),0);
            let diff_sign=net_month - state.calcs.net_avg;
            let msg;
            if (diff_sign >= 0) {
                views.net_month_ic.style.fill='#28a745';
                views.net_month_ic.querySelector('use')
                .setAttribute('href',from_server.url_for.static_icons+'#arrow-up');
                msg = `That's ${diff}₪ above the Monthly Average`;
            } else {
                views.net_month_ic.style.fill='#dc3545';
                views.net_month_ic.querySelector('use')
                .setAttribute('href',from_server.url_for.static_icons+'#arrow-down');
                msg = `That's ${diff}₪ below the Monthly Average`;
            }
            views.net_month.textContent = net_month+' ₪';

            views.month_desc.textContent = msg;
        }

        //3- activity:
        let weekAgo = new Date().setDate(new Date().getDate() - 7);
        let recent_logs_amount = state.logs.filter(el => el.utc_ms_verification >= weekAgo).length;
        if (recent_logs_amount === 0) {
            views.act_head.textContent = `Hey, Don't give up!`;
            views.act_desc.innerHTML = `No logs added lately, did you forget? 
                         <a href='${from_server.url_for.table}'> Add Now...</a>`;
        } else {
            views.act_head.textContent = recent_logs_amount < 5 ? `Good Job!` : `Amazing Job! :)`;
            views.act_desc.innerHTML = `Added ${recent_logs_amount} Logs lately, keep it going!
                         <a href='${from_server.url_for.table}'> Add more...</a>`;
        }

        //end
    }

}

const examplesUI ={
    loadChart(state){
        //keeps
        let newCalcs={
            active_months : state.calcs.active_months.slice(-3),
            exp_arr: state.calcs.exp_arr.slice(-3),
            inc_arr: state.calcs.inc_arr.slice(-3)
        }
        state.exampleChart = ChartsUI.expVSincMonthly(views.example_chart, newCalcs);
    },
  loadTable(state){
        let markup='';

        let logs=[...state.logs].sort((a,b)=> b.utc_ms_verification-a.utc_ms_verification);
        for(let log of logs.slice(0,3)){
            markup+=tableUI.makeTags_row(log,false,true);
        }

        views.table.innerHTML='';

        views.table.insertAdjacentHTML('beforeend',markup);
  }
};

window.addEventListener('DOMContentLoaded', async () => {
    await getData.getLogs(state);
    state.calcs = chartsCalcs.perMonth(state.logs);


    cardsUI.loadCards(state);
    examplesUI.loadTable(state);
    examplesUI.loadChart(state);
});

window.state=state;