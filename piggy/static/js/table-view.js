
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

    amount : document.getElementById('amount'),
    title : document.getElementById('title'),
    category : document.getElementById('category'),
    time_logged : document.getElementById('time_logged'),

    //note - using arrow function --> this === window / global
    // not using arrow function --> this === TheObject, i.e. views
    apply_on_fields: function (func_to_apply, type_omitted=true,self=this) {
        console.log('this');
        console.log(this);
        console.log('self');
        console.log(self);
        console.log('inside Views');
        let start = type_omitted? 1 : 0;

        for (let field_id of self.fields_ids.slice(start)) {
            func_to_apply(self[field_id])
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


        views.amount.value = log.amount;
        views.category.value = log.category;
        views.title.value = log.title;
        views.time_logged.value = log.time_logged; //format "2020-08-26T15:50"

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
        views.time_logged.value = new Date().toISOString().split('.')[0].slice(0, -3);

        //general cosmetic:
        views.form_title.textContent = 'Income/Expanses Addition';
        views.submit_dialog.value = 'Add';
        views.delete_dialog.style.display = 'none';
    },
    open: () => {$('#add_popup').modal('show');}
};

export const tableUI ={
    loadTable :(json_logs) =>{

    }
};