import Log,{qTypes,TQuery,Helpers} from "./table-model.js";

export const views ={
    open_add_btn : document.getElementById('open_add_btn'),

    dialog_form: document.getElementById('dialog_form'),
    form_title: document.querySelector('.modal-title'),
    submit_dialog :document.getElementById('submit_dialog'),
    delete_dialog :document.getElementById('delete_dialog'),

    //list of form ids
    hidden_fields : {id:'log_id',utc_ms_verification : 'log_utc' },
    fields_ids : ['log_type','amount','title','category','time_logged'], //IDS

    //hidden fields
    log_id : document.getElementById('log_id'),
    utc_ms_verification : document.getElementById('log_utc'),

    //log type radio
    log_type_inc : document.getElementById('log_type-0'),
    log_type_exp : document.getElementById('log_type-1'),
    //fields
    amount : document.getElementById('amount'),
    title : document.getElementById('title'),
    category : document.getElementById('category'),
    time_logged : document.getElementById('time_logged'),

    //TABLE:
    table : document.querySelector('#logs_table tbody'),
    btn_edit : id => document.getElementById(`btn-edit_${id}`),
    table_expand_row : id => document.getElementById(`expand-row_${id}`),
    table_rows: () => Array.from(document.querySelectorAll('tr')).slice(1),
    row : id => document.getElementById(`row_${id}`),
    rows_sum:()=>document.querySelectorAll('tr.row-sum'),
    expand_all_btn : document.getElementById('btn-expand_all'),
    sum_res : () => document.querySelector('#sum_results'),


    sync_table_btn :document.getElementById('sync_table_btn'),

    //filters
    search : document.getElementById('filter_search'),

    filter_bar : document.getElementById('filter_status_bar'),
    open_add_btn_small : document.getElementById('open_add_btn_toolbar'),

    //status bar - filters
    filter_block : qType => document.querySelector(`.t_block#fb_${qType}`),
    filter_block_text : qType => document.querySelector(`.t_block#fb_${qType}`).querySelector('.fb-text'),
    filter_block_getDel : block => block.querySelector('.del-t_block'),
    filter_clear_all : document.getElementById('clear_filters'),

    //filters-Modal form (inf=input-filter)
    filter_btn : document.getElementById('btn_filter_dialog'),
    filter_form : document.getElementById('filter_form'),
    filter_field : qtype => document.getElementById(`filter_${qtype}`),
    inf_type : document.getElementById('filter_type'),
    inf_date_from : document.getElementById('filter_date_from'),
    inf_date_until : document.getElementById('filter_date_until'),
    inf_amount_min : document.getElementById('filter_amount_min'),
    inf_amount_max : document.getElementById('filter_amount_max'),
    inf_cat_div : (type) => document.getElementById(`filter_cat${type? '_'+type : ''}`),
    inf_cat_chosen : () => document.getElementById('filter_cat').querySelectorAll('.badge-primary'),

    apply_on_filter_blocks : function(func_to_apply){
        for(let qtype of qTypes.qtypes_arr){
            func_to_apply(views.filter_block(qtype));
        }
    },

    //note - using arrow function --> this === window / global
    // not using arrow function --> this === TheObject, i.e. views
    apply_on_fields: function (func_to_apply, type_omitted=true) {
        //applies given function on add form fields
        let start = type_omitted? 1 : 0;

        for (let field_id of this.fields_ids.slice(start)) {
            func_to_apply(this[field_id])
        }
    }
};

export const formUI = {

    onchange_type : function () {
        console.log(`%c ${ formUI.getLogType()}`, 'background: yellow;');
        let log_type = formUI.getLogType();
        for (let op of views.category.options) {
            let op_type = op.value.split('_')[0];
            op.disabled = !(op_type === log_type || op.value === 'other');
        }
    },

    get_form_data: function () {
        let type = views.dialog_form.dataset.type;
        return type ? type : 'submit';
    },

    //misc
    getLogType : function(){
        let type=document.querySelector('input[name='+views.fields_ids[0]+']:checked');
        return !type ? null : type.value;
    },

    //cosmetics:
    remove_styles_invalid_editing: function () {
        views.apply_on_fields((field)=>{field.classList.remove('is-invalid','editing')});
    }
};

