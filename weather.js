const weatherIconMapping = {
    "01d": "fa-sun",
    "01n": "fa-moon",
    "02d": "fa-cloud-sun",
    "02n": "fa-cloud-moon",
    "03d": "fa-cloud",
    "03n": "fa-cloud",
    "04d": "fa-cloud-meatball",
    "04n": "fa-cloud-meatball",
    "09d": "fa-cloud-showers-heavy",
    "09n": "fa-cloud-showers-heavy",
    "10d": "fa-cloud-sun-rain",
    "10n": "fa-cloud-moon-rain",
    "11d": "fa-poo-storm",
    "11n": "fa-poo-storm",
    "13d": "fa-snowflake",
    "13n": "fa-snowflake",
    "50d": "fa-smog",
    "50n": "fa-smog"
};


const backgroundImageMapping = {
    morning: "https://img.freepik.com/free-photo/twilight-cloud_1203-6585.jpg?size=626&ext=jpg&ga=GA1.1.2008272138.1721347200&semt=ais_user",
    midday: "https://i.pinimg.com/736x/95/58/4e/95584e7488697d4d6a7567f4b86e1027.jpg",
    afternoon: "https://images.fineartamerica.com/images-medium-large-5/afternoon-sky-joe-schofield.jpg",
    night: "https://images.rawpixel.com/image_800/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvdXB3azYxOTE1NzQ2LXdpa2ltZWRpYS1pbWFnZS1rb3dlOGVqMy5qcGc.jpg"
};



$(function() {
    var debounceTimeout = null

    $('#searchInput').on('input', function() {
        clearTimeout(debounceTimeout)
        debounceTimeout = setTimeout(() => {
            getWeather(this.value.trim())
        }, 1500)
    })
})
updateBackgroundImage(); // Update the background image based on the current time


function getWeather(location) {
    if (!location) return

    onBeforeSend()
    fetchWeatherFromApi(location)
    updateBackgroundImage(); // Update the background image based on the current time
}

function updateBackgroundImage() {
    const now = new Date();
    const hours = now.getHours();
    
    let backgroundImageUrl;
    if (hours >= 6 && hours < 10) {
        backgroundImageUrl = backgroundImageMapping.morning;
    } else if (hours >= 10 && hours < 14) {
        backgroundImageUrl = backgroundImageMapping.midday;
    } else if (hours >= 14 && hours < 18) {
        backgroundImageUrl = backgroundImageMapping.afternoon;
    } else {
        backgroundImageUrl = backgroundImageMapping.night;
    }

    $('body').css('background-image', `url(${backgroundImageUrl})`);}





function fetchWeatherFromApi(location) {
      let apiKey = '773d87a5a09864b76e24306a4399635d'
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`).then(response => {
        if (!response.ok) {
            return Promise.reject(new Error(`Response status: ${response.status}`))
        }
        return response.json()
    })
    .then(data => handleResults(data))
    .catch(error => console.log(error.message))
}

function handleResults(response) {
    if (response.cod === 200) {
        let transformed = transform(response)
        buildWeather(transformed)
    } else {
        hideComponent('#waiting')
        showNotFound()
    }
}

function transform(response) {
    let camelCaseKeysResponse = camelCaseKeys(response)
    clearNotAvailableInformation(camelCaseKeysResponse)

    return camelCaseKeysResponse
}

function camelCaseKeys(response) {
    return _.mapKeys(response, (v, k) => _.camelCase(k))
}

function titleCase(str) {
   return _.startCase(_.toLower(str));
}

function clearNotAvailableInformation(response) {
    for (const key in response) {
        if (response.hasOwnProperty(key) && response[key] === 'N/A') {
            response[key] = ''
        }
    }
}

function buildWeather(response) {
    hideComponent('#waiting');
    $('#locationName').text(response.name);
    $('#currentTime').text(new Date(response.dt * 1000).toLocaleTimeString());
    $('#temperature').text(`Temperature: ${response.main.temp}°C`);
    $('#sky').text(`Sky: ${titleCase(response.weather[0].description)}`);
    $('#humidity').text(`Humidity: ${response.main.humidity}%`);

    const iconCode = response.weather[0].icon;
    const iconClass = weatherIconMapping[iconCode];

    if (iconClass) {
        $('#weatherIcon').attr('class', `fas ${iconClass}`);
    } else {
        $('#weatherIcon').attr('src', `http://openweathermap.org/img/wn/${iconCode}@2x.png`); // Fallback to default
    }

    showComponent('.weather');
}



function hideComponent(selector) {
    $(selector).addClass('hidden')
}

function showComponent(selector) {
    $(selector).removeClass('hidden')
}

function showNotFound() {
    hideComponent('#waiting')
    hideComponent('.weather')
    hideComponent('.error')
    showComponent('.not-found')
}

function onBeforeSend() {
    showComponent('#waiting')
    hideComponent('.weather')
    hideNotFound()
    hideError()
}

function onApiError() {
    hideComponent('#waiting')
    hideComponent('.weather')
    hideComponent('.not-found')
    showComponent('.error')
}

function showError() {
    hideComponent('#waiting')
    hideComponent('.weather')
    hideComponent('.not-found')
    showComponent('.error')
}

function hideError() {
    $('.error').addClass('hidden')
}

function hideNotFound() {
    $('.not-found').addClass('hidden')
}
