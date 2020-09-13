import Log, {Categories,TQuery, validators, getData, qTypes} from './table-model.js';
import {views, formUI, dialogUI, tableUI} from './table-view.js';
import {filtersUI,filtersControllerClass} from './filtersUI.js';

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
    isExpanded: false,
    filtered_logs: null,
    queries: new TQuery(),
    mark_o: null,

    categories: new Categories()
};

const logDialogController={
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
            check = validators.category(this.value, formUI.getLogType());
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
        let submit_type = formUI.get_form_data();
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
                    console.log('changed!')
                }
            }
            if (changed === 0) {
                event.preventDefault();
                return false;
            }
        }

        //ADD OR MODIFY:
        let flag = true;
        if (!formUI.getLogType()) {
            flag = false;
        }
        for (let field_id of views.fields_ids.slice(1)) {
            if (!logDialogController.validate_field.call(views[field_id])) {
                flag = false;
            }
        }

        if (!flag) {
            event.preventDefault();
        }
        return flag;
    },

    open_edit: (log) => {
        state.log = log;
        dialogUI.init_edit(state.log);
        formUI.onchange_type();
        formUI.remove_styles_invalid_editing();
        dialogUI.open();
    },

    open_add: () => {
        state.log = null;
        dialogUI.init_add();
        formUI.remove_styles_invalid_editing();
        dialogUI.open();
    },

}

const tableController = {
     setRowsListeners: () => {
        for (let log of state.logs) {
            views.btn_edit(log.id).addEventListener('click', logDialogController.open_edit.bind(undefined, log));
        }

    },

    load_table: async function (reload=false)  {

        //clearTable, renderSpinner
        tableUI.clearTable();
        tableUI.loading();

        state.isExpanded=false;
        state.logs = null;
        state.filtered_logs=null;

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
            console.log('%cerror', 'background:red;');
            console.info(err);
            alert(err);
            //print to table
            tableUI.error();
        }
    },

    load_filtered_table() {
        filtersUI.updateFiltersBar(state.queries);

        //if no filters - shows sums
        tableUI.toggleRowSum(state.queries.isEmpty());

        state.filtered_logs = state.queries.getFilteredLogs(state.logs);

        tableUI.filterRowByRow(state.filtered_logs, state.logs);

        tableUI.toggleResultsRow(!state.queries.isEmpty(),state.filtered_logs);
        filtersUI.styleByFilters(state.mark_o,state.queries);
    },
}


//onload script
window.addEventListener('load', function () {


    const filtersController = new filtersControllerClass(tableController.load_filtered_table);
    filtersUI.renderCategories(state.categories)
    views.inf_cat_div().addEventListener('click',filtersController.chooseCat);

    views.apply_on_fields((field) => {
        field.addEventListener('change', logDialogController.validate_field.bind(field));
        field.addEventListener('change', logDialogController.onchange_field.bind(field));
    });

    views.apply_on_filter_blocks(block => {
       views.filter_block_getDel(block).addEventListener('click',filtersController.deleteFilter.bind(filtersController,state.queries));
    });


    views.dialog_form.addEventListener('submit', logDialogController.validate_submit);

    views.open_add_btn.addEventListener('click', logDialogController.open_add);
    views.open_add_btn_small.addEventListener('click', logDialogController.open_add);

    views.submit_dialog.addEventListener('click', () => {
        views.dialog_form.dataset.type = 'submit'
    });
    views.delete_dialog.addEventListener('click', () => {
        views.dialog_form.dataset.type = 'delete'
    });

    views.log_type_exp.onchange = formUI.onchange_type;
    views.log_type_inc.onchange = formUI.onchange_type;

    views.filter_btn.addEventListener('click', filtersUI.open_dialog.bind(undefined, state.queries));
    views.search.addEventListener('input', filtersController.changeSearch.bind(filtersController,state.queries));
    views.filter_form.addEventListener('submit', filtersController.applyFilters.bind(filtersController,state.queries));
    views.filter_clear_all.addEventListener('click',filtersController.clearFilters.bind(filtersController,state.queries));
    window.addEventListener('hashchange',filtersController.onchange_URL_HASH.bind(filtersController,state.queries));

    views.expand_all_btn.addEventListener('click', tableUI.toggleAll.bind(undefined,state));
    views.sync_table_btn.addEventListener('click', tableController.load_table.bind(true));

    state.mark_o=new Mark(views.table);

    tableController.load_table();
});


window.func = tableUI.toggleAll

window.views=views;
window.state = state;