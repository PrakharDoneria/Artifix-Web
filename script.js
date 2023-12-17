async function sendMessage() {
    const userInput = document.getElementById('userInput').value.toLowerCase();
    const messageList = document.getElementById('messageList');
    const thinkingBubble = document.getElementById('thinkingBubble');

    const userMessage = document.createElement('div');
    userMessage.className = 'message userMessage';
    userMessage.textContent = userInput;
    messageList.appendChild(userMessage);

    thinkingBubble.style.display = 'inline';
    document.getElementById('status').textContent = 'Typing...';

    const apiUrl = 'https://api.openai.com/v1/engines/text-davinci-003/completions';
    const openaiApiKey = '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';

    try {
        // Check if the user input contains a query about the current date/time/date
        if (userInput.includes('current date') || userInput.includes('current time') || userInput.includes('current day')) {
            const currentDate = new Date().toLocaleString();
            await typeBotResponse(messageList, thinkingBubble, `The current date and time is: ${currentDate}`);
        }
        // Check if the user input contains a query for live location
        else if (userInput.includes('live location')) {
            try {
                const position = await getCurrentLocation();
                const { latitude, longitude } = position.coords;
                await typeBotResponse(messageList, thinkingBubble, `Your current location is: Latitude ${latitude}, Longitude ${longitude}`);
            } catch (error) {
                console.error(error);
                await displayErrorMessage(messageList, thinkingBubble, 'Unable to retrieve live location.');
            }
        } else {
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
        }
    } catch (error) {
        console.error(error);
        await displayErrorMessage(messageList, thinkingBubble, error.message);
    }

    document.getElementById('userInput').value = '';
}

// Function to get the current location using Geolocation API
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}