export const dialogUI ={
    init_edit : (log) =>{
      let isExp_num = log.is_exp ? 1 : 0;
        let isExp_word = log.is_exp ? 'Expanse' : 'Income';

        views.form_title.textContent = 'Editing ' + isExp_word;
        views.log_id.value = log.id;
        views.utc_ms_verification.value = log.utc_ms_verification;


        //log_type
        document.getElementById('log_type-' + isExp_num).checked = true;
        document.getElementById('log_type-' + isExp_num).disabled = false;
        document.getElementById('log_type-' + isExp_num).parentElement.classList.add('active');

        document.getElementById('log_type-' + (1 - isExp_num)).checked = false;
        document.getElementById('log_type-' + (1 - isExp_num)).disabled = true;
        document.getElementById('log_type-' + (1 - isExp_num)).parentElement.classList.remove('active');


        views.amount.value = Math.abs(log.amount);
        views.category.value = log.category;
        views.title.value = log.title;
        views.time_logged.value = log.getTimeToForm(); //format "2020-08-26T15:50"

        //general cosmetic:
        views.submit_dialog.value = 'Confirm Changes';
        views.delete_dialog.style.display = 'inline-block';
    },
    init_add : ()=>{
        views.dialog_form.reset();

        views.log_id.value='';
        views.utc_ms_verification.value='';


        views.log_type_exp.parentElement.classList.remove('active');
        views.log_type_inc.parentElement.classList.remove('active');
        views.log_type_exp.disabled = false;
        views.log_type_inc.disabled = false;


        //new Date(Date.parse(new Date().toLocaleString())).toISOString() //TODO LOCAL TIME
        views.time_logged.value = Log.getNowToForm();
        //general cosmetic:
        views.form_title.textContent = 'Income/Expanses Addition';
        views.submit_dialog.value = 'Add';
        views.delete_dialog.style.display = 'none';
    },
    open: () => {$('#add_popup').modal('show');}
};

