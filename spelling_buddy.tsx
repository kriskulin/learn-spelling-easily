import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowRight, Play, CheckCircle2, XCircle, 
  RefreshCw, Home, Star, Volume2, Volume1, Trophy, User, Check 
} from 'lucide-react';

export default function App() {
  // App States: 'welcome', 'setup', 'learn', 'loading', 'play', 'finished'
  const [appState, setAppState] = useState('welcome'); 
  
  // User Data
  const [childName, setChildName] = useState('');
  const [score, setScore] = useState(0);
  
  // Word & Gameplay Data
  const [targetWord, setTargetWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [synonyms, setSynonyms] = useState([]);
  const [syllables, setSyllables] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('idle'); // 'idle', 'correct', 'incorrect'
  const [errorMessage, setErrorMessage] = useState('');
  
  // Learn & Repeat State
  const [repeatInput, setRepeatInput] = useState('');
  const [repeatCount, setRepeatCount] = useState(0);

  // Review State
  const [difficultWordInput, setDifficultWordInput] = useState('');

  // --- Handlers ---

  const handleWelcomeSubmit = (e) => {
    e.preventDefault();
    if (childName.trim().length > 0) {
      setAppState('setup');
    }
  };

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (targetWord.trim().length >= 2) {
      setRepeatCount(0);
      setRepeatInput('');
      setDifficultWordInput('');
      generateLesson(targetWord);
    } else {
      setErrorMessage("Please enter a real word to study!");
    }
  };

  // Text-to-Speech Pronunciation
  const speakWord = (speed = 1.0) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any currently playing audio
      const utterance = new SpeechSynthesisUtterance(targetWord);
      utterance.rate = speed; 
      utterance.pitch = 1.1; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRepeatChange = (e) => {
    const val = e.target.value;
    setRepeatInput(val);
    
    // Auto-check if the word matches
    if (val.trim().toLowerCase() === targetWord.trim().toLowerCase()) {
      setRepeatCount(prev => prev + 1);
      setRepeatInput(''); // Clear input for the next try
      setScore(prev => prev + 5); // Bonus points for practicing
    }
  };

  const generateLesson = async (wordToLearn) => {
    const currentWord = wordToLearn || targetWord;
    setTargetWord(currentWord);
    setAppState('loading');

    const apiKey = ""; // Canvas runtime provides the API key automatically
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const prompt = `Provide the meaning, 3 synonyms, phonetic syllable breakdown (as an array of strings), and exactly 3 distinct, fun, and kid-friendly sentences using the EXACT word "${currentWord}". Do not change the tense, pluralization, or form of the word in the sentences. Include the child's name "${childName}" in at least one of the sentences to make it personal.`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            meaning: { type: "STRING" },
            synonyms: { type: "ARRAY", items: { type: "STRING" } },
            syllables: { type: "ARRAY", items: { type: "STRING" } },
            sentences: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["meaning", "synonyms", "syllables", "sentences"]
        }
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0) {
        const jsonText = result.candidates[0].content.parts[0].text;
        const generatedData = JSON.parse(jsonText);
        
        if (generatedData.sentences && generatedData.syllables && generatedData.meaning) {
          setSentences(generatedData.sentences);
          setSyllables(generatedData.syllables);
          setMeaning(generatedData.meaning);
          setSynonyms(generatedData.synonyms || []);
          setCurrentIndex(0);
          setUserInput('');
          setFeedback('idle');
          setAppState('learn');
        } else {
          throw new Error("Invalid format received.");
        }
      } else {
        throw new Error("Could not generate sentences.");
      }
    } catch (error) {
      console.error("API Error:", error);
      setErrorMessage("Oops! Our robots got confused. Let's try another word.");
      setAppState('setup');
    }
  };

  const handleCheckSpelling = (e) => {
    e.preventDefault();
    const isCorrect = userInput.trim().toLowerCase() === targetWord.trim().toLowerCase();
    
    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + 10); // 10 points per correct sentence
      
      setTimeout(() => {
        if (currentIndex < sentences.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setUserInput('');
          setFeedback('idle');
        } else {
          setScore(prev => prev + 50); // 50 points completion bonus
          setAppState('review'); // Go to new review screen instead of finished
        }
      }, 2000);
    } else {
      setFeedback('incorrect');
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (difficultWordInput.trim().length >= 2) {
      setRepeatCount(0);
      setRepeatInput('');
      setDifficultWordInput('');
      generateLesson(difficultWordInput.trim());
    }
  };

  const resetToSetup = () => {
    setAppState('setup');
    setTargetWord('');
    setMeaning('');
    setSynonyms([]);
    setSentences([]);
    setSyllables([]);
    setCurrentIndex(0);
    setUserInput('');
    setFeedback('idle');
    setErrorMessage('');
    setDifficultWordInput('');
  };

  const startOver = () => {
    setAppState('welcome');
    setChildName('');
    setScore(0);
    resetToSetup();
  };

  // Helper to replace the target word with blanks
  const getBlankedSentence = (sentence) => {
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapeRegExp(targetWord)}\\b`, 'gi');
    return sentence.replace(regex, '________');
  };

  return (
    <div className="min-h-screen bg-sky-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-lg w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white ring-4 ring-sky-200">
        
        {/* Header (Hidden on Welcome Screen) */}
        {appState !== 'welcome' && (
          <div className="bg-gradient-to-r from-blue-400 to-indigo-500 p-4 px-6 flex justify-between items-center text-white relative shadow-md z-10">
            <div className="flex items-center space-x-2">
              <Sparkles className="text-yellow-300 w-6 h-6 animate-pulse" />
              <h1 className="text-xl font-extrabold tracking-tight">Spelling Buddy</h1>
            </div>
            <div className="flex items-center space-x-2 bg-indigo-600/50 px-3 py-1.5 rounded-full border border-indigo-400/50">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-lg">{score}</span>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8">
          
          {/* 1. WELCOME MODE */}
          {appState === 'welcome' && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 py-8">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg transform rotate-3">
                <Sparkles className="w-12 h-12 text-yellow-300" />
              </div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 mb-2 text-center">
                Spelling Buddy
              </h1>
              <p className="text-slate-500 font-medium mb-8 text-center">The fun way to master your words!</p>
              
              <form onSubmit={handleWelcomeSubmit} className="w-full">
                <label className="block text-sm font-bold text-slate-600 mb-2 ml-2">What is your name?</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full text-xl font-bold p-4 pl-12 border-4 border-sky-100 rounded-2xl focus:border-blue-400 focus:ring-0 outline-none transition-colors mb-6 text-slate-700 placeholder:text-slate-300"
                    autoFocus
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!childName.trim()}
                  className="w-full bg-gradient-to-b from-green-400 to-green-500 text-white font-bold text-xl py-4 px-6 rounded-2xl shadow-[0_6px_0_0_#16a34a] active:shadow-[0_0px_0_0_#16a34a] active:translate-y-[6px] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Let's Go! <ArrowRight className="ml-2 w-6 h-6" />
                </button>
              </form>
            </div>
          )}

          {/* 2. SETUP MODE */}
          {appState === 'setup' && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <Star className="w-10 h-10 text-yellow-500 fill-current" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700 mb-6 text-center">
                Hi, <span className="text-blue-500">{childName}</span>! <br/> What word are we learning today?
              </h2>
              
              <form onSubmit={handleSetupSubmit} className="w-full">
                <input
                  type="text"
                  value={targetWord}
                  onChange={(e) => {
                    setTargetWord(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="e.g., photosynthesis"
                  className="w-full text-center text-3xl font-bold p-4 border-4 border-sky-100 rounded-2xl focus:border-blue-400 focus:ring-0 outline-none transition-colors mb-2 text-slate-700 placeholder:text-slate-300"
                  autoFocus
                />
                
                {errorMessage && (
                  <p className="text-rose-500 text-sm font-semibold text-center mb-4">{errorMessage}</p>
                )}
                
                <button
                  type="submit"
                  disabled={!targetWord.trim()}
                  className="w-full mt-4 bg-gradient-to-b from-blue-400 to-blue-500 text-white font-bold text-xl py-4 px-6 rounded-2xl shadow-[0_6px_0_0_#2563eb] active:shadow-[0_0px_0_0_#2563eb] active:translate-y-[6px] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Learning <ArrowRight className="ml-2 w-6 h-6" />
                </button>
              </form>

              <button onClick={startOver} className="mt-6 text-slate-400 hover:text-slate-600 text-sm font-semibold transition-colors">
                Not {childName}? Change user.
              </button>
            </div>
          )}

          {/* 3. LEARN & REPEAT MODE */}
          {appState === 'learn' && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
              <h2 className="text-3xl font-black text-blue-600 mb-2 text-center uppercase tracking-wide">
                {targetWord}
              </h2>
              
              {/* Meaning & Synonyms Box */}
              <div className="bg-white border-4 border-yellow-200 rounded-2xl p-5 w-full mb-6 shadow-sm flex flex-col items-center text-center">
                <h3 className="text-lg font-bold text-yellow-600 mb-1">What does it mean?</h3>
                <p className="text-slate-700 font-medium text-lg mb-4">{meaning}</p>
                
                {synonyms && synonyms.length > 0 && (
                  <div className="w-full">
                    <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase">Similar Words</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {synonyms.map((syn, i) => (
                        <span key={i} className="bg-purple-100 text-purple-700 font-bold px-4 py-1.5 rounded-full border-2 border-purple-200 text-sm">
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-slate-500 mb-4 text-center font-semibold">Listen to the parts of the word:</p>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 w-full flex flex-col items-center mb-6">
                {syllables.length > 0 ? (
                  <div className="flex flex-wrap justify-center items-center gap-2 mb-6 text-2xl md:text-3xl font-black text-blue-600 tracking-wider">
                    {syllables.map((syl, i) => (
                      <React.Fragment key={i}>
                        <span className="bg-blue-100 px-3 py-1 rounded-xl shadow-sm border border-blue-200">{syl}</span>
                        {i < syllables.length - 1 && <span className="text-blue-300 text-xl">•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <span className="text-4xl font-black text-blue-600 tracking-wider mb-6">
                    {targetWord}
                  </span>
                )}
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => speakWord(1.0)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-5 rounded-full flex items-center shadow-md active:scale-95 transition-all"
                  >
                    <Volume2 className="mr-2 w-5 h-5" /> Normal
                  </button>
                  <button
                    onClick={() => speakWord(0.5)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-5 rounded-full flex items-center shadow-md active:scale-95 transition-all"
                  >
                    <Volume1 className="mr-2 w-5 h-5" /> Slow
                  </button>
                </div>
              </div>

              <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 mb-8 text-center">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                  Unlock Challenge: Type it 2 times!
                </h3>
                
                {/* 2x Visual Indicators */}
                <div className="flex justify-center space-x-4 mb-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                      i < repeatCount 
                        ? 'bg-green-100 border-green-500 text-green-600 scale-110' 
                        : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                      {i < repeatCount ? <Check className="w-7 h-7" /> : <span className="font-bold text-xl">{i + 1}</span>}
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  value={repeatInput}
                  onChange={handleRepeatChange}
                  disabled={repeatCount >= 2}
                  placeholder={repeatCount >= 2 ? "All done! Awesome!" : "Type the word here..."}
                  className="w-full text-center text-xl font-bold p-3 border-4 border-slate-200 rounded-xl focus:border-green-400 focus:ring-0 outline-none transition-colors text-slate-700 disabled:bg-slate-100 disabled:text-green-600"
                />
              </div>

              <button
                onClick={() => setAppState('play')}
                disabled={repeatCount < 2}
                className="w-full bg-gradient-to-b from-green-400 to-green-500 text-white font-bold text-xl py-4 px-6 rounded-2xl shadow-[0_6px_0_0_#16a34a] active:shadow-[0_0px_0_0_#16a34a] active:translate-y-[6px] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ready for the Challenge! <Play className="ml-2 w-6 h-6 fill-current" />
              </button>
            </div>
          )}

          {/* 4. LOADING MODE */}
          {appState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-8 border-sky-100 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold text-slate-600 animate-pulse text-center leading-relaxed">
                Fetching details and sentences for<br/> <span className="text-blue-600 text-2xl font-black">"{targetWord}"</span>...
              </h2>
            </div>
          )}

          {/* 5. PLAY MODE */}
          {appState === 'play' && (
            <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-blue-100 text-blue-700 font-bold px-4 py-1.5 rounded-full text-sm">
                  Sentence {currentIndex + 1} of {sentences.length}
                </span>
                <button 
                  onClick={resetToSetup}
                  className="text-slate-400 hover:text-rose-500 transition-colors flex items-center text-sm font-semibold"
                >
                   Quit Game
                </button>
              </div>

              <div className="bg-slate-50 border-2 border-slate-100 p-6 sm:p-8 rounded-2xl mb-6 shadow-inner text-center">
                <p className="text-2xl font-medium leading-relaxed text-slate-700">
                  {getBlankedSentence(sentences[currentIndex])}
                </p>
              </div>

              <form onSubmit={handleCheckSpelling} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => {
                      setUserInput(e.target.value);
                      if (feedback === 'incorrect') setFeedback('idle');
                    }}
                    disabled={feedback === 'correct'}
                    placeholder="Type the missing word"
                    className={`w-full text-center text-3xl font-bold p-4 border-4 rounded-2xl focus:outline-none transition-colors mb-6 shadow-sm
                      ${feedback === 'idle' ? 'border-sky-200 focus:border-blue-400 text-slate-700' : ''}
                      ${feedback === 'correct' ? 'border-green-400 bg-green-50 text-green-700' : ''}
                      ${feedback === 'incorrect' ? 'border-rose-400 bg-rose-50 text-rose-700 animate-shake' : ''}
                    `}
                    autoFocus
                  />
                  {feedback === 'correct' && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-green-500 animate-in zoom-in" />
                  )}
                  {feedback === 'incorrect' && (
                    <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-rose-500 animate-in zoom-in" />
                  )}
                </div>

                {feedback === 'correct' ? (
                  <div className="bg-green-100 text-green-700 p-4 rounded-2xl text-center font-bold text-xl animate-in slide-in-from-bottom-2">
                    Awesome job, {childName}! 🎉 +10 Points
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!userInput.trim() || feedback === 'correct'}
                    className="w-full bg-gradient-to-b from-blue-400 to-blue-500 text-white font-bold text-xl py-4 px-6 rounded-2xl shadow-[0_6px_0_0_#2563eb] active:shadow-[0_0px_0_0_#2563eb] active:translate-y-[6px] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Check Answer <ArrowRight className="ml-2 w-6 h-6" />
                  </button>
                )}
                
                {feedback === 'incorrect' && (
                  <p className="text-rose-500 text-center font-semibold mt-4 animate-in fade-in">
                    Not quite! Keep trying. Listen to the word if you need a hint.
                  </p>
                )}
              </form>
            </div>
          )}

          {/* 6. REVIEW MODE */}
          {appState === 'review' && (
            <div className="flex flex-col animate-in slide-in-from-bottom-4 duration-500 py-4">
              <div className="text-center mb-6">
                <Trophy className="w-20 h-20 text-yellow-400 fill-current inline-block animate-bounce mb-2" />
                <h2 className="text-3xl font-black text-slate-800">Great Job, {childName}!</h2>
                <p className="text-slate-500 font-medium mt-1">You mastered <span className="font-bold text-blue-600">"{targetWord}"</span> and scored {score} points so far.</p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mb-6">
                <h3 className="text-lg font-bold text-blue-800 mb-3">Let's review the sentences:</h3>
                <ul className="space-y-3 text-left">
                  {sentences.map((sentence, idx) => (
                    <li key={idx} className="text-slate-700 bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-sm md:text-base font-medium">
                      {sentence}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 text-center shadow-inner">
                <h3 className="text-lg font-bold text-slate-700 mb-2">Did you find any other word difficult?</h3>
                <p className="text-sm text-slate-500 mb-4">Type a word from the sentences to learn it next!</p>
                
                <form onSubmit={handleReviewSubmit} className="mb-4">
                  <input
                    type="text"
                    value={difficultWordInput}
                    onChange={(e) => setDifficultWordInput(e.target.value)}
                    placeholder="Enter difficult word..."
                    className="w-full text-center text-xl font-bold p-4 border-4 border-slate-200 rounded-2xl focus:border-purple-400 focus:ring-0 outline-none transition-colors mb-4 text-slate-700"
                  />
                  <button
                    type="submit"
                    disabled={!difficultWordInput.trim()}
                    className="w-full bg-gradient-to-b from-purple-400 to-purple-500 text-white font-bold text-lg py-3 px-6 rounded-2xl shadow-[0_4px_0_0_#9333ea] active:shadow-[0_0px_0_0_#9333ea] active:translate-y-[4px] transition-all disabled:opacity-50"
                  >
                    Learn New Word <ArrowRight className="ml-2 w-5 h-5 inline" />
                  </button>
                </form>

                <div className="flex items-center justify-center my-4">
                  <div className="h-px bg-slate-300 flex-1"></div>
                  <span className="px-4 text-sm font-bold text-slate-400 uppercase tracking-widest">or</span>
                  <div className="h-px bg-slate-300 flex-1"></div>
                </div>

                <button
                  onClick={resetToSetup}
                  className="w-full bg-white text-slate-600 border-2 border-slate-200 font-bold text-lg py-3 px-6 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  No difficult words! Let's enter a new word.
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Custom Shake Animation for incorrect answers */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </div>
  );
}