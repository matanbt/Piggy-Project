
//onload script
window.addEventListener('load',function(){

        for (let field_id of fields.ids.slice(1,fields.ids.length)) {
            document.getElementById(field_id).addEventListener('change', fields.validate_field);
        }
        document.getElementById('log_type-0').onchange=fields.onchange_type;
        document.getElementById('log_type-1').onchange=fields.onchange_type;
});


//log object constructor
const Log = function (id, isExp, amount, category, title, time_logged) {
    this.id = id
    this.isExp = isExp === 'True';
    this.amount = Math.abs(amount);
    this.category = category;
    this.title = title;
    this.time_logged = time_logged;
}

//form validators
const validators = {
        amount:function(amount){
            return !isNaN(amount) && amount>=0;
        },
        title:function(title){
            return title.length<=20 && title.trim()===title;
        },
        category:function(category){
            log_type=fields.getLogTypeorNull();
            return log_type && (category==='other' || category.split('_')[0]===log_type);
        },
        time_logged:function(time_logged){
            return time_logged;
        }
    };

//fields and UI integration
const fields = {
    ids : ['log_type','amount','title','category','time_logged'],

    //fields helpers (requires call from field)
    onedit_field : function(){
        //THIS - in the field's context
        if (dialog.log[this.id]==this.value)
        {this.classList.remove('editing');}
        else {this.classList.add('editing');}
    },

    validate_field: function () {
        //context - this is the field
        check = validators[this.id](this.value);
        if (check) {
            this.classList.remove('is-invalid');
            return true;
        } else {
            this.classList.add('is-invalid');
            return false;
        }
    },
    onchange_type : function () {
        console.log('changed');
        let log_type = fields.getLogTypeorNull();
        for (let op of document.getElementById('category').options) {
            let op_type = op.value.split('_')[0];
            if (op_type === log_type || op.value === 'other') {
                op.disabled = false;
            } else {
                op.disabled = true;
            }
        }
    },

    //cosmetics:
    remove_styles_invalid: function () {
        //remove invalid style
        document.getElementById('amount').classList.remove('is-invalid');
        document.getElementById('category').classList.remove('is-invalid');
        document.getElementById('title').classList.remove('is-invalid');
        document.getElementById('time_logged').classList.remove('is-invalid');
    },

    //general form functions
    validate_submit: function (e) {

        // DELETE:
        if (e.submitter.id==='delete_dialog')
        {return true;}

        //MODIFY - CASE: NO-CHANGES
        if (dialog.log){
            let changed=0;
            for (let field_id of fields.ids.slice(1,fields.ids.length)){
                let field=document.getElementById(field_id);
                if (dialog.log[field_id]!=field.value.trim()){changed++;console.log(field_id);}
            }
            if (changed===0) {return false;}
        }

        //ADD OR MODIFY:
        let flag=true;
        if(!fields.getLogTypeorNull()) {flag=false;}
        for (let field_id of this.ids.slice(1, this.ids.length)) {
            if (!this.validate_field.call(document.getElementById(field_id))) {
                flag = false;
            }
        }
        return flag;
    },

    //misc
    getLogTypeorNull : function(){
        let type=document.querySelector('input[name='+this.ids[0]+']:checked');
        if (!type){return null;}
        return type.value;
    }
}

const dialog = {
    log: null, //isEditing = bool(this.log)

    init_log_edit: function (log) {
        this.log = log; //saves for the future

        let isExp_num = log.isExp ? 1 : 0;
        let isExp_word = log.isExp ? 'Expanse' : 'Income';

        document.querySelector('.modal-title').textContent = 'Editing ' + isExp_word;
        document.getElementById('log_id').value = log.id;

        //log_type
        document.getElementById('log_type-' + isExp_num).checked = true;
        document.getElementById('log_type-' + isExp_num).disabled = false;
        document.getElementById('log_type-' + isExp_num).parentElement.classList.add('active');

        document.getElementById('log_type-' + (1 - isExp_num)).checked = false;
        document.getElementById('log_type-' + (1 - isExp_num)).disabled = true;
        document.getElementById('log_type-' + (1 - isExp_num)).parentElement.classList.remove('active');


        document.getElementById('amount').value = log.amount;

        document.getElementById('category').value = log.category; //formatted as id

        document.getElementById('title').value = log.title;

        document.getElementById('time_logged').value = log.time_logged; //format "2020-08-26T15:50"

        //general cosmetic:
        document.getElementById('submit_dialog').value = 'Confirm Changes';
        document.getElementById('delete_dialog').style.display = 'inline-block';
    },
    init_add: function () {
        this.log = null;
        document.getElementById('dialog_form').reset();

        document.getElementById('log_id').value='';

        document.getElementById('log_type-0').parentElement.classList.remove('active');
        document.getElementById('log_type-1').parentElement.classList.remove('active');
        document.getElementById('log_type-0').disabled = false;
        document.getElementById('log_type-1').disabled = false;


        //new Date(Date.parse(new Date().toLocaleString())).toISOString()
        document.getElementById('time_logged').value = new Date().toISOString().split('.')[0].slice(0, -3);

        //general cosmetic:
        document.querySelector('.modal-title').textContent = 'Income/Expanses Addition';
        document.getElementById('submit_dialog').value = 'Add';
        document.getElementById('delete_dialog').style.display = 'none';
    },
    open: function () {
        $('#add_popup').modal('show')
    },
    add_listeners: function () {
        //EDIT
        if (this.log){
            console.log('added');

            fields.onchange_type();
            for (let field_id of fields.ids.slice(1,fields.ids.length)){
                document.getElementById(field_id).addEventListener('change',fields.onedit_field);
            }
        }
        else{ //ADD
            for (let field_id of fields.ids.slice(1,fields.ids.length)){
                document.getElementById(field_id).removeEventListener('change',fields.onedit_field);}
        }

        //document.getElementById('amount').addEventListener('input',function(){console.log('amounted')});
        //document.getElementById('log_type-0').addEventListener('change', this.onchange_type);
        //document.getElementById('log_type-1').addEventListener('change', this.onchange_type);


    },

    open_edit: function (log) {
        this.init_log_edit(log);
        fields.remove_styles_invalid();
        this.add_listeners();
        this.open()
    },
    open_add: function () {
        this.init_add();
        fields.remove_styles_invalid();
        this.add_listeners();
        this.open()
    },

    onchnage_editform:function(){

    }

};