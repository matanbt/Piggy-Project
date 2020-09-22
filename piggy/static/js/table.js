import {Categories} from './models/categories.js';
import {TQuery} from './models/log-querying.js';
import {getData} from "./helpers.js";
import {validators} from './models/log-model.js';

import {views, logFormUI, dialogUI, tableUI} from './views/table-view.js';

import {filtersUI} from './views/filters-view.js';
import {FiltersController} from './filters.js';

/*
* - logs - array of users log, sent from the server
* - log - Instance of Log, represents the current log in Dialog
*         (to change the json-object-design go do piggy.models.Log.serialize_dev)
* -isExpanded - if all row were expanded by click
* -queries - object represent the current queries applied on table
 */
const state = {
    log: null,
    logs: null,
    filtered_logs: null,

    queries: null,
    categories: new Categories(),

    //UI vars:
    isExpanded: false,
    mark_o: null,
};

const logDialogController = {
    //fields helpers (requires call from field)
    check_is_changed: {
        amount: () => parseFloat(views.amount.value) !== state.log.getPosAmount(),
        time_logged: () => views.time_logged.value !== state.log.getTimeToForm(),
        category: () => views.category.value !== state.log.category,
        title: () => views.title.value.trim() !== state.log.title
    },

    onchange_field: function () {
        //THIS - in the field's context
        if (state.log) {
            if (logDialogController.check_is_changed[this.id]()) {
                this.classList.add('editing');
            } else {
                this.classList.remove('editing');
            }
        }
    },

    validate_field: function () {
        //THIS - in the field's context
        let check = false;
        if (this === views.category) {
            check = validators.category(this.value, logFormUI.getLogType());
        } else {
            check = validators[this.id](this.value);
        }
        if (check) {
            this.classList.remove('is-invalid');
            return true;
        } else {
            this.classList.add('is-invalid');
            return false;
        }
    },

    validate_submit: (event) => {
        logFormUI.disableSubmits(true);
        views.title.value= views.title.value.trim();

        let submit_type = logFormUI.get_form_data();
        views.dialog_form.dataset.type = '';

        // DELETE:
        if (submit_type === 'delete') {
            return true;
        }

        //MODIFY - CASE: NO-CHANGES
        if (state.log) {
            let changed = 0;
            for (let isChanged_func of Object.values(logDialogController.check_is_changed)) {
                if (isChanged_func()) {
                    changed++;
                }
            }
            if (changed === 0) {
                event.preventDefault();
                logFormUI.disableSubmits(false);
                return false;
            }
        }

        //ADD OR MODIFY:
        let flag = true;
        if (!logFormUI.getLogType()) {
            flag = false;
        }
        for (let field_id of views.fields_ids.slice(1)) {
            if (!logDialogController.validate_field.call(views[field_id])) {
                flag = false;
            }
        }

        if (!flag) {
            event.preventDefault();
            logFormUI.disableSubmits(false);
        }
        return flag;
    },

    open_edit: (log) => {
        state.log = log;
        dialogUI.init_edit(state.log);
        logFormUI.onchange_type();
        logFormUI.remove_styles_invalid_editing();
        dialogUI.open();
    },

    open_add: () => {
        state.log = null;
        dialogUI.init_add();
        logFormUI.remove_styles_invalid_editing();
        dialogUI.open();
    },

}

const tableController = {
    setRowsListeners: () => {
        for (let log of state.logs) {
            views.btn_edit(log.id).addEventListener('click', logDialogController.open_edit.bind(undefined, log));
        }
    },

    load_table: async function () {

        //clearTable, renderSpinner
        tableUI.clearTable();
        tableUI.loading();

        state.isExpanded = false;
        state.logs = null;
        state.filtered_logs = null;

        try {
            await getData.getLogs(state);

            //renderTable
            tableUI.clearTable();
            tableUI.renderTable(state.logs);

            //load filtered table (+updates filtered logs)
            filtersUI.updateInputs(state.queries);
            tableController.load_filtered_table();

            //setRowsListeners:
            tableController.setRowsListeners();

        } catch (err) {
            console.log(err);
            tableUI.error();
        }
    },

    //filters current Log Table by current TQuery Object, also updates Filters Bar
    load_filtered_table() {
        filtersUI.updateFiltersBar(state.queries);

        //calculate Filtered-Logs and filters the table-view
        state.filtered_logs = state.queries.getFilteredLogs(state.logs);
        tableUI.filterRowByRow(state.filtered_logs, state.logs);

        //if no filters --> shows Monthly Sums
        tableUI.toggleRowSum(state.queries.isEmpty());

        //if filters --> styles
        tableUI.toggleResultsRow(!state.queries.isEmpty(), state.filtered_logs);
        tableUI.styleTableByFilters(state.mark_o, state.queries);
    },
}


//onload script
window.addEventListener('DOMContentLoaded', async function () {
    tableUI.loading();

    state.mark_o = new Mark(views.table);
    await getData.getCategories(state.categories);

    state.queries = new TQuery(state.categories.getFullArr());


    //filters
    const filtersController = new FiltersController(tableController.load_filtered_table);
    filtersController.onPageLoad(state, true, true);


    //log dialog
    {
        views.apply_on_fields((field) => {
            field.addEventListener('change', logDialogController.validate_field.bind(field));
            field.addEventListener('change', logDialogController.onchange_field.bind(field));
        });

        views.dialog_form.addEventListener('submit', logDialogController.validate_submit);
        //views.open_add_btn.addEventListener('click', logDialogController.open_add);
        views.open_add_btn_small.addEventListener('click', logDialogController.open_add);

        views.submit_dialog.addEventListener('click', () => {
            views.dialog_form.dataset.type = 'submit';
        });
        views.delete_dialog.addEventListener('click', () => {
            views.dialog_form.dataset.type = 'delete';
        });

        views.log_type_exp.onchange = logFormUI.onchange_type;
        views.log_type_inc.onchange = logFormUI.onchange_type;
    }


    //table
    {
        views.expand_all_btn.addEventListener('click', tableUI.toggleAll.bind(undefined, state));
        views.sync_table_btn.addEventListener('click', tableController.load_table);
    }

    tableController.load_table();
});

window.state = state;
