import Log, {TQuery, getData, qTypes} from './table-model.js';
import {myViews, miniTableUI} from './analysis-view.js';
import {views} from './table-view.js';
import {filtersControllerClass, filtersUI} from './filtersUI.js';

const state = {
    logs: null,
    fLogs: null,
    queries: new TQuery(),
};

// on-scriptload gets data:
const init_page = async (refreshData = true) => {

    //todo render loaders all over, clear graphs all over
    miniTableUI.clearTable();

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
    state.fLogs = state.queries.getFilteredLogs(state.logs);

    //todo clear loaders (one by one), render graphs
    console.log(state.logs);
    miniTableUI.renderTable(state.fLogs);

}

const onchange_URL_HASH = () =>{
        //could be cause from my inner-js manual update OR user change
        //isUserChange iff user caused the change by modifying the URL
        let isUserURLChange = state.queries.getQueriesFromURL();

        if(isUserURLChange) {
            filtersUI.updateFiltersBar(state.queries);
            init_page(false);
        }
    }


const filtersController = new filtersControllerClass(init_page.bind(undefined,false));


window.addEventListener('load', () => {
    console.log('loaded');


    init_page();

    myViews.miniTable.addEventListener('click', miniTableUI.toggleMonth.bind(undefined, state));

    views.filter_btn.addEventListener('click', filtersUI.open_dialog.bind(undefined, state.queries));
    views.filter_form.addEventListener('submit', filtersController.applyFilters.bind(filtersController,state.queries));
    views.filter_clear_all.addEventListener('click',filtersController.clearFilters.bind(filtersController,state.queries));
    window.addEventListener('hashchange',filtersController.onchange_URL_HASH.bind(filtersController,state.queries));
      views.apply_on_filter_blocks(block => {
       views.filter_block_getDel(block).addEventListener('click',filtersController.deleteFilter.bind(filtersController,state.queries));
    });











    let ctx = document.getElementById('myChart').getContext('2d');
    let chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'My First dataset',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [0, 10, 5, 2, 20, 30, 45]
            }]
        },

        // Configuration options go here
        options: {}
    });
});

 window.state = state;
