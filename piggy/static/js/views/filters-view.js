import {qTypes} from "../models/log-querying.js";
import {extraUI} from "../helpers.js";

export const views={
   //filters
    search : document.getElementById('filter_search'),

    filter_bar : document.getElementById('filter_status_bar'),

    //status bar - filters
    filter_block : qType => document.querySelector(`.t_block#fb_${qType}`),
    filter_block_text : qType => document.querySelector(`.t_block#fb_${qType}`).querySelector('.fb-text'),
    filter_block_getDel : block => block.querySelector('.del-t_block'),
    filter_clear_all : document.getElementById('clear_filters'),

    //filters-Modal form (inf=input-filter)
    filter_btn : document.getElementById('btn_filter_dialog'),
    filter_form : document.getElementById('filter_form'),
    filter_field : (qtype) => document.getElementById(`filter_${qtype}`),
    inf_type : document.getElementById('filter_type'),
    inf_date_from : document.getElementById('filter_date_from'),
    inf_date_until : document.getElementById('filter_date_until'),
    inf_amount_min : document.getElementById('filter_amount_min'),
    inf_amount_max : document.getElementById('filter_amount_max'),
    inf_cat_div : (type) => document.getElementById(`filter_cat${type? '_'+type : ''}`),
    inf_cat_chosen : () => document.getElementById('filter_cat').querySelectorAll('.badge-primary'),
    inf_cat_all : () => document.getElementById('filter_cat').querySelectorAll('a'),

    //side bar
    a_exportCSV : document.querySelector('a#a_export_csv'),
    a_takeFilters : document.querySelector('a#a_take_filters'),

    //big table sort:
    table_head_row : document.querySelector('#logs_table thead'),


    apply_on_filter_blocks : function(func_to_apply){
        for(let qtype of qTypes.qtypes_arr){
            func_to_apply(views.filter_block(qtype));
        }
    },

};

export const filtersUI = {

    //render given categories in HTML page
    renderCategories: (categories) => {
        for (let cat of categories.getMap().entries()) {
            views.inf_cat_div(cat[1].type).insertAdjacentHTML('beforeend', extraUI.makeTags_category(cat[0], cat[1].title));
        }
    },

    //gets filters from filters' dialog to TQuery Object
    getFiltersToQueries: (queries) => {
        for (let q of qTypes.qtypes_arr) {
            //category:
            if (q === qTypes.filters.category) {
                if (views.inf_cat_chosen().length > 0) {
                    let chosen = Array.from(views.inf_cat_chosen()).map(el => el.id);
                    queries.setQ(qTypes.filters.category, new Set(chosen));
                }
            }
            //sort:
            else if (q === qTypes.sortBy) continue;
            //any other qType:
            else if (views.filter_field(q).value) queries.setQ(q, views.filter_field(q).value);
        }

    },

    //prints queries to Filters Bar
    updateFiltersBar: (queries) => {
        if (queries.isEmpty()) {
            views.filter_bar.style.display = 'none';
        } else {
            views.filter_bar.style.display = '';

            let valMap = queries.getValMap();
            for (let qtype of qTypes.qtypes_arr) {
                if (valMap.has(qtype)) {
                    views.filter_block_text(qtype).innerText = valMap.get(qtype);
                    views.filter_block(qtype).style.display = 'inline-block';
                } else {
                    views.filter_block(qtype).style.display = 'none';
                }
            }

        }

    },

    //updates queries fields by given TQuery Object
    updateInputs: (queries) => {
        for (let qtype of qTypes.qtypes_arr) {
            //update date:
            if ((qtype === qTypes.filters.date.until || qtype === qTypes.filters.date.from) && queries.getQ(qtype) !== undefined) {
                //"0001-01-01"
                views.filter_field(qtype).value = queries.getDateToForm(qtype);
            }

            //update category:
            else if (qtype === qTypes.filters.category) {
                Array.from(views.inf_cat_all()).forEach(el => filtersUI.toggle_category_inDialog(el.id, true));
                if (queries.getQ(qtype) !== undefined) {
                    Array.from(queries.getQ(qtype)).forEach(id => filtersUI.toggle_category_inDialog(id, false));
                }
            }

            //update sortBy:
            else if (qtype === qTypes.sortBy) continue;

            //update other fields
            else views.filter_field(qtype).value = queries.getQ(qtype) !== undefined ? queries.getQ(qtype) : '';
        }
    },

    close_dialog: () => {
        $('#filter_popup').modal('hide');
    },
    open_dialog: () => {
        $('#filter_popup').modal('show');
    },

    //un.highlight given category as a Badge in Filters Dialog
    toggle_category_inDialog: (id, unhighlight = undefined) => {
        let elem = document.querySelector(`#${id}`);
        if (unhighlight === undefined) unhighlight = Array.from(elem.classList).includes('badge-primary');

        if (unhighlight) {
            elem.classList.remove('badge-primary');
            elem.classList.add('badge-secondary');
        } else {
            elem.classList.add('badge-primary');
            elem.classList.remove('badge-secondary');
        }
    },

    //toggles category Badge in Filters Dialog on-click
    chooseCat(event) {
        if (event.target.tagName === 'A') {
            filtersUI.toggle_category_inDialog(event.target.id);
            event.preventDefault();
        }
    },


    reset_form_inDialog: () => {
        Array.from(views.inf_cat_all()).forEach(el => filtersUI.toggle_category_inDialog(el.id, true));
    },
};