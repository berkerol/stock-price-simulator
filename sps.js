/* global Chart */
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let days = 250; // 250 trading days = 1 year
let price = 50;
let baseChange = 0.01;
let daysPerSecond = 3;
let color = 'rgba(54, 162, 235, ';
let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
gradient.addColorStop(0, color + '0.8)');
gradient.addColorStop(1, color + '0.0)');

let trends = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 5, 5, 8]; // 1, 2, 3, 5, 8
let trendDurations = [5, 10, 20, 40, 60, 120]; // 20 trading days = 1 month

let currentDay;
let currentPrice;
let trend;
let trendDuration;
let interval;

let chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      data: [],
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
    }
  }
});

generate();
window.addEventListener('resize', resizeHandler);

function reset () {
  trend = trends[Math.floor(Math.random() * trends.length)];
  trendDuration = trendDurations[Math.floor(Math.random() * trendDurations.length)];
  currentDay = 1;
  currentPrice = price;
  chart.data.labels = ['Trading Day ' + currentDay];
  chart.data.datasets[0].data = [currentPrice];
  window.clearInterval(interval);
}

function resetButtons () {
  let playButton = document.getElementById('play');
  playButton.setAttribute('onclick', 'play()');
  playButton.setAttribute('accesskey', 'w');
  playButton.innerHTML = '<span class="glyphicon glyphicon-play"></span> <span style="text-decoration: underline">W</span>atch';
  let pauseButton = document.getElementById('pause');
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
  let playButton = document.getElementById('play');
  playButton.setAttribute('onclick', 'stop()');
  playButton.setAttribute('accesskey', 't');
  playButton.innerHTML = '<span class="glyphicon glyphicon-stop"></span> S<span style="text-decoration: underline">t</span>op';
  let pauseButton = document.createElement('a');
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
  let pauseButton = document.getElementById('pause');
  pauseButton.setAttribute('onclick', 'resume()');
  pauseButton.setAttribute('accesskey', 'r');
  pauseButton.innerHTML = '<span class="glyphicon glyphicon-play"></span> <span style="text-decoration: underline">R</span>esume';
}

function resume () {
  let pauseButton = document.getElementById('pause');
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
  if (currentDay++ % trendDuration === 0) {
    trend = trends[Math.floor(Math.random() * trends.length)];
    trendDuration = trendDurations[Math.floor(Math.random() * trendDurations.length)];
  }
  currentPrice = Math.round((currentPrice + currentPrice * baseChange * trend * (Math.random() * 2 - 1)) * 100) / 100;
  chart.data.labels.push('Trading Day ' + currentDay);
  chart.data.datasets[0].data.push(currentPrice);
}

function resizeHandler () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  chart.resize();
  chart.update();
}
