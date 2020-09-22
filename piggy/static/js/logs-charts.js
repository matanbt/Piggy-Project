import {views} from "./views/analysis-view.js";
import {Categories} from './models/categories.js';
import {helpers} from './helpers.js';


export const chartsCalcs = {
    expVSinc: (logs) => {
        let [exp, inc] = [0, 0];
        logs.forEach(log => {
            if (log.is_exp) exp += log.getPosAmount();
            else inc += log.getPosAmount();
        });
        return [exp, inc];
    },

    perMonth: (logs) => {
        ///assumes logs are sorted by date, descending (from present to past)
        if (logs.length === 0) return;
        logs = logs.reverse();
        let [active_months, exp_arr, inc_arr, net_arr, bal_arr] = [[], [0], [0], [], []];
        let net_sum = 0;

        let i = 0;
        let curr_balance = logs[0].amount;
        let curr_month = logs[0].getShortDate();
        inc_arr[i] += Math.max(0, logs[0].amount);
        exp_arr[i] += Math.min(0, logs[0].amount);

        for (let log of logs.slice(1)) {
            if (log.getShortDate() !== curr_month) {
                net_arr.push(inc_arr[i] + exp_arr[i]);
                net_sum += inc_arr[i] + exp_arr[i];
                active_months.push(curr_month);
                bal_arr.push(curr_balance);

                curr_month = log.getShortDate();
                inc_arr.push(0);
                exp_arr.push(0);
                i++;
            }

            inc_arr[i] += Math.max(0, log.amount);
            exp_arr[i] += Math.min(0, log.amount);
            curr_balance += log.amount;
        }

        net_arr.push(inc_arr[i] + exp_arr[i]);
        net_sum += inc_arr[i] + exp_arr[i];
        active_months.push(curr_month);
        bal_arr.push(curr_balance);

        let net_avg = helpers.removeDigits(net_sum / net_arr.length);
        let net_avg_arr = Array(net_arr.length).fill(net_avg);

        return {
            active_months, exp_arr, inc_arr, net_arr, bal_arr, net_avg_arr, curr_balance, net_avg
        };


    },

    perCategory: (logs) => {
        let catTOweight = new Map();
        logs.forEach(log => {
            if (catTOweight.has(log.getCategory())) catTOweight.set(log.getCategory(), catTOweight.get(log.getCategory()) + log.getPosAmount());
            else catTOweight.set(log.getCategory(), log.getPosAmount());
        });

        let [exp_titlesArr, exp_WeightsArr, inc_titlesArr, inc_WeightsArr] = [[], [], [], []];
        for (let [cat, weight] of catTOweight.entries()) {
            let [type, title] = [Categories.getType(cat), Categories.getTitle(cat)];
            if (type === 'in') {
                inc_titlesArr.push(title);
                inc_WeightsArr.push(weight);
            } else if (type === 'exp') {
                exp_titlesArr.push(title);
                exp_WeightsArr.push(weight);
            }
        }

        return {
            exp_titlesArr, exp_WeightsArr, inc_titlesArr, inc_WeightsArr,
        }
    },

    randColorArr: (len) => {

        let colorsArr = [];
        for (let i = 0; i < len; i++) {
            let color = `rgb(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},
                           ${Math.floor(Math.random() * 256)})`;
            colorsArr.push(color);
        }

        return colorsArr;
    }
}


export class ChartsUI {
    constructor() {
        this.charts = [];
    }

