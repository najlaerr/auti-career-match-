import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, RefreshCw, Home, Play, Check, X, Loader2, Camera, User, Settings, Sparkles, Search, FileText, LogIn, LogOut } from 'lucide-react';
import { questions, Category, categoryNames } from './data/quizData';
import { generateCareerReport, generateResume } from './services/geminiService';
import Markdown from 'react-markdown';
import HeadTracker from './components/HeadTracker';

type Screen = 'HOME' | 'QUIZ' | 'LOADING' | 'RESULTS' | 'PROFILE';

export default function App() {
  const [screen, setScreen] = useState<Screen>('HOME');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<Category, number>>({
    LING: 0, LOGI: 0, VISU: 0, MUSI: 0, KINE: 0, NATU: 0, INTRA: 0, INTE: 0,
  });
  const [report, setReport] = useState<string>('');
  const [resume, setResume] = useState<string>('');
  const [useCamera, setUseCamera] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [highlightedAnswer, setHighlightedAnswer] = useState<boolean | null>(null);
  
  const [userEmail, setUserEmail] = useState<string>(localStorage.getItem('userEmail') || '');
  const [loginInput, setLoginInput] = useState('');
  const [topCategories, setTopCategories] = useState<string[]>(JSON.parse(localStorage.getItem('topCategories') || '[]'));

  const handleLogin = () => {
    if (loginInput.trim()) {
      const email = loginInput.trim();
      setUserEmail(email);
      localStorage.setItem('userEmail', email);
      if (report && resume) {
        localStorage.setItem('savedReport', report);
        localStorage.setItem('savedResume', resume);
        localStorage.setItem('topCategories', JSON.stringify(topCategories));
      }
    }
  };

  const handleLogout = () => {
    setUserEmail('');
    setLoginInput('');
    localStorage.removeItem('userEmail');
  };

  const exploreCareers = (categories: string[]) => {
    if (categories.length === 0) return;
    const query = encodeURIComponent(`entry level jobs for ${categories.join(' ')}`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const handleStart = () => {
    setScreen('QUIZ');
    setCurrentQuestionIndex(0);
    setScores({
      LING: 0, LOGI: 0, VISU: 0, MUSI: 0, KINE: 0, NATU: 0, INTRA: 0, INTE: 0,
    });
    setReport('');
    setResume('');
    setHighlightedAnswer(null);
  };

  const handleAnswer = (isYes: boolean) => {
    if (highlightedAnswer !== null) return; // Prevent double triggers while glowing

    setHighlightedAnswer(isYes);

    // Wait 800ms to show the glow effect before moving to the next question
    setTimeout(async () => {
      const currentQuestion = questions[currentQuestionIndex];
      
      let newScores = { ...scores };
      if (isYes) {
        newScores[currentQuestion.category] = newScores[currentQuestion.category] + 1;
        setScores(newScores);
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setHighlightedAnswer(null);
      } else {
        setScreen('LOADING');
        setHighlightedAnswer(null);
        
        // Calculate top 3 categories
        const sortedCategories = (Object.keys(newScores) as Category[])
          .sort((a, b) => newScores[b] - newScores[a])
          .slice(0, 3)
          .map(cat => categoryNames[cat]);
          
        setTopCategories(sortedCategories);

        try {
          const [generatedReport, generatedResume] = await Promise.all([
            generateCareerReport(sortedCategories),
            generateResume(sortedCategories)
          ]);
          setReport(generatedReport || 'Could not generate report. Please try again.');
          setResume(generatedResume || 'Could not generate resume. Please try again.');
          
          if (userEmail || localStorage.getItem('userEmail')) {
            localStorage.setItem('savedReport', generatedReport || '');
            localStorage.setItem('savedResume', generatedResume || '');
            localStorage.setItem('topCategories', JSON.stringify(sortedCategories));
          }
        } catch (error) {
          console.error(error);
          setReport('An error occurred while generating your report. Please try again.');
          setResume('An error occurred while generating your resume. Please try again.');
        }
        
        setScreen('RESULTS');
      }
    }, 800);
  };

  const goHome = () => {
    setScreen('HOME');
    setActiveTab('home');
  };

  const progressPercentage = (screen === 'RESULTS' || screen === 'LOADING')
    ? 100 
    : (currentQuestionIndex / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans selection:bg-blue-200">
      {/* Mobile App Container */}
      <div className="w-full max-w-md h-[100dvh] md:h-[850px] bg-[#EBF8FF] md:rounded-[3rem] md:shadow-2xl relative overflow-hidden flex flex-col border-x-0 md:border-x-8 md:border-y-8 border-slate-900">
        
        {/* Status Bar Area (Decorative) */}
        <div className="h-6 w-full bg-transparent absolute top-0 z-50 flex justify-center pt-2">
          <div className="w-20 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header & Progress (Only in Quiz, Loading, or Results) */}
        {screen !== 'HOME' && (
          <header className="w-full px-6 pt-10 pb-4 bg-white/50 backdrop-blur-md z-40 border-b border-white/20">
            <div className="flex items-center justify-between mb-3">
              <button onClick={goHome} className="p-2 bg-white rounded-full shadow-sm text-slate-600 hover:text-teal-600 transition-colors active:scale-95" aria-label="Go Home">
                <Home className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                {(screen === 'RESULTS' || screen === 'LOADING') ? 'Done!' : `Q ${currentQuestionIndex + 1} of ${questions.length}`}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-4 bg-white rounded-full shadow-inner border border-slate-200 overflow-hidden" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#D1E8E2] to-teal-400 flex items-center justify-end pr-1 rounded-full"
                initial={{ width: '10%' }}
                animate={{ width: `${Math.max(10, progressPercentage)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Rocket className="w-3 h-3 text-teal-800 transform rotate-45" aria-hidden="true" />
              </motion.div>
            </div>
          </header>
        )}

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden relative pb-24">
          <AnimatePresence mode="wait">
            {screen === 'HOME' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center text-center px-6 pt-20 pb-10 min-h-full justify-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-teal-200 blur-3xl opacity-50 rounded-full"></div>
                  <div className="w-40 h-40 bg-white rounded-[2.5rem] flex items-center justify-center shadow-[0_12px_0_0_#cbd5e1] border-4 border-slate-100 relative z-10 rotate-3 hover:rotate-0 transition-transform duration-300">
                    <span className="text-7xl">🦸‍♂️</span>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
                      <Sparkles className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h1 className="text-4xl font-extrabold text-slate-800 mb-3 leading-tight tracking-tight">
                    Find Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">Superpower</span>
                  </h1>
                  <p className="text-lg text-slate-600 font-medium leading-relaxed px-4">
                    Take this fun quiz to discover how your brain works best!
                  </p>
                </div>

                {/* Camera Toggle */}
                <div className="w-full max-w-xs bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${useCamera ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800">Magic Camera</p>
                      <p className="text-xs text-slate-500">Nod to answer!</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setUseCamera(!useCamera)}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${useCamera ? 'bg-teal-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${useCamera ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                <button
                  onClick={handleStart}
                  className="w-full max-w-xs flex items-center justify-center gap-3 px-8 py-5 bg-teal-500 text-white rounded-[2rem] font-bold text-xl shadow-[0_8px_0_0_#0f766e] active:shadow-[0_0px_0_0_#0f766e] active:translate-y-[8px] transition-all focus:outline-none"
                >
                  <Play className="w-6 h-6 fill-current" />
                  Start Quiz
                </button>
              </motion.div>
            )}

            {screen === 'QUIZ' && (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6 px-6 pt-6 pb-12 min-h-full"
              >
                {/* Camera Viewport (if enabled) */}
                {useCamera && (
                  <div className="flex justify-center mb-2">
                    <HeadTracker 
                      isActive={useCamera && screen === 'QUIZ'} 
                      onNod={() => handleAnswer(true)} 
                      onShake={() => handleAnswer(false)} 
                    />
                  </div>
                )}

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 text-center min-h-[180px] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-100 to-blue-100"></div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-relaxed z-10">
                    "{questions[currentQuestionIndex].text}"
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <button
                    onClick={() => handleAnswer(true)}
                    className={`flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-[2rem] border-2 transition-all duration-300 focus:outline-none ${
                      highlightedAnswer === true 
                        ? 'border-teal-400 ring-4 ring-teal-300 shadow-[0_0_30px_rgba(45,212,191,0.8)] scale-105 z-10' 
                        : 'border-slate-100 shadow-[0_6px_0_0_#cbd5e1] hover:border-teal-300 active:shadow-[0_0px_0_0_#cbd5e1] active:translate-y-[6px]'
                    }`}
                    aria-label="Yes, this is me"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ${highlightedAnswer === true ? 'bg-teal-500 text-white' : 'bg-teal-100 text-teal-600'}`}>
                      <Check className="w-8 h-8" strokeWidth={3} />
                    </div>
                    <span className="text-xl font-bold text-slate-700">Yes</span>
                  </button>

                  <button
                    onClick={() => handleAnswer(false)}
                    className={`flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-[2rem] border-2 transition-all duration-300 focus:outline-none ${
                      highlightedAnswer === false 
                        ? 'border-rose-400 ring-4 ring-rose-300 shadow-[0_0_30px_rgba(251,113,133,0.8)] scale-105 z-10' 
                        : 'border-slate-100 shadow-[0_6px_0_0_#cbd5e1] hover:border-rose-300 active:shadow-[0_0px_0_0_#cbd5e1] active:translate-y-[6px]'
                    }`}
                    aria-label="No, not really"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ${highlightedAnswer === false ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-500'}`}>
                      <X className="w-8 h-8" strokeWidth={3} />
                    </div>
                    <span className="text-xl font-bold text-slate-700">No</span>
                  </button>
                </div>
              </motion.div>
            )}

            {screen === 'LOADING' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center gap-6 px-6 py-20 min-h-full"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-teal-200 blur-xl opacity-50 rounded-full animate-pulse"></div>
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                    <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Analyzing...</h2>
                  <p className="text-slate-600 font-medium">Creating your personalized career report.</p>
                </div>
              </motion.div>
            )}

            {screen === 'RESULTS' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="px-6 pt-6 pb-12"
              >
                <div className="bg-white rounded-[2.5rem] shadow-xl p-6 md:p-8 border-4 border-white outline outline-1 outline-slate-100">
                  <div className="text-center mb-6">
                    <div className="inline-block bg-[#EBF8FF] rounded-full p-5 mb-4 shadow-inner">
                      <span className="text-5xl" aria-hidden="true">🏆</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-800 mb-1">
                      Your Superpower
                    </h2>
                    <p className="text-sm text-teal-600 font-bold uppercase tracking-wider">Official Report</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-3xl p-5 mb-6 border border-slate-100 prose prose-slate prose-sm max-w-none prose-headings:text-slate-800 prose-a:text-teal-600 prose-strong:text-slate-800 prose-p:leading-relaxed">
                    <div className="markdown-body">
                      <Markdown>{report}</Markdown>
                    </div>
                  </div>

                  <div className="bg-teal-50 rounded-3xl p-5 mb-8 border border-teal-100 prose prose-slate prose-sm max-w-none prose-headings:text-teal-800 prose-a:text-teal-600 prose-strong:text-teal-900 prose-p:leading-relaxed">
                    <h3 className="flex items-center gap-2 text-teal-800 mb-4 border-b border-teal-200 pb-2 font-bold text-lg">
                      <FileText className="w-5 h-5" /> Auto-Generated Resume
                    </h3>
                    <div className="markdown-body">
                      <Markdown>{resume}</Markdown>
                    </div>
                  </div>

                  <button
                    onClick={() => exploreCareers(topCategories)}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-[0_6px_0_0_#2563eb] active:shadow-[0_0px_0_0_#2563eb] active:translate-y-[6px] transition-all focus:outline-none mb-4"
                  >
                    <Search className="w-5 h-5" />
                    Explore Careers on Web
                  </button>

                  <button
                    onClick={handleStart}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-teal-500 text-white rounded-2xl font-bold text-lg shadow-[0_6px_0_0_#0f766e] active:shadow-[0_0px_0_0_#0f766e] active:translate-y-[6px] transition-all focus:outline-none"
                  >
                    <RefreshCw className="w-5 h-5" aria-hidden="true" />
                    Play Again
                  </button>
                </div>
              </motion.div>
            )}

            {screen === 'PROFILE' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="px-6 pt-10 pb-12 min-h-full flex flex-col"
              >
                {!userEmail ? (
                  <div className="flex flex-col items-center text-center mt-10">
                    <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <User className="w-12 h-12 text-teal-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-3">Create Profile</h2>
                    <p className="text-slate-600 font-medium mb-8 px-4">Log in with your email to save your superpower results and auto-generated resume!</p>
                    
                    <input 
                      type="email" 
                      placeholder="Enter your email address" 
                      className="w-full max-w-xs px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all mb-4 text-center font-medium"
                      value={loginInput}
                      onChange={e => setLoginInput(e.target.value)}
                    />
                    
                    <button 
                      onClick={handleLogin}
                      className="w-full max-w-xs flex items-center justify-center gap-3 px-8 py-4 bg-teal-500 text-white rounded-2xl font-bold text-xl shadow-[0_6px_0_0_#0f766e] active:shadow-[0_0px_0_0_#0f766e] active:translate-y-[6px] transition-all focus:outline-none"
                    >
                      <LogIn className="w-6 h-6" />
                      Log In
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-teal-600" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Logged in as</p>
                          <p className="text-sm font-bold text-slate-800 truncate">{userEmail}</p>
                        </div>
                      </div>
                      <button onClick={handleLogout} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors shrink-0">
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <h2 className="text-2xl font-extrabold text-slate-800 mb-4">Saved Results</h2>
                    
                    {localStorage.getItem('savedResume') ? (
                      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6">
                        <h3 className="text-lg font-bold text-teal-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                          <FileText className="w-5 h-5" /> My Auto-Resume
                        </h3>
                        <div className="prose prose-slate prose-sm max-w-none line-clamp-[10] relative overflow-hidden h-48">
                          <Markdown>{localStorage.getItem('savedResume') || ''}</Markdown>
                          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent"></div>
                        </div>
                        <button onClick={() => {
                           setReport(localStorage.getItem('savedReport') || '');
                           setResume(localStorage.getItem('savedResume') || '');
                           setTopCategories(JSON.parse(localStorage.getItem('topCategories') || '[]'));
                           setScreen('RESULTS');
                           setActiveTab('quiz');
                        }} className="w-full mt-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                          View Full Results
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white rounded-[2rem] p-8 text-center shadow-sm border border-slate-100">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium mb-6">You haven't saved any results yet.</p>
                        <button onClick={() => { setScreen('QUIZ'); setActiveTab('quiz'); }} className="px-6 py-3 bg-teal-500 text-white rounded-xl font-bold shadow-sm">
                          Take the Quiz
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-4 pb-6 flex justify-around items-center z-50 rounded-b-[2.5rem]">
          <button 
            onClick={goHome}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-teal-100' : ''}`} />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button 
            onClick={() => { if(screen === 'HOME' || screen === 'PROFILE') { setScreen(report ? 'RESULTS' : 'QUIZ'); } setActiveTab('quiz'); }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'quiz' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center -mt-6 shadow-lg border-4 border-[#EBF8FF] ${activeTab === 'quiz' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-white'}`}>
              <Play className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[10px] font-bold">Quiz</span>
          </button>
          <button 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
            onClick={() => { setScreen('PROFILE'); setActiveTab('profile'); }}
          >
            <User className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-teal-100' : ''}`} />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
