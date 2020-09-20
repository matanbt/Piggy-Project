import {Categories} from "../models/categories.js";
import {extraUI} from "../helpers.js";


export const views={
    in_cats_div: document.querySelector('#in_cats'),
    exp_cats_div: document.querySelector('#exp_cats'),
    cats_div : type => document.querySelector(`#${type}_cats`),
    del_cat_class: 'del-t_block',
    getCatBlock:(cat)=> document.querySelector(`.t_block#${cat}`),


    addCat_getType: () =>document.querySelector('input[name=log_type]:checked'), //value
    addCat_input : document.getElementById('add_cat_input'),
    addCat_submit : document.getElementById('add_cat_submit'),
    addCat_radio : id => document.getElementById(`log_type-${id}`),

    modCats_save : document.getElementById('save_mod_cats'),
    modCats_reset : document.getElementById('reset_mod_cats'),
    modCats_msg: document.getElementById('mod_cat_msg'),

}

export const modCatsUI ={
    renderCategories(cats){
        //cats: Categories
        views.in_cats_div.innerHTML='';
        views.exp_cats_div.innerHTML='';
        cats.getArr().forEach(cat => modCatsUI.addCat(cat));
    },

    toggleDel(cat){
        let lst=views.getCatBlock(cat).classList;
        if(Array.from(lst).includes('delete')) lst.remove('delete');
        else lst.add('delete');
    },

    //ADD CAT FORM:
    getAddCat(){
        let type=views.addCat_getType() ? views.addCat_getType().value : null;
        let cat_title=views.addCat_input.value;
        return [type,cat_title];
    },

    clearAddCat(){
        //reset type
        [0, 1].forEach(id => {
            views.addCat_radio(id).checked = false;
            views.addCat_radio(id).closest('label').classList.remove('active');
        });

        //reset input
        views.addCat_input.value='';
        views.addCat_input.classList.remove('is-invalid');
    },

    errorAddCat(){
        views.addCat_input.classList.add('is-invalid');
    },

    addCat(cat,added=false){
        views.cats_div(Categories.getType(cat)).insertAdjacentHTML('beforeend',modCatsUI.catMarkup(cat,added));
    },

    catMarkup (cat, added=false) {
        //@param cat : full category
        return `
        <span class="t_block ${added ? 'new' :''}" id="${cat}">
            <span class="fb-text">${Categories.getTitle(cat)}</span> <span class="del-t_block">×</span>
        </span>
        `;

    },

    //Mod Cat Submitting:
    printMsg(msg,error=true){
        modCatsUI.clearMsg();

        views.modCats_msg.classList.add(`text-${error ? 'danger' : 'success'}`);
        views.modCats_msg.innerHTML=msg;
    },

    clearMsg (){
        views.modCats_msg.classList.remove('text-success', 'text-danger');
        views.modCats_msg.innerHTML='';
    },

    loading(){
      [views.in_cats_div,views.exp_cats_div].forEach(el=>extraUI.setSpinner(el));
    },

    clearLoading(){
      [views.in_cats_div,views.exp_cats_div].forEach(el=>extraUI.delSpinner(el));
    },
};

