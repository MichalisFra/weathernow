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
    midday: "https://static.vecteezy.com/system/resources/previews/001/821/201/large_2x/blue-sky-with-white-clouds-free-photo.jpg",
    afternoon: "https://images.fineartamerica.com/images-medium-large-5/afternoon-sky-joe-schofield.jpg",
    night: "https://images.rawpixel.com/image_800/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvdXB3azYxOTE1NzQ2LXdpa2ltZWRpYS1pbWFnZS1rb3dlOGVqMy5qcGc.jpg"
};

$(function() {
    var debounceTimeout = null;
    $('#searchInput').on('input', function() {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            getWeather(this.value.trim())
        }, 1500)
       
    })

    $('#searchInput').on('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault() // Prevent default action, e.g., form submission
            clearTimeout(debounceTimeout)
            getWeather(this.value.trim())
        }
    })

    $('#showMore').on('click', function (e) {
        e.preventDefault()
        onShowMoreClicked.call(this)
    })

    $('#btn').on('click', function (e) {
        e.preventDefault()
        onBtnClicked()
    })

    updateBackgroundImage()
});




function onShowMoreClicked() {
    const forecastSection = $('.forecast');
    const showMoreLink = $('#showMore');
   
    if( forecastSection.is(':visible') ) {
        showMoreLink.text('Show Forecast');

    } else {
        showMoreLink.text('Show Less');


    }

    fadeForecast()
    
}









function updateBackgroundImage() {
    const now = new Date()
    const hours = now.getHours()

    let backgroundImageUrl;
    if (hours >= 6 && hours < 10) {
        backgroundImageUrl = backgroundImageMapping.morning;
    } else if (hours >= 10 && hours < 16) {
        backgroundImageUrl = backgroundImageMapping.midday;
    } else if (hours >= 16 && hours < 20) {
        backgroundImageUrl = backgroundImageMapping.afternoon;
    } else {
        backgroundImageUrl = backgroundImageMapping.night;
    }

    $('body').css('background-image', `url(${backgroundImageUrl})`)
}

async function fetchCoordinatesFromApi(location) {
    let apiKey = '773d87a5a09864b76e24306a4399635d';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`

    return await getXHRPromise(url);
}

async function fetchWeatherFromApi(lat, lon) {
    let apiKey = '773d87a5a09864b76e24306a4399635d';
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    return await getXHRPromise(url)
}

function getXHRPromise(url) {
    return new Promise((resolve, reject) => {
        let ajaxRequest = new XMLHttpRequest()
        ajaxRequest.open('GET', url, true)

        ajaxRequest.timeout = 5000
        ajaxRequest.ontimeout = () => reject({ status: 408, statusText: 'Request timed out' })

        ajaxRequest.onreadystatechange = function() {
            if (ajaxRequest.readyState === 4) {
                if (ajaxRequest.status === 200) {
                    const weather = JSON.parse(ajaxRequest.responseText)
                    resolve(weather)
                } else {
                    reject({ status: ajaxRequest.status, statusText: ajaxRequest.statusText })
                }
            }
        };

        ajaxRequest.send()
    });
}

function formatTimeInTimezone(timezoneOffset, date = new Date()) {
    // Convert the local time to UTC
    const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    
    // Create a new date object for the timezone offset
    const timezoneDate = new Date(localDate.getTime() + (timezoneOffset * 3600 * 1000));
    
    // Return the formatted time
    return timezoneDate.toLocaleTimeString();
}

async function getWeather(location) {
    if (!location) return;

    try {
        onBeforeSend();
        const weather = await fetchCoordinatesFromApi(location);
        handleResults(weather);
    } catch (error) {
        console.log(error);
        if (error.status === 404) {
            showNotFound();
        } else {
            onApiError();
        }
    }
}



async function handleResults(response) {
    console.log('handleResults response:', response);
    if (response.cod === 200) {
        let transformed = transform(response);
        buildWeather(transformed);

        // Make the second API call with the latitude and longitude
        const forecast = await fetchWeatherFromApi(response.coord.lat, response.coord.lon);
        handleForecast(forecast);
    } else {
        console.log('Non-200 response code:', response.cod);
        hideComponent('#waiting');
        showNotFound();
    }
}

function handleForecast(response) {
    console.log('handleForecast response:', response);
    if (response.cod === "200") {

        response.list = response.list.slice(0, 4)
        buildForecast(response)
        
    } else {
        console.log('Non-200 response code:', response.cod);
    }
}

function buildWeather(response) {
    hideComponent('#waiting');
    $('.location-value').text(response.name);
    $('#countryCode').text(response.sys.country);

    // Use the timezone from the API response
    const timezoneOffset = response.timezone / 3600; // Convert seconds to hours
    $('#currentTime').text(formatTimeInTimezone(timezoneOffset));
    
    $('.temp-fill').text(`${response.main.temp}`);
    $('.feel-fill').text(`${response.main.feels_like}`);
    $('.sky-fill').text(`${titleCase(response.weather[0].description)}`);
    $('.humid-fill').text(`${response.main.humidity}`);
    $('.wind-fill').text(`${mpsToBeaufort(response.wind.speed)}`);

    showComponent('#showMore');
    hideComponent('.forecast');

    const iconCode = response.weather[0].icon;
    const iconClass = weatherIconMapping[iconCode];

    if (iconClass) {
        $('#weatherIcon').attr('class', `fa ${iconClass}`);
    } else {
        $('#weatherIcon').attr('src', `http://openweathermap.org/img/wn/${iconCode}@2x.png`); // Fallback to default
    }

    adjustSkyFontSize();

    weatherFadeInAndOut();
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
    return _.startCase(_.toLower(str))
}

