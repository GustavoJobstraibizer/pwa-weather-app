if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(console.error)

    function cleanWeatherCache(url) {
        navigator.serviceWorker.getRegistration().then(function (registration) {
            if (registration.active) registration.active.postMessage({ action: 'cleanWeatherCache' })
        })
    }
}

const WEATHER_APP = {
    api: {
        key: '79bcab648fe9629d655d57fb482183ab',
        url: 'https://api.openweathermap.org/data/2.5',
        lang: 'pt_br',
        units: 'metric'
    },
    coords: {
        lat: 0,
        lng: 0
    },
    infoWeatherImg: {
        clear: 'sun.png',
        clouds: 'cloudy.png',
        rain: 'rain.png'
    },
    listOfCitiesSearched: localStorage.getItem('listOfCities') || [],

    async _searchWeather(url) {
        try {
            const response = await (await fetch(url)).json()
            return {
                temperature: response?.main?.temp,
                humidity: response?.main?.humidity,
                city: response?.name,
                weatherDesc: response?.weather[0]?.main,
                wind: {
                    speed: response?.wind?.speed
                }
            }
        } catch(err) {
            console.log(err);
            return {
                temperature: 0,
                humidity: 0,
                city: '--',
                weatherDesc: '--',
                wind: {
                    speed: 0
                }
            }
        }
    },

    async _handleSearchCity() {
        const city = this.searchCity.value;

        if (!city) return;

        const url = `${this.api.url}/weather?q=${city}&appid=${this.api.key}&lang=${this.api.lang}&units=${this.api.units}`

        const response = await this._searchWeather(url);

        this.searchCity.value = '';
        this.searchCity.focus();

        const cities = (JSON.parse(localStorage.getItem('listOfCities'))) ?? []

        this._setInfoWeather(response)

        if (cities.includes(city)) return

        this.listOfCitiesSearched = [...cities, city];
        localStorage.setItem('listOfCities', JSON.stringify(this.listOfCitiesSearched))
    },

    _setInfoWeather({ temperature, humidity, city, weatherDesc, wind: { speed } }) {
        this.temperature.innerText = Math.round(temperature);
        this.humidity.innerText = `${humidity}%`;
        this.wind.innerText = `${speed} km/h`
        this.title.innerText = `Today's Report from - ${city}`
        this.weatherDesc.innerText = `It's ${weatherDesc}`

        this.weatherImg.src = `assets/images/${this.infoWeatherImg[weatherDesc.toLowerCase()] ?? 'sun.png'}`
    },

    _init() {
        this.searchCity = document.querySelector('[data-js="search-city"]')
        this.temperature = document.querySelector('[data-js="data-temperature"]')
        this.wind = document.querySelector('[data-js="data-wind"]')
        this.humidity = document.querySelector('[data-js="data-humidity"]')
        this.kilometerOther = document.querySelector('[data-js="data-km-other"]')
        this.title = document.querySelector('[data-js="title"]')
        this.weatherDesc = document.querySelector('[data-js="weather-desc"]')
        this.weatherImg = document.querySelector('[data-js="data-weather-img"]')
        this.btnSearch = document.querySelector('[data-js="search-city-btn"]')

        const setPosition = async (position) => {
            this.coords.lat = position.coords.latitude
            this.coords.lng = position.coords.longitude
            
            if ('serviceWorker' in navigator) {
                const listOfCities = (JSON.parse(localStorage.getItem('listOfCities'))) ?? []
                
                if (listOfCities.length > 0) {
                    cleanWeatherCache()
                }
            }
            
            const url = `${this.api.url}/weather?lat=${this.coords.lat}&lon=${this.coords.lng}&appid=${this.api.key}&lang=${this.api.lang}&units=${this.api.units}`
            const response = await this._searchWeather(url)

            this._setInfoWeather(response)
        }

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(setPosition)
        }

        this.btnSearch.addEventListener('click', () => this._handleSearchCity())
    }
}

window.addEventListener('load', () => WEATHER_APP._init());
