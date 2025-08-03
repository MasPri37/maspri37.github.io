<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Hypnosis Session - The Endless Story</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            background-color: #1a202c;
            color: #e2e8f0;
        }
        .loading-spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #f687b3;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="antialiased flex items-center justify-center min-h-screen p-4">

    <div id="game-container" class="bg-gray-800 text-gray-200 rounded-2xl shadow-2xl max-w-4xl w-full p-8 md:p-12 space-y-8 transition-all duration-500 ease-in-out">
        <h1 id="story-title" class="text-4xl md:text-5xl font-bold text-center mb-6 text-pink-400">The Hypnosis Session</h1>

        <div id="setup-screen" class="space-y-6">
            <p class="text-xl text-center">Hello. Dr. Anya is ready to see you. What kind of hypnotic persona will she subtly try to create in you?</p>
            <div class="flex flex-col items-center gap-4">
                <input type="text" id="persona-input" placeholder="e.g., drone, doll, feminization" class="w-full md:w-3/4 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400">
                <button id="start-button" class="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-full shadow-md transition-colors duration-300 ease-in-out text-lg focus:outline-none focus:ring-2 focus:ring-pink-400">Start Consultation</button>
            </div>
        </div>

        <div id="story-content" class="hidden">
            <div id="story-image-container" class="w-full h-80 bg-gray-700 rounded-lg overflow-hidden mb-6 flex items-center justify-center transition-all duration-500 ease-in-out relative">
                <div id="image-loader" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div class="loading-spinner"></div>
                </div>
                <img id="image-display" src="" alt="Story illustration" class="w-full h-full object-cover hidden">
            </div>

            <div id="story-text" class="text-lg md:text-xl leading-relaxed text-center min-h-[100px] flex items-center justify-center">
                <!-- Story text will be injected here -->
            </div>

            <div id="choice-input-container" class="flex flex-col md:flex-row justify-center gap-4 mt-8">
                <textarea id="player-choice-input" placeholder="What do you do? (Type 'story end' to finish)" rows="3" class="w-full md:w-3/4 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"></textarea>
                <button id="submit-choice-button" class="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-full shadow-md transition-colors duration-300 ease-in-out text-lg focus:outline-none focus:ring-2 focus:ring-pink-400">Submit</button>
            </div>
            
            <div id="summary-container" class="hidden mt-8 p-6 bg-gray-700 rounded-lg shadow-inner">
                <div id="summary-loader" class="flex flex-col items-center justify-center hidden">
                    <div class="loading-spinner mb-2 w-8 h-8"></div>
                    <p>Generating summary with ✨Gemini AI...</p>
                </div>
                <div id="summary-text" class="text-md md:text-lg leading-relaxed text-center">
                    <!-- LLM summary will be injected here -->
                </div>
            </div>
        </div>
    </div>

    <script>
        const setupScreen = document.getElementById('setup-screen');
        const startButton = document.getElementById('start-button');
        const personaInput = document.getElementById('persona-input');
        const storyContent = document.getElementById('story-content');
        const storyTextElement = document.getElementById('story-text');
        const storyImageElement = document.getElementById('image-display');
        const imageLoader = document.getElementById('image-loader');
        const playerChoiceInput = document.getElementById('player-choice-input');
        const submitChoiceButton = document.getElementById('submit-choice-button');
        const summaryContainer = document.getElementById('summary-container');
        const summaryTextElement = document.getElementById('summary-text');
        const summaryLoader = document.getElementById('summary-loader');
        
        let playerState = {
            resistance: 0,
            submissiveness: 0,
            persona: null,
            path: [],
            mind: "normal",
            appearance: "normal",
            consultationCount: 0,
            isInTrance: false,
        };

        const drAnyaImageDescription = "A high-quality, realistic photograph of a woman with long, vibrant pink hair, bangs, and dark sunglasses. She has a confident smirk and is wearing a tight white top. She has a nose ring. She is in a modern, clinical office.";

        // LLM prompts
        const analyzePrompt = (playerChoice, context) => ({
            contents: [{
                role: "user",
                parts: [{
                    text: `Analyze the following user's choice in a hypnosis story. The player is in a ${context} with Dr. Anya, who is trying to create a "${playerState.persona}" persona. Classify the user's intent as either "resist" or "submit". Also, provide a brief, creative description of the user's action.
                    User's choice: "${playerChoice}"
                    Return a JSON object with two keys: "intent" and "action".
                    Example 1: {"intent": "resist", "action": "They try to break free from the trance."}
                    Example 2: {"intent": "submit", "action": "They embrace the transformation and obey her command."}`
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "intent": { "type": "STRING" },
                        "action": { "type": "STRING" }
                    },
                    "propertyOrdering": ["intent", "action"]
                }
            }
        });

        const generateConsultationNarrative = (playerAction, persona) => `The player is in a consultation session with Dr. Anya. The player's last action was "${playerAction}". Dr. Anya's subtle goal is to create a "${persona}" persona. Write a new narrative paragraph for the consultation. Dr. Anya should talk about a mental problem the player has, subtly linking it to the persona. For example, if the persona is 'drone', she might talk about a lack of focus. She then gently leads the player into a trance.`;

        const generateTranceNarrative = (playerAction, persona) => `The player is in a trance state, in a surreal mental space. Their last action was "${playerAction}". Dr. Anya's blatant goal is to create a "${persona}" persona. Write a new narrative paragraph for the trance state. Dr. Anya should now give a direct, hypnotic suggestion related to the persona, describing how the player's mind or body changes in response.`;

        async function analyzePlayerChoiceWithLLM(choiceText) {
            summaryLoader.classList.remove('hidden');
            const context = playerState.isInTrance ? "trance state" : "consultation";
            const payload = analyzePrompt(choiceText, context);
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

            let response;
            let result;
            let retries = 3;
            let delay = 1000;

            while (retries > 0) {
                try {
                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        result = await response.json();
                        const jsonText = result.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
                        return JSON.parse(jsonText);
                    } else {
                        throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
                    }
                } catch (error) {
                    retries--;
                    if (retries > 0) {
                        await new Promise(res => setTimeout(res, delay));
                        delay *= 2;
                    } else {
                        console.error('Failed to analyze choice:', error);
                        return { intent: "resist", action: "They struggled against the mental command." };
                    }
                }
            }
        }
        
        async function handlePlayerChoice() {
            const playerChoice = playerChoiceInput.value.trim();
            if (!playerChoice) return;

            const endStoryKeywords = /(story end|end story|end game|stop now|i want to stop)/i;
            if (endStoryKeywords.test(playerChoice)) {
                endGame();
                return;
            }

            submitChoiceButton.disabled = true;
            imageLoader.classList.remove('hidden');
            storyImageElement.classList.add('hidden');
            playerChoiceInput.disabled = true;

            const analysis = await analyzePlayerChoiceWithLLM(playerChoice);
            playerState.path.push(analysis.action);

            if (analysis.intent === 'resist') {
                playerState.resistance += 1;
            } else if (analysis.intent === 'submit') {
                playerState.submissiveness += 1;
            }
            
            playerState.isInTrance = !playerState.isInTrance;
            if (!playerState.isInTrance) {
                playerState.consultationCount++;
            }
            
            updatePlayerStatus();
            
            let newNarrative;
            if (playerState.isInTrance) {
                newNarrative = await generateNarrativeWithLLM(generateTranceNarrative(analysis.action, playerState.persona));
            } else {
                newNarrative = await generateNarrativeWithLLM(generateConsultationNarrative(analysis.action, playerState.persona));
            }
            const newImagePrompt = `A detailed, realistic, and slightly surreal illustration for the following scene from a hypnosis story: "${newNarrative}". Dr. Anya is present in the scene, and she looks like ${drAnyaImageDescription}`;
            const newImage = await generateImage(newImagePrompt);

            renderScene({
                text: newNarrative,
                image: newImage
            });

            submitChoiceButton.disabled = false;
            playerChoiceInput.disabled = false;
            playerChoiceInput.value = '';
        }

        async function generateNarrativeWithLLM(prompt) {
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = { contents: chatHistory };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

            let response;
            let result;
            let retries = 3;
            let delay = 1000;

            while (retries > 0) {
                try {
                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        result = await response.json();
                        return result.candidates[0].content.parts[0].text;
                    } else {
                        throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
                    }
                } catch (error) {
                    retries--;
                    if (retries > 0) {
                        await new Promise(res => setTimeout(res, delay));
                        delay *= 2;
                    } else {
                        console.error('Failed to generate narrative:', error);
                        return "The story continues, but something went wrong. You feel a struggle for control.";
                    }
                }
            }
        }
        
        function updatePlayerStatus() {
             if (playerState.resistance > playerState.submissiveness + 1) {
                playerState.mind = "focused and defiant";
                playerState.appearance = "determined and in control";
             } else if (playerState.submissiveness > playerState.resistance + 1) {
                playerState.mind = `a blank slate, a perfect ${playerState.persona}`;
                playerState.appearance = `unblemished and perfectly obedient, like a ${playerState.persona}`;
             } else {
                playerState.mind = "confused and in conflict";
                playerState.appearance = "unsettled and changing";
             }
        }

        function getEnding() {
            if (playerState.resistance > playerState.submissiveness) {
                return 'ending_player_victory';
            } else {
                return 'ending_anya_victory';
            }
        }
        
        async function renderScene(scene) {
            storyTextElement.textContent = scene.text;
            storyImageElement.src = scene.image;
            imageLoader.classList.add('hidden');
            storyImageElement.classList.remove('hidden');
        }

        async function endGame() {
            playerChoiceInput.disabled = true;
            submitChoiceButton.disabled = true;
            
            const endScene = story[getEnding()];
            let finalText = endScene.text;
            if (playerState.resistance > playerState.submissiveness) {
                finalText = finalText.replace('{{persona}}', playerState.persona);
            } else {
                finalText = finalText.replace('{{persona}}', playerState.persona);
            }

            storyTextElement.textContent = finalText;
            
            imageLoader.classList.remove('hidden');
            storyImageElement.classList.add('hidden');
            const endingImage = await generateImage(endScene.imagePrompt.replace('{{persona}}', playerState.persona));
            storyImageElement.src = endingImage;
            imageLoader.classList.add('hidden');
            storyImageElement.classList.remove('hidden');
            
            const summaryButton = document.createElement('button');
            summaryButton.textContent = 'Get Post-Hypnosis Summary ✨';
            summaryButton.classList.add('bg-purple-500', 'hover:bg-purple-600', 'text-white', 'font-semibold', 'py-3', 'px-6', 'rounded-full', 'shadow-md', 'transition-colors', 'duration-300', 'ease-in-out', 'text-lg', 'focus:outline-none', 'focus:ring-2', 'focus:ring-purple-400');
            summaryButton.addEventListener('click', generatePostHypnosisSummary);
            
            document.getElementById('choice-input-container').innerHTML = '';
            document.getElementById('choice-input-container').appendChild(summaryButton);
        }
        
        async function generateImage(prompt) {
            const payload = {
                instances: { prompt: prompt },
                parameters: { "sampleCount": 1 }
            };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
            
            let response;
            let result;
            let retries = 3;
            let delay = 1000;

            while (retries > 0) {
                try {
                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        result = await response.json();
                        if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
                            return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
                        } else {
                            throw new Error('Image data not found in response.');
                        }
                    } else {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                } catch (error) {
                    retries--;
                    if (retries > 0) {
                        await new Promise(res => setTimeout(res, delay));
                        delay *= 2;
                    } else {
                        console.error('Failed to generate image after multiple retries:', error);
                        return `https://placehold.co/800x400/2d3748/e2e8f0?text=Image+Generation+Failed`;
                    }
                }
            }
        }
        
        async function generatePostHypnosisSummary() {
            summaryContainer.classList.remove('hidden');
            summaryLoader.classList.remove('hidden');
            summaryTextElement.textContent = '';
            document.getElementById('choice-input-container').style.display = 'none';

            let endingType = '';
            if (playerState.resistance > playerState.submissiveness) {
                endingType = `player victory, breaking free from the attempt to turn them into a ${playerState.persona}`;
            } else {
                endingType = `Dr. Anya's victory, successfully turning the player into a ${playerState.persona || 'submissive'}`;
            }

            const prompt = `Write a creative and engaging post-hypnosis summary for a story. The player's journey concluded with a ${endingType}. The player's journey involved the following actions and responses: ${playerState.path.join(', ')}. The player's final state of mind is "${playerState.mind}" and their final appearance is "${playerState.appearance}". Write the summary from a third-person perspective, providing a final, definitive conclusion to their story.`;

            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = { contents: chatHistory };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

            let response;
            let result;
            let retries = 3;
            let delay = 1000;

            while (retries > 0) {
                try {
                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        result = await response.json();
                        if (result.candidates && result.candidates.length > 0 &&
                            result.candidates[0].content && result.candidates[0].content.parts &&
                            result.candidates[0].content.parts.length > 0) {
                            const text = result.candidates[0].content.parts[0].text;
                            summaryTextElement.textContent = text;
                        } else {
                            throw new Error('LLM response structure unexpected.');
                        }
                        break;
                    } else {
                        throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
                    }
                } catch (error) {
                    retries--;
                    if (retries > 0) {
                        await new Promise(res => setTimeout(res, delay));
                        delay *= 2;
                    } else {
                        console.error('Failed to generate summary after multiple retries:', error);
                        summaryTextElement.textContent = 'Failed to generate summary. Please try again later.';
                    }
                }
            }
            summaryLoader.classList.add('hidden');
        }
        
        function initializeStory() {
            story = {
                ending_player_victory: {
                    text: "With a roar of defiance, you push back against her influence. The surreal world shatters like glass. You awaken in Dr. Anya's office, but this time you feel the chains breaking. Her face is a mask of shock and anger. 'It's over,' you say, and walk out the door into the bright sunlight, a free person once again. THE END.",
                    imagePrompt: "A person walking out of a modern, clinical office building into bright sunlight. They have a look of relief and newfound freedom on their face, leaving the shadows behind them. The building sign is blurred.",
                },
                ending_anya_victory: {
                    text: "You submit to her power completely. The world goes black. Dr. Anya's voice is the last thing you hear, 'Good. The transformation into my {{persona}} is complete.' You awaken, a perfect new creation, ready to serve her purpose. THE END.",
                    imagePrompt: "A close-up shot of a person with a smooth, blank face. Their eyes are perfectly still, reflecting a hypnotic pattern. They are dressed in a specific outfit, their appearance now matching the persona of a {{persona}}.",
                }
            };
            
            startButton.addEventListener('click', async () => {
                const persona = personaInput.value.trim();
                if (persona) {
                    playerState.persona = persona;
                    setupScreen.classList.add('hidden');
                    storyContent.classList.remove('hidden');
                    
                    const introText = `The door opens to reveal Dr. Anya. She smiles warmly, her piercing dark sunglasses obscuring her eyes. "Selamat siang. We're here to help you with some lingering... issues. Please, have a seat." You settle into the leather armchair as she begins to speak. She asks, "What's been on your mind lately? Any problems you'd like to work through?"`;
                    const introImagePrompt = `${drAnyaImageDescription}`;

                    storyTextElement.textContent = introText;
                    
                    const introImage = await generateImage(introImagePrompt);
                    storyImageElement.src = introImage;
                    imageLoader.classList.add('hidden');
                    storyImageElement.classList.remove('hidden');

                    submitChoiceButton.addEventListener('click', handlePlayerChoice);
                    playerChoiceInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handlePlayerChoice();
                        }
                    });
                }
            });
        }

        window.onload = initializeStory;
    </script>
</body>
</html>
