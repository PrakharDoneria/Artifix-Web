async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeBotResponse(messageList, thinkingBubble, response) {
    const botMessage = document.createElement('div');
    botMessage.className = 'message botMessage';

    for (let i = 0; i < response.length; i++) {
        botMessage.textContent += response[i];
        await sleep(50);
        messageList.scrollTop = messageList.scrollHeight;
    }

    thinkingBubble.style.display = 'none';
    messageList.appendChild(botMessage);
    document.getElementById('status').textContent = 'Online';
}

async function displayErrorMessage(messageList, thinkingBubble, error) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'message botMessage error';
    errorMessage.textContent = `Error: ${error}`;

    thinkingBubble.style.display = 'none';
    messageList.appendChild(errorMessage);
    document.getElementById('status').textContent = 'Online';
}

async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    const messageList = document.getElementById('messageList');
    const thinkingBubble = document.getElementById('thinkingBubble');

    const userMessage = document.createElement('div');
    userMessage.className = 'message userMessage';
    userMessage.textContent = userInput;
    messageList.appendChild(userMessage);

    thinkingBubble.style.display = 'inline';
    document.getElementById('status').textContent = 'Typing...';

    // Fetch user's location using ipinfo.io
    const ipinfoApiKey = '7ccae9c8d8744e'; // Replace with your actual IPinfo.io API key
    const ipinfoUrl = `https://ipinfo.io/json?token=${ipinfoApiKey}`;

    try {
        const ipinfoResponse = await fetch(ipinfoUrl);
        const ipinfoData = await ipinfoResponse.json();
        const userCity = ipinfoData.city;

        // Check for specific queries
        if (userInput.toLowerCase().includes('day today') || userInput.toLowerCase().includes('time') || userInput.toLowerCase().includes('date today')) {
            const currentDate = new Date();
            const response = `Today is ${currentDate.toDateString()} and the time is ${currentDate.toLocaleTimeString()}.`;
            await typeBotResponse(messageList, thinkingBubble, response);
        } else if (userInput.toLowerCase().includes('news')) {
            // Fetch news using News API based on user's country (you can use userCity or a default country)
            const newsApiKey = 'a1dcbaf052cd4e959ec5259eba1157db';
            const country = 'us'; // Replace with user's country or set a default

            const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${newsApiKey}`;

            try {
                const newsResponse = await fetch(newsApiUrl);
                const newsData = await newsResponse.json();

                if (newsData.status === 'ok') {
                    const articles = newsData.articles.slice(0, 3); // Displaying top 3 articles
                    const response = articles.map(article => `${article.title} - ${article.url}`).join('\n');
                    await typeBotResponse(messageList, thinkingBubble, response);
                } else {
                    throw new Error('Error fetching news.');
                }
            } catch (error) {
                console.error(error);
                await displayErrorMessage(messageList, thinkingBubble, 'Error fetching news.');
            }
        } else if (userInput.toLowerCase().includes('temperature')) {
            // Fetch temperature using OpenWeatherMap API
            const weatherApiKey = '4b08a31d0b102256e3becde9631af19d';
            const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${userCity}&appid=${weatherApiKey}`;

            try {
                const weatherResponse = await fetch(weatherApiUrl);
                const weatherData = await weatherResponse.json();
                const temperatureKelvin = weatherData.main.temp;
                const temperatureCelsius = temperatureKelvin - 273.15;
                const roundedTemperature = Math.round(temperatureCelsius); // Round to two decimal places
                const response = `The current temperature in ${userCity} is ${roundedTemperature}°C.`;

                await typeBotResponse(messageList, thinkingBubble, response);
            } catch (error) {
                console.error(error);
                await displayErrorMessage(messageList, thinkingBubble, 'Error fetching temperature.');
            }
        } else {
            // Default behavior using OpenAI GPT-3
            const apiUrl = 'https://api.openai.com/v1/engines/text-davinci-003/completions';
            const openaiApiKey = 'OpenAI-API-KEY'; // Replace with your actual OpenAI GPT-3 API key

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
    } catch (error) {
        console.error(error);
        await displayErrorMessage(messageList, thinkingBubble, 'Error fetching user location.');
    }

    document.getElementById('userInput').value = '';
}

function saveChatHistory() {
    const messageList = document.getElementById('messageList');
    const chatHistory = [];

    for (const message of messageList.children) {
        const type = message.classList.contains('userMessage') ? 'user' : 'bot';
        chatHistory.push({ type, message: message.textContent.trim() });
    }

    document.cookie = `chatHistory=${JSON.stringify(chatHistory)}`;
}

// Get cookie by name
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

// Populate chat history from cookies
function populateChatHistory() {
    const messageList = document.getElementById('messageList');
    const chatHistory = JSON.parse(getCookie('chatHistory')) || [];

    for (const entry of chatHistory) {
        const message = document.createElement('div');
        message.className = `message ${entry.type === 'user' ? 'userMessage' : 'botMessage'}`;
        message.textContent = entry.message;
        messageList.appendChild(message);
    }

    messageList.scrollTop = messageList.scrollHeight;
}

// Initial population of chat history
populateChatHistory();

// Save chat history when leaving the page
window.addEventListener('beforeunload', () => saveChatHistory());
