import {Categories,ModCategories} from './models/categories.js';
import {getData} from "./helpers.js";
import {views,modCatsUI} from './views/account-view.js';

const state={
    categories: new Categories(),
    modCategories :null
}

const controller={
    loadCategories : async (cached_categories=false) =>{
        modCatsUI.loading();

        //cached_categories --> func will load from state.categories
        if(!cached_categories) await getData.getCategories(state.categories);

        state.modCategories = new ModCategories(state.categories);

        modCatsUI.clearLoading();
        modCatsUI.renderCategories(state.categories);
    },

    saveCategories : async () => {
        let toAdd=state.modCategories.getToAdd_Arr();
        let toDelete=state.modCategories.getToDel_Arr();
        if(toAdd.length===0 && toDelete.length===0) {
            //no 'tasks' ==> no need to send request to the server
            modCatsUI.printMsg('No Changes were made')
            return;
        }

        const resp=await getData.setCategories(toAdd,toDelete);

        if (resp.ok) {
            modCatsUI.printMsg(resp.json.msg,false);
            await setTimeout(modCatsUI.clearMsg,3300);
        }
        else modCatsUI.printMsg(resp.json.error,true);

        await controller.loadCategories();
    }

};

window.addEventListener('DOMContentLoaded', async () => {

    await controller.loadCategories();

    views.addCat_submit.addEventListener('click',()=>{
       let cat=state.modCategories.addCat(...modCatsUI.getAddCat());
       if(cat){
           modCatsUI.clearAddCat();
           modCatsUI.addCat(cat,true);
       }
       else modCatsUI.errorAddCat();
    });

    views.in_cats_div.parentElement.addEventListener('click',(event)=>{
        if(Array.from(event.target.classList).includes(views.del_cat_class)){
            let cat=event.target.closest('.t_block').id;
            modCatsUI.toggleDel(cat);
            state.modCategories.toggleDelCat(cat);
        }
    });

    //save categories changes to database
    views.modCats_save.addEventListener('click', controller.saveCategories);

    views.modCats_reset.addEventListener('click', controller.loadCategories.bind(undefined,true));


});

