/* global Chart */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let days = 250; // 250 trading days = 1 year
let price = 50;
let minPrice = 15;
let maxPrice = 200;
let baseChange = 0.01;
let daysPerSecond = 3;
const color = 'rgba(54, 162, 235, ';
const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
gradient.addColorStop(0, color + '0.8)');
gradient.addColorStop(1, color + '0.0)');

const trends = [[-9, 3], [-7, 4], [-7, 4], [-5, 5], [-5, 5], [-5, 5], [-4, 7], [-4, 7], [-3, 9]];
const trendPeriods = [5, 10, 10, 20, 20, 20, 60, 60, 120]; // 20 trading days = 1 month
const trendNames = {
  3: 'Strong Down',
  4: 'Weak Down',
  5: 'Stable',
  7: 'Weak Up',
  9: 'Strong Up'
};
const volatilities = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 5, 5, 8];
const volatilityPeriods = [5, 10, 10, 20, 20, 20, 60, 60, 120]; // 20 trading days = 1 month
const volatilityNames = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  5: 'High',
  8: 'Very High'
};

let currentDay;
let currentPrice;
let trend;
let trendPeriod;
let volatility;
let volatilityPeriod;
let interval;

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      data: [],
      trends: [],
      volatilities: [],
      backgroundColor: gradient,
      borderColor: color + '1.0)',
      pointBackgroundColor: color + '1.0)'
    }]
  },
  options: {
    legend: {
      display: false
    },
    layout: {
      padding: {
        top: 50,
        right: 20
      }
    },
    scales: {
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Time'
        }
      }],
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Price'
        },
        ticks: {
          callback: function (value, index, values) {
            return '$' + value;
          }
        }
      }]
    },
    tooltips: {
      displayColors: false,
      callbacks: {
        label: function (tooltipItem, data) {
          let change;
          let percentChange;
          if (tooltipItem.index === 0) {
            change = 0;
            percentChange = 0;
          } else {
            const prev = data.datasets[0].data[tooltipItem.index - 1];
            change = tooltipItem.yLabel - prev;
            percentChange = Math.round(change / prev * 10000) / 100;
          }
          return ['Price: $' + Math.round(tooltipItem.yLabel * 100) / 100,
            'Change: ' + (change > 0 ? '+' : '') + Math.round(change * 100) / 100,
            '% Change: ' + (percentChange > 0 ? '+' : '') + percentChange + '%',
            'Trend: ' + trendNames[data.datasets[0].trends[tooltipItem.index][1]],
            'Volatility: ' + volatilityNames[data.datasets[0].volatilities[tooltipItem.index]]];
        }
      }
    }
  }
});

document.getElementById('days').value = days;
document.getElementById('price').value = price;
document.getElementById('min').value = minPrice;
document.getElementById('max').value = maxPrice;
document.getElementById('change').value = baseChange;
document.getElementById('daysPerSecond').value = daysPerSecond;
generate();
window.addEventListener('resize', resizeHandler);

function save () {
  days = +document.getElementById('days').value;
  price = +document.getElementById('price').value;
  minPrice = +document.getElementById('min').value;
  maxPrice = +document.getElementById('max').value;
  baseChange = +document.getElementById('change').value;
  daysPerSecond = +document.getElementById('daysPerSecond').value;
}

function reset () {
  updateTrend();
  updateVolatility();
  currentDay = 1;
  currentPrice = price;
  chart.data.labels = ['Trading Day ' + currentDay];
  chart.data.datasets[0].data = [currentPrice];
  chart.data.datasets[0].trends = [trend];
  chart.data.datasets[0].volatilities = [volatility];
  window.clearInterval(interval);
}

function resetButtons () {
  const playButton = document.getElementById('play');
  playButton.setAttribute('onclick', 'play()');
  playButton.setAttribute('accesskey', 'w');
  playButton.innerHTML = '<span class="glyphicon glyphicon-play"></span> <span style="text-decoration: underline">W</span>atch';
  const pauseButton = document.getElementById('pause');
  if (pauseButton != null) {
    pauseButton.parentNode.removeChild(pauseButton);
  }
}

function generate () {
  reset();
  fill();
}

function play () {
  reset();
  const playButton = document.getElementById('play');
  playButton.setAttribute('onclick', 'stop()');
  playButton.setAttribute('accesskey', 't');
  playButton.innerHTML = '<span class="glyphicon glyphicon-stop"></span> S<span style="text-decoration: underline">t</span>op';
  const pauseButton = document.createElement('a');
  pauseButton.setAttribute('class', 'btn btn-lg btn-info');
  pauseButton.setAttribute('onclick', 'pause()');
  pauseButton.setAttribute('accesskey', 'p');
  pauseButton.setAttribute('id', 'pause');
  pauseButton.innerHTML = '<span class="glyphicon glyphicon-pause"></span> <span style="text-decoration: underline">P</span>ause';
  playButton.parentNode.insertBefore(pauseButton, playButton);
  animate();
}

function pause () {
  window.clearInterval(interval);
  const pauseButton = document.getElementById('pause');
  pauseButton.setAttribute('onclick', 'resume()');
  pauseButton.setAttribute('accesskey', 'r');
  pauseButton.innerHTML = '<span class="glyphicon glyphicon-play"></span> <span style="text-decoration: underline">R</span>esume';
}

function resume () {
  const pauseButton = document.getElementById('pause');
  pauseButton.setAttribute('onclick', 'pause()');
  pauseButton.setAttribute('accesskey', 'p');
  pauseButton.innerHTML = '<span class="glyphicon glyphicon-pause"></span> <span style="text-decoration: underline">P</span>ause';
  animate();
}

function stop () {
  window.clearInterval(interval);
  fill();
}

function fill () {
  resetButtons();
  for (let i = currentDay; i < days; i++) {
    update();
  }
  chart.update({
    duration: 2000
  });
}

function animate () {
  interval = window.setInterval(function () {
    update();
    chart.update({
      duration: 900 / daysPerSecond
    });
    if (currentDay >= days) {
      stop();
    }
  }, 1000 / daysPerSecond);
}

function update () {
  if (currentDay % trendPeriod === 0) {
    updateTrend();
  }
  if (currentDay++ % volatilityPeriod === 0) {
    updateVolatility();
  }
  const change = currentPrice * baseChange * volatility * (Math.random() * (trend[1] - trend[0]) + trend[0]) / 10;
  currentPrice += change;
  if (currentPrice < minPrice) {
    currentPrice += Math.abs(change) * 2;
  } else if (currentPrice > maxPrice) {
    currentPrice -= Math.abs(change) * 2;
  }
  chart.data.labels.push('Trading Day ' + currentDay);
  chart.data.datasets[0].data.push(currentPrice);
  chart.data.datasets[0].trends.push(trend);
  chart.data.datasets[0].volatilities.push(volatility);
}

function updateTrend () {
  trend = trends[Math.floor(Math.random() * trends.length)];
  trendPeriod = trendPeriods[Math.floor(Math.random() * trendPeriods.length)];
}

function updateVolatility () {
  volatility = volatilities[Math.floor(Math.random() * volatilities.length)];
  volatilityPeriod = volatilityPeriods[Math.floor(Math.random() * volatilityPeriods.length)];
}

function resizeHandler () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  chart.resize();
  chart.update();
}
