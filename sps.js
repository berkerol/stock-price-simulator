/* global Chart createButton createButtonGroup createModalButton createModal keyUpHandler canvas ctx defaultDays defaultPrice defaultMinPrice defaultMaxPrice defaultBaseChange defaultDaysPerSecond color gradient days:writable price:writable minPrice:writable maxPrice:writable baseChange:writable daysPerSecond:writable currentDay:writable currentPrice:writable trend trendPeriod volatility volatilityPeriod interval:writable updateTrend updateVolatility resizeHandler */
const trendNames = {
  3: 'Strong Down',
  4: 'Weak Down',
  5: 'Stable',
  7: 'Weak Up',
  9: 'Strong Up'
};
const volatilityNames = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  5: 'High',
  8: 'Very High'
};

const modalElements = [[['Total Days', 'days', 3, 999, 'number'], ['Possible Min Price', 'min', 1, 9999, 'number'], ['Base Change', 'change', 0, 100, 'number']], [['Initial Price', 'price', 1, 9999, 'number'], ['Possible Max Price', 'max', 1, 9999, 'number'], ['Days/Second', 'daysPerSecond', 1, 9, 'number']]];
const buttonElements = [['info', 'generate()', 'g', 'sync', '<u>G</u>enerate'], ['info', 'play()', 'w', 'play', '<u>W</u>atch'], ['info', '', 's', 'cog', '<u>S</u>ettings']];
const buttonGroup = createButtonGroup('btn-group btn-group-lg btn-group-center', buttonElements);
const playButton = buttonGroup.children[1];
const pauseButton = createButton('info', 'pause()', 'p', 'pause', '<u>P</u>ause');
document.body.insertBefore(createModalButton(buttonGroup, 2), canvas);
createModal(modalElements);

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
      pointBorderColor: color + '1.0)',
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
          labelString: 'Date'
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
          return [`Price: $${Math.round(tooltipItem.yLabel * 100) / 100}`,
            `Change: ${change > 0 ? '+' : ''}${Math.round(change * 100) / 100}`,
            `% Change: ${percentChange > 0 ? '+' : ''}${percentChange}%`,
            'Trend: ' + trendNames[data.datasets[0].trends[tooltipItem.index][1]],
            'Volatility: ' + volatilityNames[data.datasets[0].volatilities[tooltipItem.index]]];
        }
      }
    }
  }
});

resetInputs();
generate();
document.addEventListener('keyup', keyUpHandler);
window.addEventListener('resize', resizeHandler);

function resetInputs () {
  days = defaultDays;
  price = defaultPrice;
  minPrice = defaultMinPrice;
  maxPrice = defaultMaxPrice;
  baseChange = defaultBaseChange;
  daysPerSecond = defaultDaysPerSecond;
  document.getElementById('days').value = days;
  document.getElementById('price').value = price;
  document.getElementById('min').value = minPrice;
  document.getElementById('max').value = maxPrice;
  document.getElementById('change').value = baseChange * 100;
  document.getElementById('daysPerSecond').value = daysPerSecond;
}

window.save = function () {
  days = +document.getElementById('days').value;
  price = +document.getElementById('price').value;
  minPrice = +document.getElementById('min').value;
  maxPrice = +document.getElementById('max').value;
  baseChange = +document.getElementById('change').value / 100;
  daysPerSecond = +document.getElementById('daysPerSecond').value;
};

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
  playButton.setAttribute('onclick', 'play()');
  playButton.setAttribute('accesskey', 'w');
  playButton.innerHTML = '<i class="fas fa-play"></i> <u>W</u>atch';
  if (buttonGroup.contains(pauseButton)) {
    buttonGroup.removeChild(pauseButton);
  }
}

function generate () {
  reset();
  fill();
}

window.play = function () {
  reset();
  playButton.setAttribute('onclick', 'stop()');
  playButton.setAttribute('accesskey', 't');
  playButton.innerHTML = '<i class="fas fa-stop"></i> S<u>t</u>op';
  buttonGroup.insertBefore(pauseButton, playButton);
  animate();
};

window.pause = function () {
  window.clearInterval(interval);
  pauseButton.setAttribute('onclick', 'resume()');
  pauseButton.setAttribute('accesskey', 'r');
  pauseButton.innerHTML = '<i class="fas fa-play"></i> <u>R</u>esume';
};

window.resume = function () {
  pauseButton.setAttribute('onclick', 'pause()');
  pauseButton.setAttribute('accesskey', 'p');
  pauseButton.innerHTML = '<i class="fas fa-pause"></i> <u>P</u>ause';
  animate();
};

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
