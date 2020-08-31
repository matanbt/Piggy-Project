export default class Log {
    constructor(id, utc_ms_verification, isExp, amount, category, title, time_logged) {
        this.id = parseInt(id);
        this.utc_ms_verification = parseInt(utc_ms_verification);
        this.is_exp = isExp === 'True';
        this.amount = Math.abs(amount);
        this.category = category;
        this.title = title;
        this.time_logged = time_logged;
    }
};

export const validators = {
    amount: function (amount) {
        return !isNaN(amount) && amount >= 0 && amount.trim().length > 0;
    },
    title: function (title) {
        return title.length <= 20 && title.trim() === title;
    },
    category: function (category,log_type) {
        return log_type && (category === 'other' || category.split('_')[0] === log_type);
    },
    time_logged: function (time_logged) {
        return time_logged;
    }
};

export const getData = {
    getLogs: async () => {
        const res = await fetch('https://jsonplaceholdertodos');
        console.log('fetching...');

        const logs = await res.json();
        console.log(logs);
        console.log(`----logs type is : ${typeof logs}`);
        return logs;
    }
}