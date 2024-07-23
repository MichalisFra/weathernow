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

// function onShowMoreClicked() {
//     $('.extended').toggleClass('hidden');
//     $(this).text($(this).text() === 'Show More' ? 'Show Less' : 'Show More')
//     if ($('.extended').is(!':visible')) {
//         $('.extended').show(700)
//     }
// }

function onShowMoreClicked() {
    if ($('.extended').hasClass('hidden')) {
        $('.extended').fadeIn(700).removeClass('hidden')
        $(this).text('Show Less')
    } else {
        $('.extended').fadeOut(700, function() {
            $(this).addClass('hidden')
        })
        $(this).text('Show More')
    }
}


async function getWeather(location) {
    if (!location) return

    try {
        onBeforeSend()
        const weather = await fetchWeatherFromApi(location)
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

async function fetchWeatherFromApi(location) {
    let apiKey = '773d87a5a09864b76e24306a4399635d';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`

    return await getXHRPromise(url);
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

function handleResults(response) {
    console.log('handleResults response:', response)
    if (response.cod === 200) {
        let transformed = transform(response)
        buildWeather(transformed)
    } else {
        console.log('Non-200 response code:', response.cod)
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


    const iconCode = response.weather[0].icon
    const iconClass = weatherIconMapping[iconCode]

    if (iconClass) {
        $('#weatherIcon').attr('class', `fa ${iconClass}`)
    } else {
        $('#weatherIcon').attr('src', `http://openweathermap.org/img/wn/${iconCode}@2x.png`) // Fallback to default
    }

    showComponent('.weather')
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
    if (mps < 0) {
      throw new Error("Wind speed cannot be negative")
    }
    
    if (mps < 0.5) return 0;
    else if (mps < 1.5) return 1;
    else if (mps < 3.3) return 2;
    else if (mps < 5.5) return 3;
    else if (mps < 7.9) return 4;
    else if (mps < 10.7) return 5;
    else if (mps < 13.8) return 6;
    else if (mps < 17.1) return 7;
    else if (mps < 20.7) return 8;
    else if (mps < 24.4) return 9;
    else if (mps < 28.4) return 10;
    else if (mps < 32.6) return 11;
    else return 12;
  }