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

    updateBackgroundImage()
});




function onShowMoreClicked() {
    const forecastSection = $('.forecast');
    const showMoreLink = $('#showMore');
    const weatherSection = $('.weather');

    if (!isMobileDevice()) {
        if (forecastSection.hasClass('hidden')) {
            weatherSlideLeft()
            showMoreLink.text('Show Less');
        } else {
            weatherSlideRight()
           
            showMoreLink.text('Show Forecast');
        }
     } else {
        console.log("on mobile");

        if (forecastSection.hasClass('hidden')) {

            fadeIn()
            showMoreLink.text('Show Less');
           
        } else {
            
            fadeOut()
            showMoreLink.text('Show Forecast');

        }
    }
}







async function getWeather(location) {
    if (!location) return

    try {
        onBeforeSend()
        const weather = await fetchCoordinatesFromApi(location)
        handleResults(weather)
    } catch (error) {
        console.log(error)
        if (error.status === 404) {
            showNotFound()
        } else {
            onApiError()
        }
    }
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

async function handleResults(response) {
    console.log('handleResults response:', response)
    if (response.cod === 200) {
        let transformed = transform(response)
        buildWeather(transformed)

        // Make the second API call with the latitude and longitude
        const forecast = await fetchWeatherFromApi(response.coord.lat, response.coord.lon)
        handleForecast(forecast)
    } else {
        console.log('Non-200 response code:', response.cod)
        hideComponent('#waiting')
        showNotFound()
    }
}

function handleForecast(response) {
    console.log('handleForecast response:', response)
    if (response.cod === "200") {
        response.list = response.list.slice(0, 4)
        buildForecast(response)
    } else {
        console.log('Non-200 response code:', response.cod)
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
    return _.startCase(_.toLower(str))
}

function clearNotAvailableInformation(response) {
    for (const key in response) {
        if (response.hasOwnProperty(key) && response[key] === 'N/A') {
            response[key] = ''
        }
    }
}

function buildWeather(response) {
    hideComponent('#waiting')
    $('#locationName').text(response.name)
    $('#currentTime').text(new Date(response.dt * 1000).toLocaleTimeString())
    $('#temperature').text(`Temperature: ${response.main.temp}°C`)
    $('#feel').text(`Feels: ${response.main.feels_like}°C`)
    $('#sky').text(`Sky: ${titleCase(response.weather[0].description)}`)
    $('#humidity').text(`Humidity: ${response.main.humidity}%`)
    $('#windSpeed').text(`Wind: ${mpsToBeaufort(response.wind.speed)}B`)

    showComponent('#showMore')
    hideComponent('.forecast')

    const iconCode = response.weather[0].icon
    const iconClass = weatherIconMapping[iconCode]

    if (iconClass) {
        $('#weatherIcon').attr('class', `fa ${iconClass}`)
    } else {
        $('#weatherIcon').attr('src', `http://openweathermap.org/img/wn/${iconCode}@2x.png`) // Fallback to default
    }

    showComponent('.weather')
}

function buildForecast(response) {
    let forecastsHtml = ''
    response.list.forEach(forecast => {
        forecastsHtml += `
            <div class="forecast-item">
                <div>${new Date(forecast.dt * 1000).toLocaleTimeString()}</div>
                <i class="fas ${weatherIconMapping[forecast.weather[0].icon] || 'fa-cloud'}"></i>
                <div>Temperature: ${forecast.main.temp}°C</div>
                <div>Feels: ${forecast.main.feels_like}°C</div>
                <div>Sky: ${titleCase(forecast.weather[0].description)}</div>
                <div>Humidity: ${forecast.main.humidity}%</div>
                <div>Wind: ${mpsToBeaufort(forecast.wind.speed)}B</div>
            </div>
        `
    })
    $('#hourlyForecasts').html(forecastsHtml)
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
    console.log('onApiError called')
    hideComponent('#waiting')
    hideComponent('.weather')
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


// Function to check if the device is a mobile device based on screen width
function isMobileDevice() {
    const mobileWidthThreshold = 1024; // You might want to adjust this threshold
    const isMobile = window.innerWidth <= mobileWidthThreshold;
    console.log("Device width:", window.innerWidth, "Mobile:", isMobile);
    return isMobile;
}

// Function to adjust layout and animations based on screen size
function adjustLayoutAndAnimations() {
    const forecastSection = document.querySelector('.forecast');
    const weatherInfo = document.querySelector('.weather-info');
    // const hourlyForecastItems = document.querySelectorAll('.hourly-forecast');

    if (isMobileDevice()) {
        // For mobile devices: Disable animations and adjust layout
        document.body.classList.add('mobile');
        forecastSection.style.transition = 'none'; // Disable transition animations
        weatherInfo.style.transition = 'none'; // Disable transition animations for weather section
        weatherInfo.style.transform = 'none'; // Reset any transforms
        weatherInfo.style.margin = '0 auto'; // Center the weather section
        forecastSection.style.margin = '0 auto'; // Center the forecast section
        forecastSection.style.opacity = '1'; // Ensure forecast is fully visible
    } else {
        // For larger screens: Enable animations and normal layout
        document.body.classList.remove('mobile');
        forecastSection.style.transition = 'opacity 0.7s ease'; // Enable transition animations
        weatherInfo.style.transition = ''; // Enable default transition
        weatherInfo.style.margin = ''; // Reset margin
        forecastSection.style.margin = ''; // Reset margin
    }
}

// Initial layout and animation adjustment
adjustLayoutAndAnimations();

// Adjust layout and animations on window resize
window.addEventListener('resize', adjustLayoutAndAnimations);


function weatherSlideLeft() {
    const forecastSection = $('.forecast');
    const showMoreLink = $('#showMore');
    const weatherSection = $('.weather');

    if (forecastSection.hasClass('hidden')) {
           
        //skipping the first transition

        weatherSection.animate({ marginLeft: '-45px' }, 0, function() {
            forecastSection.removeClass('hidden').addClass('visible').animate({ opacity: 1 }, 0);
        });
        forecastSection.animate({ opacity: 0 }, 0, function() {
            forecastSection.removeClass('visible').addClass('hidden');
            weatherSection.animate({ marginLeft: '0px' }, 0);
        })


        //sliding weather left
        weatherSection.animate({ marginLeft: '-45px' }, 400, function() {
            forecastSection.removeClass('hidden').addClass('visible').animate({ opacity: 1 }, 500);
        });

    }
}

function fadeIn() {
    const forecastSection = $('.forecast');



    //skipping the first transition
    forecastSection.removeClass('hidden').addClass('visible').animate({ opacity: 1 }, 0);
    forecastSection.animate({ opacity: 0 }, 0, function() {
        forecastSection.removeClass('visible').addClass('hidden');

    })


    // Show forecast section
        forecastSection.removeClass('hidden').addClass('visible').animate({ opacity: 1 }, 500);

    // Trigger reflow
    // forecastSection[0].offsetHeight;

    // Allow the browser to render the change before starting the animation
    setTimeout(() => {
        forecastSection.css('opacity', 1);
    }, 10); // Small timeout to ensure reflow

}


function weatherSlideRight() {
    const forecastSection = $('.forecast');
    const showMoreLink = $('#showMore');
    const weatherSection = $('.weather');
    // Hide the forecast first, then slide the weather section back to the center
    forecastSection.animate({ opacity: 0 }, 500, function() {
        forecastSection.removeClass('visible').addClass('hidden');
        weatherSection.animate({ marginLeft: '0px' }, 400);
    });
}

function fadeOut() {
    const forecastSection = $('.forecast');


    forecastSection.animate({ opacity: 0 }, 500, function() {
        forecastSection.removeClass('visible').addClass('hidden');
    
    })
}