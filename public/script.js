// Init chart canvas

const dataHours = 24;

const colors = [
    {
        red: 255,
        green: 0,
        blue: 0,
    },
    {
        red: 0,
        green: 255,
        blue: 0,
    },
    {
        red: 50,
        green: 100,
        blue: 255,
    },
    {
        red: 50,
        green: 150,
        blue: 160,
    }
]

const water_chart_ctx = document.getElementById('water_chart').getContext('2d');
const water_chart = new Chart(water_chart_ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    label: "Water Temperature",
    options: {
        scales: {
            x: {
                title: {
                    text: "Hours",
                    display: true
                },
                min: 0,
                max: dataHours,
                grid: {
                    borderColor: "white",
                    color: "rgba(255, 255, 255, 0.1)"
                }
            },
            y: {
                title: {
                    text: "Water temperature (Celsius)",
                    display: true
                },
                min: 0,
                max: 20,
                grid: {
                    borderColor: "white",
                    color: "rgba(255, 255, 255, 0.1)"
                }
            }
        }
    }
});

Chart.defaults.color = "white";

var wq_list;

async function getWaterQualityReadings() {
    { // Graph
        const wqData = await fetch(`/API/v1/water_quality?hours=${dataHours}`, {
            method: "GET"
        })
        .then(res => res.json())
        .then(data => data.data);
        
        wq_list = wqData;

        renderGraph();
    }

    { // Average
        const avgData = await fetch(`/API/v1/water_quality/average?hours=${dataHours}`, {
            method: "GET"
        })
        .then(res => res.json())
        .then(data => data.data);

        const avg = avgData;
        document.querySelector("#wq_average").innerHTML = avg;
    }

    { // Min
        const minData = await fetch(`/API/v1/water_quality/min?hours=${dataHours}`, {
            method: "GET"
        })
        .then(res => res.json())
        .then(data => data.data);

        const min = minData;
        document.querySelector("#wq_min").innerHTML = min;
    }

    { // Max
        const maxData = await fetch(`/API/v1/water_quality/max?hours=${dataHours}`, {
            method: "GET"
        })
        .then(res => res.json())
        .then(data => data.data);

        const max = maxData;
        document.querySelector("#wq_max").innerHTML = max;
    }
}

function renderGraph() {
    var res = {};
    var label_res = [];
    var i = 0;
    wq_list.forEach((wq_reading) => {
        if(!res[wq_reading.location]) {
            res[wq_reading.location] = {
                label: wq_reading.location,
                data: [],
                fill: true,
                borderColor: `rgb(${colors[i].red}, ${colors[i].green}, ${colors[i].blue})`,
                tension: 0.1
            };
            i++;
        }

        const timestampLabel = new Date(wq_reading.timestamp).toLocaleString('no-nb', {hour12: false, hour: '2-digit', minute: '2-digit'});
        if(!label_res.includes(timestampLabel))
            label_res.push(timestampLabel);

        res[wq_reading.location].data.push(wq_reading.water_temperature);
    });

    water_chart.data.labels = label_res;
    water_chart.data.datasets = Object.values(res);
    water_chart.update();
}

// Init water quality readings
getWaterQualityReadings();

import { parseCronExpression, TimerBasedCronScheduler as scheduler } from 'https://cdn.skypack.dev/cron-schedule';
const cronInstance = parseCronExpression("1 * * * *"); // Fetch readings from server again every hour at :01 (1 minute delay for server to process information)
scheduler.setInterval(cronInstance, getWaterQualityReadings);

