import {Categories,ModCategories} from './models/categories.js';
import {getData} from "./helpers.js";
import {views,modCatsUI} from './views/account-view.js';

const state={
    categories: new Categories(),
    modCategories :null
}

const controller={
    //todo ACCOUNT controller
};

window.addEventListener('DOMContentLoaded', async () => {

    const loadCategories = async (cached_categories=false) =>{
        //cached_categories --> func will load from state.categories
        if(!cached_categories) await getData.getCategories(state.categories);

        state.modCategories = new ModCategories(state.categories);

        modCatsUI.renderCategories(state.categories);
    }

    await loadCategories();

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

    views.modCats_save.addEventListener('click', async () => {
        let toAdd=state.modCategories.getToAdd_Arr();
        let toDelete=state.modCategories.getToDel_Arr();
        if(toAdd.length===0 && toDelete.length===0) {
            //no 'tasks' ==> no need to send request to the server
            modCatsUI.printMsg('No Changes were made')
            return;
        }

        const resp = await fetch('', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                toAdd,
                toDelete,
            })
        });
        const resp_obj=await resp.json();

        if (resp.ok) {
            modCatsUI.printMsg(resp_obj.msg,false);
            await setTimeout(modCatsUI.clearMsg,4000);
        }
        else modCatsUI.printMsg(resp_obj.error,true);

        await loadCategories();

    });

    views.modCats_reset.addEventListener('click', loadCategories.bind(undefined,true));


});

