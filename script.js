async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    const messageList = document.getElementById('messageList');
    const thinkingBubble = document.getElementById('thinkingBubble');

    // Clear input box text
    clearInput();

    const userMessage = document.createElement('div');
    userMessage.className = 'message userMessage';
    userMessage.textContent = userInput;
    messageList.appendChild(userMessage);

    thinkingBubble.style.display = 'inline';
    document.getElementById('status').textContent = 'Typing...';

    // Check for specific queries
    if (userInput.toLowerCase().includes('date') || userInput.toLowerCase().includes('time') || userInput.toLowerCase().includes('day')) {
        // Handle date, time, day query
        const currentDate = new Date().toLocaleString();
        await typeBotResponse(messageList, thinkingBubble, `Current date and time: ${currentDate}`);
    } else if (userInput.toLowerCase().includes('news')) {
        // Handle news query
        const newsApiKey = 'a1dcbaf052cd4e959ec5259eba1157db'; // Replace with your News API key

        try {
            const newsResponse = await fetch(`https://newsapi.org/v2/top-headlines?apiKey=${newsApiKey}`);
            const newsData = await newsResponse.json();

            if (newsData.articles && newsData.articles.length > 0) {
                const topNews = newsData.articles[0].title;
                await typeBotResponse(messageList, thinkingBubble, `Latest news: ${topNews}`);
            } else {
                throw new Error('No news articles found.');
            }
        } catch (error) {
            console.error(error);
            await displayErrorMessage(messageList, thinkingBubble, 'Error fetching news.');
        }
    } else if (userInput.toLowerCase().includes('temperature')) {
        // Handle temperature query using OpenWeatherMap API
        const openWeatherApiKey = '4b08a31d0b102256e3becde9631af19d'; // Replace with your OpenWeatherMap API key

        try {
            const locationData = await getCurrentLocation();
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${locationData.latitude}&lon=${locationData.longitude}&appid=${openWeatherApiKey}`);
            const weatherData = await weatherResponse.json();

            if (weatherData.main && weatherData.main.temp) {
                const currentTemperature = weatherData.main.temp;
                await typeBotResponse(messageList, thinkingBubble, `Current temperature: ${currentTemperature}°C`);
            } else {
                throw new Error('Temperature data not available.');
            }
        } catch (error) {
            console.error(error);
            await displayErrorMessage(messageList, thinkingBubble, 'Error fetching temperature.');
        }
    } else {
        // Handle generic query using OpenAI API
        const apiUrl = 'https://api.openai.com/v1/engines/gpt-3.5-turbo-1106/completions';
        const openaiApiKey = 'OpenAI-API-KEY-HERE';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
                body: JSON.stringify({
                    prompt: userInput,
                    max_tokens: 50,
                    temperature: 0.5,
                }),
            }).then(res => res.json());

            console.log(response);

            if (response.choices && response.choices.length > 0) {
                await typeBotResponse(messageList, thinkingBubble, response.choices[0].text);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error(error);
            await displayErrorMessage(messageList, thinkingBubble, error.message);
        }
    }
}

async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            error => {
                reject(error);
            }
        );
    });
}