export const tableUI = {
    renderTable: function (logs) {
        let htmlToInject='';
        let [inc,exp,prevLog]=[0,0,null];
        for (let log of logs){
            if (prevLog && log.getShortDate() !== prevLog.getShortDate()) {
                htmlToInject += this.makeTags_sumMonth(prevLog.getShortDate(),inc, exp);
                [inc,exp]=[0,0];
            }

            htmlToInject+=this.makeTags_row(log);
            inc += Math.max(0,log.amount);
            exp += Math.min(0,log.amount);

            prevLog=log;
        }
        htmlToInject += this.makeTags_sumMonth(prevLog.getShortDate(),inc, exp);
        htmlToInject += this.makeTags_sumResults();
        views.table.insertAdjacentHTML('beforeend',htmlToInject);
    },

    clearTable: () => {
        for (let row of views.table_rows()) { row.remove();}
    },

    toggleAll : (state) =>{
        //state
        let {filtered_logs,isExpanded} = state;
        for (let log of filtered_logs){
            if(isExpanded) {views.table_expand_row(log.id).classList.remove('show');}
            else {views.table_expand_row(log.id).classList.add('show');}
        }

        //change button icon
        let ic = isExpanded ? 'expand_ic' : 'collapse_ic';
        views.expand_all_btn.innerHTML=`
        <svg class="icon-white">
        <use href="${window.from_server.url_for.static_icons}#${ic}"></use>
        </svg>
        `
        state.isExpanded=!isExpanded;
    },

    hideLog : id => {
        views.table_expand_row(id).classList.remove('show');
        views.row(id).style.display='none';
    },

    showLog : id => {
        views.row(id).style.display='';
    },

    loading : ()=>{
        views.table.insertAdjacentHTML('beforeend', `
                <tr><td colspan="5">
                ${extraUI.getSpinnerMarkup()}
                </td></tr>`);
    },

    error : () =>{
        //TODO
        views.table.insertAdjacentHTML('beforeend', '<tr><td colspan="5">Error!!!</td></tr>');
    },

    toggleRowSum :(show=true) =>{
        let sums=views.rows_sum();
        for(let row of sums){
            row.style.display= show ? '' : 'none';
        }
    },

    toggleResultsRow : (show=false,fLogs)=>{
        views.sum_res().style.display=show ? '' : 'none';
        views.sum_res().querySelector('span').innerText=fLogs? fLogs.length:'';
    },

    makeTags_row : (log,big_table=true) => {

        let markup= `<tr id='row_${log.id}' ${!big_table ? "class='"+log.getShortDate().replace(' ','_')+"' style='display:none;'" : ""}>`;
        if (big_table) markup += `  <td>${log.getShortDate()}</td>`;

        markup += `<td>${big_table ? log.getMedDate() : log.getShortMonth()}</td>
                    <td class="${log.getShortType()}_cell">${log.amount}</td>
                    <td>${log.getCategoryOnly()}</td>`

        if (big_table) {
            markup += `<td>
                            <button class='btn btn-info' type="button" id='btn-expand_${log.id}' data-target="#expand-row_${log.id}"
                                    data-toggle="collapse" aria-expanded="false">
                                <svg class="icon-white">
                                    <use href="${window.from_server.url_for.static}/my-icons.svg#more_ic"/>
                                </svg>
                            </button>
                        </td>
                    <tr class="collapse" id='expand-row_${log.id}'>
                        <td>
                        <svg class="icon">
                            <use href='${window.from_server.url_for.static}/my-icons.svg#expanded-row_ic'>
                        </svg>
                        </td>
                        <td>${log.getTime()}</td>
                        <td colspan="2"><b>${log.title}</b></td>
                        <td>

                        <button class='btn btn-warning' type="button" title='Edit' id='btn-edit_${log.id}'>
                                <svg class="icon">
                                    <use href='${window.from_server.url_for.static}/my-icons.svg#edit_ic'>
                                </svg>
                            </button>
                        </td>
                                                
                    </tr>`;
        }
                   markup+=`</tr>`;

        return markup;
    },

    makeTags_sumMonth : (month,inc,exp,big_table=true) =>{
        let total=Helpers.removeDigits(inc + exp);
        return `
        <tr class="row-sum">
            <td colspan="${big_table ? 2 :1}"><b>-- ${month} --</b></td>
            <td colspan="${big_table ? 3 :2}" style="text-align: right !important;">
                <small>${inc ? "In: "+inc: " "} ${inc&&exp ? " , " : ""} ${exp ? "Out: "+exp+" " : ""}</small> 
                <span class="${total >=0 ?'inc' : 'exp'}_span" style="padding:0.7em;">
                <b>Total: ${total}</b>
                </span>
            </td>
        </tr>
        `;
    },

    makeTags_sumResults :() =>{
        return `
        <tr id="sum_results" class="row-sum" style="display:none;text-align: center;"><td colspan="5">
            Found <b><span></span></b> Matches.
        </td></tr>
        `;
    },

    filterRowByRow: (fLogs,logs) => {
        let i = 0;
        //assumes rows are sorted same as state.logs!
        for (let log of logs) {
            if (fLogs[i] === log) {
                tableUI.showLog(log.id);
                if (i < fLogs.length-1) {i++;}
            } else {
                tableUI.hideLog(log.id);
            }
        }
    }
};

export const extraUI = {

    getSpinnerMarkup : () =>{
        return `
                <div class="d-flex align-items-center justify-content-center"><div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span></div></div>`;
    }


}