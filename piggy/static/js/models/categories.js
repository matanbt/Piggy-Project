export class Categories {
    constructor(categories=null) {
        this.categories=categories;
    }

    getMap(){
        let map=new Map();

        for (let cat of this.categories) {
            map.set(cat,{
                type: cat.split('_')[0],
                title: cat.split('_')[1].charAt(0).toUpperCase()+cat.split('_')[1].slice(1) }
                );
        }
        return map;
    }

    getOBJ() {
        let obj= {
            in: [],
            exp: []
        };
        for (let cat of this.categories) {
            cat = cat.split('_');
            obj[cat[0]].push(cat[1].charAt(0).toUpperCase()+cat[1].slice(1));
        }
        return obj;
    }

    getArr(){
        return this.categories;
    }

    getArrByType(type){
        //@param type in ['exp','in']
        return this.categories.filter(el=>el.split('_')[0]===type);
    }

    getFullArr(){
        return [...this.categories,'other'];
    }

    //static

    static getTitle(cat){
        return cat==='other'? 'Other' : cat.split('_')[1].charAt(0).toUpperCase()+cat.split('_')[1].slice(1);
    }

    static getType(cat){
        return cat.split('_').length === 2 ? cat.split('_')[0] : ''/*uni-type*/ ;
    }

}

export class ModCategories {
    constructor(orig_categories) {
        //@param orig_categories:  Categories instance

        //modification map - 'original', 'new', 'delete'
        this.mod_map=new Map();
        orig_categories.getArr().forEach(cat => this.mod_map.set(cat,new Set(['original'])));
    }

    addCat(type,cat){
        //type = 'in' / 'exp'
        cat=cat.toLowerCase().trim();
        let full_cat=`${type}_${cat}`;

        if(this.mod_map.has(full_cat)) return false;
        if(! ['in','exp'].includes(type) || cat.includes('=') ||cat.includes(',') ||
            cat.includes('&') || cat.includes('_') || cat.length===0) return false;
        if(this.getToAdd_Arr().length >= 40) return false; //40 is CATEGORIES_LIMIT

        this.mod_map.set(full_cat,new Set(['new']));
        return full_cat;
    }

    toggleDelCat(cat){
        //get full category id, toggles delete state
        if(! this.mod_map.has(cat)) return false;
        let mod=this.mod_map.get(cat);
        if(mod.has('delete')) mod.delete('delete');
        else mod.add('delete');
        return true;
    }

    getToAdd_Arr(){
        //ignores new-deleted category
        let add=[];
        for(let [cat,mod_set] of this.mod_map){
            if(mod_set.has('new') && ! mod_set.has('delete')) add.push(cat);
        }
        return add;
    }

    getToDel_Arr(){
        //ignores new-deleted category
        let del=[];
        for(let [cat,mod_set] of this.mod_map){
            if(mod_set.has('delete') && mod_set.has('original')) del.push(cat);
        }
        return del;
    }
}