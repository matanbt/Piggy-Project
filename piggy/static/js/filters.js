import Log from './models/log-model.js';
import {qTypes} from "./models/log-querying.js";
import {views,filtersUI} from "./views/filters-view.js";

export class FiltersController {
    //initiate FilterController instance with given Main-View-Loader
    constructor(loading_func) {
        //loading_func =: load_filtered_table (TABLE) or init_page (ANALYSIS)
        this.init_controller = loading_func;
    }

    changeSearch(queries) {
        let searchVal = views.search.value;
        queries.setQ(qTypes.search, searchVal);

        this.init_controller();
    }

    changeSort(queries, event) {
        if (!event.target.closest('svg')) return;
        let sort = event.target.closest('svg').id.split('_')[0];
        let order = 'asc';
        if (queries.getQ(qTypes.sortBy)) {
            if (queries.getQ(qTypes.sortBy).split('_')[0] === sort)
                order = queries.getQ(qTypes.sortBy).split('_')[1] === 'desc' ? 'asc' : 'desc';
        } else if (sort === 'date') order = 'desc';

        queries.setQ(qTypes.sortBy, `${sort}_${order}`);

        this.init_controller();
    }

    submitFiltersDialog(queries, event) {
        filtersUI.close_dialog();

        event.preventDefault();

        queries.resetFilters();
        filtersUI.getFiltersToQueries(queries);

        this.init_controller();
    }

    deleteFilter(queries, event) {
        let qtype = event.target.parentElement.id.slice(3);
        queries.delQ(qtype);
        filtersUI.updateInputs(queries);

        this.init_controller();
    }

    clearFilters(queries, event) {
        queries.resetAll();
        event.preventDefault();

        filtersUI.updateInputs(queries);
        this.init_controller();
    }

    //could be cause from my inner-js manual update OR user change
    onchange_URL_HASH(queries) {
        console.log('changed');
        //isUserChange iff user caused the change by modifying the URL
        let isUserURLChange = queries.getQueriesFromURL();

        if (isUserURLChange) {
            filtersUI.updateInputs(queries);
            this.init_controller();
        }
    }

    downloadCSV(state,event) {
        let logs = state.filtered_logs;
        let csv_cont = Log.logsArrToCSV(logs);

        let download = document.createElement('a');

        download.href = 'data:text/csv;charset=utf-8,' + csv_cont;
        download.download = "piggy_data.csv";

        document.body.appendChild(download);
        download.click();
        document.body.removeChild(download);

        event.preventDefault();
    }

    redirectByFilters(fromTable, event) {
        let hash = location.hash;
        location.href = `${fromTable ? from_server.url_for.analysis : from_server.url_for.table}${hash}`;

        event.preventDefault();
    }

    onPageLoad(state, onChangeSearchSort = true, fromTable = true) {
        filtersUI.renderCategories(state.categories);
        filtersUI.updateInputs(state.queries);

        views.inf_cat_div().addEventListener('click', filtersUI.chooseCat);

        views.apply_on_filter_blocks(block => {
            views.filter_block_getDel(block).addEventListener('click', this.deleteFilter.bind(this, state.queries));
        });

        views.filter_btn.addEventListener('click', filtersUI.open_dialog.bind(undefined, state.queries));
        views.filter_form.addEventListener('submit', this.submitFiltersDialog.bind(this, state.queries));
        views.filter_form.addEventListener('reset', filtersUI.reset_form_inDialog);
        views.filter_clear_all.addEventListener('click', this.clearFilters.bind(this, state.queries));
        window.addEventListener('hashchange', this.onchange_URL_HASH.bind(this, state.queries));

        if (onChangeSearchSort) {
            views.search.addEventListener('input', this.changeSearch.bind(this, state.queries));
            views.table_head_row.addEventListener('click', this.changeSort.bind(this, state.queries));
        }

        //side bar:
        views.a_exportCSV.addEventListener('click', this.downloadCSV.bind(undefined, state));
        views.a_takeFilters.addEventListener('click', this.redirectByFilters.bind(undefined, fromTable));

    }
}

