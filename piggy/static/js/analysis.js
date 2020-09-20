import {views, miniTableUI} from './views/analysis-view.js';

import {ChartsUI} from "./logs-charts.js";

import {TQuery} from './models/log-querying.js';
import {getData} from './helpers.js';
import {Categories} from "./models/categories.js";

import {FiltersController} from './filters.js';
import {filtersUI} from "./views/filters-view.js";


const state = {
    logs: null,
    filtered_logs: null,
    queries: null,
    categories: new Categories(),
    charts: new ChartsUI(),

};


// on-scriptload gets data:
const init_page = async (refreshData = true) => {
    //todo set loaders
    miniTableUI.clearTable();
    state.charts.destroyCharts();

    //get data, else will use existing data in state.logs
    if (refreshData) {
        try {
            await getData.getLogs(state)
        } catch (err) {
            console.log(err);
            //todo render error
            return;
        }
    }

    filtersUI.updateFiltersBar(state.queries);
    state.filtered_logs = state.queries.getFilteredLogs(state.logs);

    if(state.filtered_logs.length===0){
        //todo zero stuff
    } else{

    //todo clear loaders (one by one), render graphs
   miniTableUI.renderTable(state.filtered_logs);

   state.charts.loadCharts(state.filtered_logs);

    }
};

window.addEventListener('DOMContentLoaded', async () => {
    //data
    await getData.getCategories(state.categories);
    state.queries = new TQuery(state.categories.getFullArr());

    //filters
    const filtersController = new FiltersController(init_page.bind(undefined, false));
    filtersController.onPageLoad(state, false, false);

    await init_page();

    //mini table
    views.miniTable.addEventListener('click', miniTableUI.toggleMonth.bind(undefined, state));
    views.sync_table_btn.addEventListener('click', init_page.bind(undefined, true));




});
window.state=state;
