import React, { useState } from 'react';
import { Trophy, Star, Volume2, Volume1, Check, ArrowRight, RefreshCcw } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function App() {
  const [mode, setMode] = useState('welcome');
  const [userName, setUserName] = useState('');
  const [targetWord, setTargetWord] = useState('');
  const [points, setPoints] = useState(0);
  const [lessonData, setLessonData] = useState(null);
  
  const [typeCount, setTypeCount] = useState(0);
  const [typeInput, setTypeInput] = useState('');
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [sentenceInput, setSentenceInput] = useState('');
  const [reviewInput, setReviewInput] = useState('');

  const fetchLessonData = async (word) => {
    setMode('loading');
    try {
      const rawKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
      const apiKey = rawKey.trim();
      
      if (!apiKey) {
        throw new Error("API key is missing in .env.local file");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

      const prompt = `Act as a teacher for a child. Analyze the word "${word}". Return ONLY a JSON object with this exact structure:
      {
        "meaning": "A simple, kid-friendly definition",
        "synonyms": ["synonym1", "synonym2"],
        "syllables": ["syl", "la", "bles"],
        "sentences": ["Kid friendly sentence 1 with ${word}.", "Sentence 2 with ${word}.", "Sentence 3 with ${word}."]
      }`;

      const result = await model.generateContent(prompt);
      let rawText = result.response.text();
      
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(rawText);
      
      setLessonData(parsedData);
      setMode('learn');
      setTypeCount(0);
      setTypeInput('');
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
      setMode('welcome');
    }
  };

  const playAudio = (rate) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(targetWord);
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const handleTypeCheck = () => {
    if (typeInput.toLowerCase().trim() === targetWord.toLowerCase().trim()) {
      setTypeCount(prev => prev + 1);
      setTypeInput('');
      setPoints(prev => prev + 5);
      if (typeCount + 1 >= 2) {
        setTimeout(() => {
          setMode('sentence');
          setSentenceIndex(0);
        }, 500);
      }
    } else {
      alert("Not quite! Take a close look at the letters and try again.");
    }
  };

  const handleSentenceCheck = () => {
    if (sentenceInput.toLowerCase().trim() === targetWord.toLowerCase().trim()) {
      setPoints(prev => prev + 10);
      setSentenceInput('');
      if (sentenceIndex < 2) {
        setSentenceIndex(prev => prev + 1);
      } else {
        setMode('review');
      }
    } else {
      alert("Try again! Sound it out.");
    }
  };

  const handleReviewSubmit = () => {
    if (reviewInput.trim().length > 1) {
      setTargetWord(reviewInput.trim());
      fetchLessonData(reviewInput.trim());
      setReviewInput('');
    } else {
      setMode('welcome');
      setTargetWord('');
    }
  };

  if (mode === 'welcome') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white/90 backdrop-blur-sm p-10 rounded-[3rem] shadow-2xl w-full max-w-xl text-center border-4 border-white">
          <h1 className="text-6xl font-black text-blue-500 mb-4 drop-shadow-sm">Spelling Buddy</h1>
          <div className="flex justify-center items-center gap-2 mb-8 text-2xl font-bold text-orange-400">
            <Trophy size={32} className="text-yellow-400" />
            <span>{points} Points</span>
          </div>

          <div className="space-y-6">
            {!userName ? (
              <div className="animate-fade-in">
                <p className="text-2xl text-gray-700 font-bold mb-4">What's your name, superstar?</p>
                <input
                  className="w-full text-center text-3xl p-6 rounded-full border-4 border-blue-200 focus:border-blue-500 focus:outline-none text-blue-700 font-bold"
                  placeholder="Type your name..."
                  onKeyDown={(e) => e.key === 'Enter' && setUserName(e.currentTarget.value)}
                  onBlur={(e) => setUserName(e.target.value)}
                />
              </div>
            ) : (
              <div className="animate-fade-in">
                <p className="text-3xl text-gray-700 font-bold mb-6">Hi, {userName}! 👋</p>
                <p className="text-2xl text-gray-600 font-bold mb-4">What word are we learning today?</p>
                <div className="flex flex-col gap-4">
                  <input
                    value={targetWord}
                    onChange={(e) => setTargetWord(e.target.value)}
                    className="w-full text-center text-4xl p-6 rounded-full border-4 border-purple-200 focus:border-purple-500 focus:outline-none text-purple-700 font-black"
                    placeholder="e.g., science"
                  />
                  <button 
                    onClick={() => fetchLessonData(targetWord)}
                    disabled={!targetWord}
                    className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black text-2xl p-6 rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-3"
                  >
                    Start Learning <ArrowRight size={32} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin text-blue-500 mb-6"><RefreshCcw size={80} /></div>
        <p className="text-3xl font-black text-blue-800 animate-pulse bg-white/50 px-8 py-4 rounded-full">Building your lesson...</p>
      </div>
    );
  }

  if (mode === 'learn') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-[3rem] shadow-2xl w-full max-w-2xl border-4 border-white">
          <div className="flex justify-between items-center mb-8 bg-blue-50 p-4 rounded-full">
            <span className="text-xl font-bold text-gray-500">Step 1: Understand & Practice</span>
            <div className="flex items-center text-orange-500 font-black text-xl bg-orange-100 px-4 py-2 rounded-full gap-2">
              <Star fill="currentColor" /> {points}
            </div>
          </div>

          <div className="mb-8 text-center bg-purple-50 p-6 rounded-3xl border-2 border-purple-100">
            <h2 className="text-2xl font-bold text-purple-800 mb-2">What does it mean?</h2>
            <p className="text-xl text-gray-700 font-semibold">{lessonData?.meaning}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Similar words:</span>
              {lessonData?.synonyms?.map((syn, i) => (
                <span key={i} className="bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-purple-100">{syn}</span>
              ))}
            </div>
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Let's sound it out!</h2>
            <div className="flex justify-center gap-3 mb-8 flex-wrap">
              {lessonData?.syllables?.map((syl, i) => (
                <div key={i} className="bg-gradient-to-b from-blue-400 to-blue-600 text-white text-4xl font-black px-6 py-4 rounded-2xl shadow-lg transform rotate-1 hover:rotate-0 transition-all cursor-default">
                  {syl}
                </div>
              ))}
            </div>
            
            <div className="flex justify-center gap-4">
              <button onClick={() => playAudio(1.0)} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-6 py-4 rounded-full font-bold text-xl hover:bg-blue-200 transition-colors">
                <Volume2 size={28} /> Normal Speed
              </button>
              <button onClick={() => playAudio(0.5)} className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-6 py-4 rounded-full font-bold text-xl hover:bg-indigo-200 transition-colors">
                <Volume1 size={28} /> Slow Motion
              </button>
            </div>
          </div>

          <div className="bg-green-50 p-8 rounded-3xl border-2 border-green-200 text-center">
            <h3 className="text-2xl font-bold text-green-800 mb-4">Type the word ({typeCount}/2)</h3>
            <div className="flex gap-4">
              <input
                value={typeInput}
                onChange={(e) => setTypeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTypeCheck()}
                className="flex-1 text-3xl p-4 rounded-2xl border-4 border-green-300 focus:border-green-500 focus:outline-none text-center font-bold text-green-900"
                placeholder="Type here..."
                autoFocus
              />
              <button onClick={handleTypeCheck} className="bg-green-500 text-white p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform">
                <Check size={40} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'sentence') {
    const currentSentence = lessonData?.sentences[sentenceIndex] || "";
    const sentenceParts = currentSentence.split(new RegExp(`(${targetWord})`, 'gi'));

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-sm p-10 rounded-[3rem] shadow-2xl w-full max-w-3xl border-4 border-white text-center">
          <div className="flex justify-between items-center mb-8 bg-blue-50 p-4 rounded-full">
            <span className="text-xl font-bold text-gray-500">Step 2: Fill in the blank ({sentenceIndex + 1}/3)</span>
            <div className="flex items-center text-orange-500 font-black text-xl bg-orange-100 px-4 py-2 rounded-full gap-2">
              <Star fill="currentColor" /> {points}
            </div>
          </div>

          <p className="text-4xl leading-relaxed font-bold text-gray-800 mb-10">
            {sentenceParts.map((part, i) => 
              part.toLowerCase() === targetWord.toLowerCase() ? (
                <span key={i} className="inline-block mx-2 border-b-8 border-blue-400 text-blue-600 px-4 pb-1 bg-blue-50 rounded-t-xl min-w-[150px]">
                  {sentenceInput || "____"}
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>

          <div className="flex justify-center gap-4 max-w-lg mx-auto">
            <input
              value={sentenceInput}
              onChange={(e) => setSentenceInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSentenceCheck()}
              className="flex-1 text-3xl p-6 rounded-2xl border-4 border-blue-300 focus:border-blue-500 focus:outline-none text-center font-bold"
              placeholder="Type missing word"
              autoFocus
            />
            <button onClick={handleSentenceCheck} className="bg-blue-500 text-white px-8 py-6 rounded-2xl shadow-lg hover:scale-105 transition-transform text-2xl font-bold">
              Check
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'review') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-sm p-10 rounded-[3rem] shadow-2xl w-full max-w-2xl text-center border-4 border-white">
          <Trophy size={80} className="text-yellow-400 mx-auto mb-6 drop-shadow-md" />
          <h2 className="text-5xl font-black text-gray-800 mb-4">Lesson Complete!</h2>
          <p className="text-2xl font-bold text-orange-500 mb-8">You earned {points} points so far!</p>

          <div className="bg-gray-50 p-8 rounded-3xl mb-8 border-2 border-gray-200">
            <h3 className="text-2xl font-bold text-gray-700 mb-6">Were any other words in those sentences tricky?</h3>
            <input
              value={reviewInput}
              onChange={(e) => setReviewInput(e.target.value)}
              className="w-full text-2xl p-6 rounded-2xl border-4 border-gray-300 focus:border-blue-500 focus:outline-none text-center font-bold mb-4"
              placeholder="Type a new word to learn..."
            />
            <p className="text-gray-500 font-bold">(Leave blank and click next if you're done)</p>
          </div>

          <button 
            onClick={handleReviewSubmit}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-2xl p-6 rounded-full shadow-lg hover:scale-105 transition-transform"
          >
            {reviewInput.trim().length > 1 ? "Learn this new word!" : "Learn a different word"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}