function clearNotAvailableInformation(response) {
    for (const key in response) {
        if (response.hasOwnProperty(key) && response[key] === 'N/A') {
            response[key] = ''
        }
    }
}

function buildForecast(response) {
    let forecastsHtml = '';
    const timezoneOffset = response.city.timezone / 3600; // Convert seconds to hours

    response.list.forEach(forecast => {
        // Adjust the timestamp based on the timezone offset
        const localTime = formatTimeInTimezone(timezoneOffset, new Date(forecast.dt * 1000));

        forecastsHtml += `
            <div class="forecast-item">
                <div class="small-gap">  ${localTime}</div>

                

                <div class="forecast-row">
                    <div class="forecast-label"> temp: </div> 
                    <span class="forecast-value"> ${forecast.main.temp}
                        <span class="forecast-unit">°C</span> 
                        </span> 
                </div>

                <div class="forecast-row">
                    <div class="forecast-label"> feels: </div> 
                    <span class="forecast-value"> ${forecast.main.feels_like} 
                        <span class="forecast-unit">°C</span> 
                        </span> 
                </div>

                <div class="forecast-row">
                    <div class="forecast-label"> sky: </div> 

                    <span class="forecast-value forecast-sky"> <i class="fas ${weatherIconMapping[forecast.weather[0].icon] || 'fa-cloud'}"></i>
                    </span>
                </div>

                <div class="forecast-row">
                    <div class="forecast-label"> humidity: </div>
                     <span class="forecast-value"> ${forecast.main.humidity} 
                        <span class="forecast-unit">%</span>
                    </span> 
                </div>

                <div class="forecast-row">
                    <div class="forecast-label"> wind:</div>
                     <span class="forecast-value"> ${mpsToBeaufort(forecast.wind.speed)} <span class="forecast-unit">B</span>
                    </span> 
                </div>
            </div>
        `;
    });

    $('#hourlyForecasts').html(forecastsHtml);
}


function adjustSkyFontSize() {
    if ($(window).width() <= 600) {
        if ($('.sky-fill').text().length > 10) {
            $('.sky-fill').css('font-size' , 0.7 + 'rem')
        } else {
            $('.sky-fill').css('font-size' , 0.9 + 'rem')

        }
    }
}

function onBtnClicked() {
    $('.hourly-forecasts').toggle()
    $('.weekly-forecasts').toggle()
}











function hideComponent(selector) {
    $(selector).addClass('hidden')
}

function showComponent(selector) {
    $(selector).removeClass('hidden')
}

function showNotFound() {
    console.log('showNotFound called')
    hideComponent('#waiting')
    hideComponent('.weather')
    hideComponent('.forecast')
    hideComponent('.show-more')
    hideComponent('.error')
    showComponent('.not-found')
}

function onBeforeSend() {
    showComponent('#waiting')
    hideComponent('.weather')
    hideComponent('.forecast')
    hideComponent('.show-more')

    hideNotFound()
    hideError()
}

function onApiError() {
    console.log('onApiError called')
    hideComponent('#waiting')
    hideComponent('.weather')
    hideComponent('.forecast')
    hideComponent('.show-more')
    hideNotFound()
    showComponent('.error')
}

function hideError() {
    $('.error').addClass('hidden')
}

function hideNotFound() {
    $('.not-found').addClass('hidden')
}

function mpsToBeaufort(mps) {
    if (mps < 0.3) {
        return 0;
    } else {
        return Math.round(Math.pow(mps / 0.836, 2/3));
    }
}






function weatherFadeInAndOut() {
    const weather = $('.weather')

    weather.hide(400, "linear")
    weather.show(700)


}




function fadeForecast() {
    const forecastSection = $('.forecast')
    if (forecastSection.is(':visible')) {
        forecastSection.hide(700)
    } else {
        forecastSection.show(700)
    }

}







