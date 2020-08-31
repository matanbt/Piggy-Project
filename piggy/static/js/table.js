import Log, {validators,getData} from './table-model.js';
import {views, formUI, dialogUI} from './table-view.js';

/*
* - logs - array of users log, sent from the server
* - log - Instance of Log, represents the current log in Dialog
 */
const state={};

const helper = {

    //fields helpers (requires call from field)

    onchange_field: function () {
        //THIS - in the field's context
        console.info(this)
        if (state.log[this.id] == this.value.trim()) {
            this.classList.remove('editing');
        } else {
            this.classList.add('editing');
        }
    },

    validate_field: function () {
        //THIS - in the field's context
        let check=false;
        if (this === views.category) {
            check = validators.category(this.value, formUI.getLogType());
        }
        else{ check = validators[this.id](this.value);}
        if (check) {
            this.classList.remove('is-invalid');
            return true;
        } else {
            this.classList.add('is-invalid');
            return false;
        }
    },

    toggle_listeners_dialog: (isEditing) => {
        //EDIT
        if (isEditing) {
            formUI.onchange_type();
            views.apply_on_fields((field)=>{field.addEventListener('change', helper.onchange_field.bind(field));})
        }
        //ADD
        else {
            views.apply_on_fields((field)=>{field.removeEventListener('change', helper.onchange_field.bind(field));})
        }

        //document.getElementById('amount').addEventListener('input',function(){console.log('amounted')});
        //document.getElementById('log_type-0').addEventListener('change', this.onchange_type);
        //document.getElementById('log_type-1').addEventListener('change', this.onchange_type);


    },

    validate_submit: (event) => {
        let submit_type = formUI.get_form_data();
        views.dialog_form.dataset.type='';

        // DELETE:
        if (submit_type === 'delete') {
            return true;
        }

        //MODIFY - CASE: NO-CHANGES
        if (state.log) {
            let changed = 0;
            for (let field_id of views.fields_ids.slice(1)) {
                if (state.log[field_id] != views[field_id].value.trim()) {
                    changed++;
                    console.log(field_id);
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
            if (!helper.validate_field.call(views[field_id])) {
                flag = false;
            }
        }

        if (!flag) {
            event.preventDefault();
        }
        return flag;
    }
}

//onload script
window.addEventListener('load', function () {

    console.log('page loaded');

    state.log=null;

    views.apply_on_fields((field) => {
        field.addEventListener('change', helper.validate_field.bind(field))
    });

    views.dialog_form.addEventListener('submit', helper.validate_submit);

    views.open_add_btn.addEventListener('click', controller.open_add);
    views.submit_dialog.addEventListener('click', () => {views.dialog_form.dataset.type='submit'});
    views.delete_dialog.addEventListener('click', () => {views.dialog_form.dataset.type='delete'});

    views.log_type_exp.onchange = formUI.onchange_type;
    views.log_type_inc.onchange = formUI.onchange_type;
});


//dialog controllers:
const controller = {

    open_edit: (log) => {
        state.log = log;
        dialogUI.init_edit(state.log);
        formUI.remove_styles_invalid_editing();
        helper.toggle_listeners_dialog(true);
        dialogUI.open();
    },

    open_add: () => {
        state.log = null;
        dialogUI.init_add();
        formUI.remove_styles_invalid_editing();
        helper.toggle_listeners_dialog(false);
        dialogUI.open();
    },

    load_table1 : () =>{
      getData.getLogs().then(logs => {console.log('logs!: ');console.log(logs)}).catch(err => {console.log('error! ::');console.log(err)});
    },

    load_table : async () =>{

        console.log(getData.getLogs())
    }

}

window.load_table1=controller.load_table1;
window.load_table2=controller.load_table2;
window.getData=getData.getLogs;
window.open_edit=controller.open_edit;
window.Log=Log;