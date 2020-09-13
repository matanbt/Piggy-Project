import {qTypes} from "./table-model.js";
import {views} from "./table-view.js";


export const filtersUI = {
    renderCategories : (categories)=>{
        for (let cat of categories.getMap().entries()){
            views.inf_cat_div(cat[1].type).insertAdjacentHTML('beforeend',filtersUI.makeTags_category(cat[0],cat[1].title));
        }
    },

    getFiltersToQueries: (queries) => {
        for (let q of qTypes.qtypes_arr_) {
            if (views.filter_field(q).value) queries.setQ(q, views.filter_field(q).value);
        }
        if (views.inf_cat_chosen().length > 0) {
            let chosen=Array.from(views.inf_cat_chosen()).map(el => el.id);
            queries.setQ(qTypes.filters.category, new Set(chosen));
        }
        console.log(queries);
    },

    updateFiltersBar: (queries) => {
        //updates status bar AND updates the filter fields AND updates row-sums
        if(queries.isEmpty()){
            views.filter_bar.style.display='none';

        } else{
            views.filter_bar.style.display='';

            let valMap = queries.getValMap();
            for (let qtype of qTypes.qtypes_arr) {
            if (valMap.has(qtype)) {
                views.filter_block_text(qtype).innerText = valMap.get(qtype);
                views.filter_block(qtype).style.display = 'inline-block';
            } else {
                views.filter_block(qtype).style.display = 'none';
                if (qtype === qTypes.sortBy || qtype === qTypes.filters.category) {
                    //todo sortby, categories
                }
            }
        }

        }

    },

    updateInputs: (queries) => {
        console.log('updates inputs');
        for (let qtype of qTypes.qtypes_arr_) {
            //update date:
            if((qtype === qTypes.filters.date.until || qtype === qTypes.filters.date.from) && queries.getQ(qtype) !== undefined)
            {
                //"0001-01-01"
                views.filter_field(qtype).value = queries.getDateToForm(qtype);
            }
            //update category:
            else if (qtype === qTypes.filters.category){
                if(queries.getQ(qtype) !== undefined){

                }
                else{

                }

            }

            //update other fields
            else views.filter_field(qtype).value = queries.getQ(qtype) !== undefined ? queries.getQ(qtype) : '';
        }
    },

    styleByFilters(table_mark, queries) {
        table_mark.unmark();
        if (queries.getQ(qTypes.search)) {
            table_mark.mark(queries.getQ(qTypes.search));
        }
    },

    close_dialog: () => {
        $('#filter_popup').modal('hide');
    },
    open_dialog: (queries) => {
        //update form-queries TODO
        $('#filter_popup').modal('show');
    },

    makeTags_category : (id,title) =>{
        return `<a href="" id="${id}" class="badge badge-secondary mr-1">${title}</a>`;
    },

    toggle_category : (id,highlight) =>{
        let elem=document.querySelector(`#${id}`);
        if (highlight===undefined) highlight=Array.from(elem.classList).includes('badge-primary')
        if (highlight) {
            elem.classList.remove('badge-primary');
            elem.classList.add('badge-secondary');
        } else{
            elem.classList.add('badge-primary');
            elem.classList.remove('badge-secondary');
        }
    }
}

export class filtersControllerClass {
    constructor(loading_func) {
        //load_filtered_table (TABLE) or init_page (ANALYSIS)
        this.init_controller = loading_func;
    }

    changeSearch(queries) {
        let searchVal = views.search.value;
        queries.setQ(qTypes.search, searchVal);

        console.log(this);
        this.init_controller();
    }

    applyFilters(queries, event) {
        filtersUI.close_dialog();

        event.preventDefault();

        queries.resetFilters();
        filtersUI.getFiltersToQueries(queries);

        this.init_controller();
    }

    deleteFilter(queries, event) {
        console.log(event);
        console.log(queries);
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

    chooseCat (event){
        console.log(event.target.tagName==='A');
        console.log(event.target.id);
        if(event.target.tagName==='A'){
            filtersUI.toggle_category(event.target.id);
            event.preventDefault();
        }

    }

    onchange_URL_HASH(queries) {
        //could be cause from my inner-js manual update OR user change
        //isUserChange iff user caused the change by modifying the URL
        console.log('changed');
        let isUserURLChange = queries.getQueriesFromURL();

        if (isUserURLChange) {
            filtersUI.updateInputs(queries);
            this.init_controller();
        }
    }
}

