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

async function fetchWikipediaSummary(query) {
    const formattedQuery = encodeURIComponent(query);
    const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&titles=${formattedQuery}&origin=*`;

    try {
        const response = await fetch(wikipediaApiUrl);
        const data = await response.json();

        const pageId = Object.keys(data.query.pages)[0];
        const extract = data.query.pages[pageId]?.extract;

        if (extract) {
            const summary = extract.replace(/<\/?[^>]+(>|$)/g, '').split('\n')[0];
            return summary.trim() !== '' ? summary : null;
        } else {
            throw new Error('No information found on Wikipedia.');
        }
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching information from Wikipedia.');
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

    const ipinfoApiKey = '7ccae9c8d8744e';
    const ipinfoUrl = `https://ipinfo.io/json?token=${ipinfoApiKey}`;

    try {
        const ipinfoResponse = await fetch(ipinfoUrl);
        const ipinfoData = await ipinfoResponse.json();
        const userCity = ipinfoData.city;

        if (userInput.toLowerCase().includes('day today') || userInput.toLowerCase().includes('time') || userInput.toLowerCase().includes('date today')) {
            const currentDate = new Date();
            const response = `Today is ${currentDate.toDateString()} and the time is ${currentDate.toLocaleTimeString()}.`;
            await typeBotResponse(messageList, thinkingBubble, response);
        } else if (userInput.toLowerCase().includes('news')) {
            const newsApiKey = 'a1dcbaf052cd4e959ec5259eba1157db';
            const country = 'us';
            const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${newsApiKey}`;

            try {
                const newsResponse = await fetch(newsApiUrl);
                const newsData = await newsResponse.json();

                if (newsData.status === 'ok') {
                    const articles = newsData.articles.slice(0, 3);
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
            const weatherApiKey = '4b08a31d0b102256e3becde9631af19d';
            const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${userCity}&appid=${weatherApiKey}`;

            try {
                const weatherResponse = await fetch(weatherApiUrl);
                const weatherData = await weatherResponse.json();
                const temperatureKelvin = weatherData.main.temp;
                const temperatureCelsius = temperatureKelvin - 273.15;
                const roundedTemperature = Math.round(temperatureCelsius);
                const response = `The current temperature in ${userCity} is ${roundedTemperature}°C.`;

                await typeBotResponse(messageList, thinkingBubble, response);
            } catch (error) {
                console.error(error);
                await displayErrorMessage(messageList, thinkingBubble, 'Error fetching temperature.');
            }
        } else if (userInput.toLowerCase().includes('who is')) {
            const personQuery = userInput.toLowerCase().replace('who is', '').trim();

            try {
                const wikipediaSummary = await fetchWikipediaSummary(personQuery);

                if (wikipediaSummary !== null) {
                    await typeBotResponse(messageList, thinkingBubble, wikipediaSummary);
                } else {
                    throw new Error('No relevant information found on Wikipedia.');
                }
            } catch (error) {
                console.error(error);
                await displayErrorMessage(messageList, thinkingBubble, error.message);
            }
        } else {
            const apiUrl = 'https://api.openai.com/v1/engines/text-davinci-003/completions';
            const openaiApiKey = 'OpenAI-API-KEY';

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
