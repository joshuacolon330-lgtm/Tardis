import { GoogleGenAI } from "@google/genai";

const App = () => {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <header>
        <h1>Screenplay Generator</h1>
        <p>Describe your scene below and let AI bring it to life in screenplay format.</p>
    </header>
    <main>
        <div class="input-section">
            <label for="prompt-input" class="sr-only">Scene Description</label>
            <textarea id="prompt-input" placeholder="e.g., A detective interrogates a nervous suspect in a dimly lit room." aria-label="Scene Description"></textarea>
            <button id="generate-btn">
                <span>Generate Scene</span>
            </button>
        </div>
        <div id="result-container" class="hidden" aria-live="polite"></div>
    </main>
  `;

  const promptInput = document.getElementById('prompt-input') as HTMLTextAreaElement;
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  const resultContainer = document.getElementById('result-container') as HTMLDivElement;
  const buttonText = generateBtn.querySelector('span');
  
  // FIX: Moved `renderError` function before its first use to resolve block-scoped variable error.
  const renderError = (message: string) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    if (resultContainer.classList.contains('hidden')) {
        resultContainer.classList.remove('hidden');
    }
    resultContainer.prepend(errorDiv);
  }

  let ai: GoogleGenAI | null = null;
  try {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  } catch(e) {
    console.error(e);
    renderError('Could not initialize the AI. Please check your API key setup.');
    return;
  }

  const setLoading = (isLoading: boolean) => {
    generateBtn.disabled = isLoading;
    if (isLoading) {
        buttonText!.textContent = 'Generating...';
        const loader = document.createElement('div');
        loader.className = 'loader';
        generateBtn.prepend(loader);
    } else {
        buttonText!.textContent = 'Generate Scene';
        const loader = generateBtn.querySelector('.loader');
        if (loader) {
            loader.remove();
        }
    }
  };

  const handleGenerate = async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        alert('Please enter a scene description.');
        return;
    }

    if (!ai) {
        renderError('AI is not initialized.');
        return;
    }

    setLoading(true);

    try {
        const fullPrompt = `You are a professional screenwriter. Write the following scene in standard screenplay format. Do not include episode titles, act numbers, or page numbers. Only output the scene heading, action, character names, and dialogue for this single scene based on the user's prompt:\n\n${prompt}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        const generatedText = response.text;
        
        if (resultContainer.classList.contains('hidden')) {
            resultContainer.classList.remove('hidden');
        }

        if (resultContainer.innerHTML !== '' && !resultContainer.querySelector('.error-message')) {
            const hr = document.createElement('hr');
            resultContainer.appendChild(hr);
        }

        const pre = document.createElement('pre');
        pre.textContent = generatedText.trim();
        resultContainer.appendChild(pre);
        
        promptInput.value = '';
        
        resultContainer.scrollTop = resultContainer.scrollHeight;

    } catch (error) {
        console.error('Error generating screenplay:', error);
        renderError('An error occurred while generating the screenplay. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  generateBtn.addEventListener('click', handleGenerate);
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleGenerate();
    }
  });
};

App();
