async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

async function typeBotResponse(messageList, thinkingBubble, response) {
    const botMessage = document.createElement('div');
    botMessage.className = 'message botMessage';

    const decodedResponse = decodeHtml(response);
    const textNode = document.createTextNode(decodedResponse);
    botMessage.appendChild(textNode);

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

async function fetchUserLocation() {
    const ipinfoApiKey = '7ccae9c8d8744e'; // Replace with your IPinfo.io API key
    const ipinfoUrl = `https://ipinfo.io/json?token=${ipinfoApiKey}`;

    try {
        const ipinfoResponse = await fetch(ipinfoUrl);
        const ipinfoData = await ipinfoResponse.json();
        return ipinfoData.city || 'Unknown';
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching user location.');
    }
}

async function fetchTriviaQuestion() {
    const triviaApiUrl = 'https://opentdb.com/api.php?amount=1&type=multiple';

    try {
        const response = await fetch(triviaApiUrl);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            return data.results[0].question;
        } else {
            throw new Error('Error fetching trivia question.');
        }
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching trivia question.');
    }
}

async function fetchNews(userCity) {
    const newsApiKey = 'a1dcbaf052cd4e959ec5259eba1157db';
    const newsApiUrl = `https://newsapi.org/v2/top-headlines?q=${userCity}&apiKey=${newsApiKey}`;

    try {
        const newsResponse = await fetch(newsApiUrl);
        const newsData = await newsResponse.json();
        const articles = newsData.articles.slice(0, 3); // Displaying top 3 articles
        return articles.map(article => `${article.title} - ${article.url}`).join('\n');
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching news.');
    }
}

async function fetchTemperature(userCity) {
    const weatherApiKey = '4b08a31d0b102256e3becde9631af19d';
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${userCity}&appid=${weatherApiKey}`;

    try {
        const weatherResponse = await fetch(weatherApiUrl);
        const weatherData = await weatherResponse.json();
        const temperatureKelvin = weatherData.main.temp;
        const temperatureCelsius = temperatureKelvin - 273.15;
        const roundedTemperature = Math.round(temperatureCelsius); // Round to two decimal places
        return `The current temperature in ${userCity} is ${roundedTemperature}°C.`;
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching temperature.');
    }
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

    try {
        if (userInput.toLowerCase().includes('ask me a question')) {
            const triviaQuestion = await fetchTriviaQuestion();
            await typeBotResponse(messageList, thinkingBubble, `Sure, here's a trivia question for you:\n${triviaQuestion}`);
        } else if (userInput.toLowerCase().includes('news')) {
            // Fetch user's location
            const userCity = await fetchUserLocation();

            // Fetch news based on user's city
            const newsResponse = await fetchNews(userCity);
            await typeBotResponse(messageList, thinkingBubble, newsResponse);
        } else if (userInput.toLowerCase().includes('temperature')) {
            // Fetch temperature based on user's city
            const userCity = await fetchUserLocation();
            const temperatureResponse = await fetchTemperature(userCity);
            await typeBotResponse(messageList, thinkingBubble, temperatureResponse);
        } else if (userInput.toLowerCase().includes('date') || userInput.toLowerCase().includes('time') || userInput.toLowerCase().includes('day')) {
            const currentDate = new Date();
            const response = `Today is ${currentDate.toDateString()} and the time is ${currentDate.toLocaleTimeString()}.`;
            await typeBotResponse(messageList, thinkingBubble, response);
        } else {
            const apiUrl = 'https://api.openai.com/v1/engines/text-davinci-004/completions';
            const openaiApiKey = 'OpenAI-API-KEY'; // Replace with your OpenAI API key

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

            if (response.choices && response.choices.length > 0) {
                await typeBotResponse(messageList, thinkingBubble, response.choices[0].text);
            } else {
                throw new Error('Invalid response from server');
            }
        }
    } catch (error) {
        console.error(error);
        await displayErrorMessage(messageList, thinkingBubble, error.message);
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

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

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

populateChatHistory();

window.addEventListener('beforeunload', () => saveChatHistory());