    loadCharts(fLogs) {
        //render graphs:

        //graphs
        let chart, ctx;

        //EXP VS INC
        {
            ctx = document.getElementById(views.graph_views.expVSinc).getContext('2d');
            chart = new Chart(ctx, {
                // The type of chart we want to create
                type: 'pie', //

                // The data for our dataset
                data: {
                    labels: ['Expanses', 'Incomes'],

                    datasets: [{
                        label: 'Amount',
                        data: chartsCalcs.expVSinc(fLogs),
                        backgroundColor: ["rgb(239,59,80)", "rgb(98,227,89)"],
                    }]
                },

                // Configuration options go here
                options: {
                    //change the tooltip
                    tooltips: {
                        callbacks: {
                            label: function (tooltipItem, data) {
                                //get the concerned dataset
                                let dataset = data.datasets[tooltipItem.datasetIndex];
                                //calculate the total of this data set
                                let total = dataset.data.reduce(function (previousValue, currentValue, currentIndex, array) {
                                    return previousValue + currentValue;
                                });
                                //get the current items value
                                let currentValue = dataset.data[tooltipItem.index];
                                //calculate the precentage based on the total and current item,
                                // also this does a rough rounding to give a whole number
                                let percentage = Math.floor(((currentValue / total) * 100) + 0.5);

                                return currentValue + '₪ | ' + percentage + "%";
                            }
                        }
                    }
                }
            });
            this.charts.push(chart);
        }


        let calcs = chartsCalcs.perMonth(fLogs);

        this.charts.push(ChartsUI.expVSincMonthly(
            document.getElementById(views.graph_views.expVSincPerMonth).getContext('2d'),calcs));

        //Monthly - Net Income
        {
            ctx = document.getElementById(views.graph_views.netPerMonth).getContext('2d');
            chart = new Chart(ctx, {
                // The type of chart we want to create
                type: 'bar',

                // The data for our dataset
                data: {
                    labels: calcs.active_months,

                    datasets: [{
                        label: 'Net Income',
                        fill: false,

                        data: calcs.net_arr,
                        backgroundColor: "rgba(59,167,239,0.7)",
                    },

                        {
                            label: 'Net Average',
                            data: calcs.net_avg_arr,
                            fill: false,
                            borderColor: "rgb(241,129,30)",
                            backgroundColor: "rgb(241,129,30)",
                            type: 'line'

                        },

                        {
                            label: 'Net Trend',
                            data: calcs.net_arr,
                            fill: false,
                            borderColor: "rgb(9,52,79)",
                            // Changes this dataset to become a line
                            type: 'line',
                            order: 1,
                            hidden: true,
                        },


                    ]
                },

            });
            this.charts.push(chart);

        }


        //Monthly - Balance Tracker
        {
            ctx = document.getElementById(views.graph_views.balanceTracker).getContext('2d');
            chart = new Chart(ctx, {
                // The type of chart we want to create
                type: 'bar',

                // The data for our dataset
                data: {
                    labels: calcs.active_months,

                    datasets: [{
                        label: 'Total Balance',
                        fill: false,
                        maxBarThickness: 3,
                        data: calcs.bal_arr,
                        backgroundColor: "rgb(66,214,201,0.9)",
                        order: 2
                    },

                        {
                            label: 'Balance Trend',
                            data: calcs.bal_arr,
                            fill: false,
                            borderColor: "rgb(9,52,79)",
                            // Changes this dataset to become a line
                            type: 'line',
                            order: 1
                        },


                    ]
                },
            });
            this.charts.push(chart);
        }

        let calcs_cats = chartsCalcs.perCategory(fLogs);
        //Categories Weighted by)
        {

            ctx = document.getElementById(views.graph_views.expPerCategory).getContext('2d');
            chart = new Chart(ctx, {
                // The type of chart we want to create
                type: 'pie', //

                // The data for our dataset
                data: {
                    labels: calcs_cats.exp_titlesArr,

                    datasets: [{
                        label: 'Amount',
                        data: calcs_cats.exp_WeightsArr,
                        backgroundColor: chartsCalcs.randColorArr(calcs_cats.exp_titlesArr.length),
                    }]
                },

            });
            this.charts.push(chart);
        }

        {
            ctx = document.getElementById(views.graph_views.incPerCategory).getContext('2d');
            chart = new Chart(ctx, {
                // The type of chart we want to create
                type: 'pie', //

                // The data for our dataset
                data: {
                    labels: calcs_cats.inc_titlesArr,

                    datasets: [{
                        label: 'Amount',
                        data: calcs_cats.inc_WeightsArr,
                        backgroundColor: chartsCalcs.randColorArr(calcs_cats.inc_titlesArr.length),
                    }]
                },

            });
            this.charts.push(chart);
        }

    }

    destroyCharts() {
        this.charts.forEach(ins => ins.destroy());
        this.charts = [];
    }

    //Monthly - Incomes VS Expanses
    static expVSincMonthly(view,calcs) {
        let ctx = view;
        let chart = new Chart(ctx, {
            type: 'bar',

            data: {
                labels: calcs.active_months,

                datasets: [

                    {
                        label: 'Expanses',
                        data: calcs.exp_arr,
                        fill: false,
                        backgroundColor: "rgb(210,41,64,0.7)",
                        type: 'bar',
                    },

                    {
                        label: 'Incomes',
                        data: calcs.inc_arr,
                        fill: false,
                        backgroundColor: "rgb(58,210,41,0.7)",
                        type: 'bar',
                    },

                    {
                        label: 'Incomes Trend',
                        data: calcs.inc_arr,
                        fill: false,
                        borderColor: "rgb(9,52,79)",
                        type: 'line',
                        order: 1,
                        hidden: true,
                    },

                    {
                        label: 'Expanses Trend',
                        data: calcs.exp_arr,
                        fill: false,
                        borderColor: "rgb(9,52,79)",
                        type: 'line',
                        order: 1,
                        hidden: true,
                    },


                ]
            },
        });
        return chart;
    }
}