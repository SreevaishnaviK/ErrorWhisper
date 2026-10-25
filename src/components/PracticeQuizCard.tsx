import React, { useState, useEffect } from 'react';
import { PracticeQuestion, SupportedLanguage } from '../types';
import { ApiService } from '../services/api';
import { HelpCircle, CheckCircle2, XCircle, RotateCw, Lightbulb } from 'lucide-react';

interface PracticeQuizCardProps {
  practice: PracticeQuestion;
  language: SupportedLanguage;
  category: string;
}

export const PracticeQuizCard: React.FC<PracticeQuizCardProps> = ({
  practice: initialPractice,
  language,
  category,
}) => {
  const [currentQuiz, setCurrentQuiz] = useState<PracticeQuestion>(initialPractice);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentQuiz(initialPractice);
    setSelectedOption(null);
    setChecked(false);
    setGenError(null);
  }, [initialPractice]);

  const handleSelectOption = (opt: string) => {
    if (checked) return;
    setSelectedOption(opt);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    setChecked(true);
  };

  const isOptionCorrect = (opt: string) => {
    const cleanOpt = opt.trim().toLowerCase();
    const cleanAns = currentQuiz.answer.trim().toLowerCase();
    return cleanOpt === cleanAns || cleanAns.includes(cleanOpt) || cleanOpt.includes(cleanAns);
  };

  const userGotItRight = selectedOption ? isOptionCorrect(selectedOption) : false;

  const handleTryAnother = async () => {
    setIsGenerating(true);
    setGenError(null);
    setChecked(false);
    setSelectedOption(null);
    try {
      const newQ = await ApiService.fetchPracticeQuestion(
        language,
        category,
        currentQuiz.question
      );
      setCurrentQuiz(newQ);
    } catch (err: any) {
      setGenError(err.message || 'Could not generate another question. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#121826] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Test Your Understanding</h2>
            <p className="text-[11px] text-slate-400">
              Reinforce the concept so you spot it faster next time
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTryAnother}
          disabled={isGenerating}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{isGenerating ? 'Generating...' : 'Try Another Question'}</span>
        </button>
      </div>

      {genError && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
          {genError}
        </div>
      )}

      {/* Question */}
      <div className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed font-sans">
        {currentQuiz.question}
      </div>

      {/* Multiple Choice Options */}
      {currentQuiz.options && currentQuiz.options.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentQuiz.options.map((opt, i) => {
            const isSelected = selectedOption === opt;
            let buttonStyle = 'bg-[#0c101c] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60';

            if (checked) {
              const thisIsCorrect = isOptionCorrect(opt);
              if (thisIsCorrect) {
                buttonStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-medium';
              } else if (isSelected) {
                buttonStyle = 'bg-rose-950/40 border-rose-500 text-rose-200';
              } else {
                buttonStyle = 'bg-[#0c101c] border-slate-800 text-slate-500 opacity-60';
              }
            } else if (isSelected) {
              buttonStyle = 'bg-violet-950/60 border-violet-500 text-white shadow-sm';
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectOption(opt)}
                disabled={checked}
                className={`p-3 rounded-lg border text-xs text-left transition-all flex items-start gap-2 ${buttonStyle}`}
              >
                <span className="font-mono text-slate-400 font-semibold text-[11px] mt-0.5">
                  {String.fromCharCode(65 + i)}.
                </span>
                <span className="leading-relaxed flex-grow">{opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-3 bg-[#0c101c] border border-slate-800 rounded-lg text-xs text-slate-400">
          Think through the answer in your head, then click Check Answer below to verify.
        </div>
      )}

      {/* Check / Feedback Bar */}
      <div className="flex items-center justify-between pt-1">
        {!checked ? (
          <button
            type="button"
            onClick={handleCheckAnswer}
            disabled={currentQuiz.options && !selectedOption}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Check Answer
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium">
            {currentQuiz.options ? (
              userGotItRight ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Spot on! Great understanding.</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-400">
                  <XCircle className="w-4 h-4" />
                  <span>Not quite! See the explanation below.</span>
                </div>
              )
            ) : (
              <span className="text-slate-400">Answer details:</span>
            )}
          </div>
        )}
      </div>

      {/* Answer & Explanation Reveal */}
      {checked && (
        <div className="p-4 rounded-lg bg-[#0c101c] border border-slate-800 text-xs space-y-2">
          <div>
            <strong className="text-emerald-400 block mb-0.5 font-semibold">Correct Answer:</strong>
            <p className="text-slate-200 font-mono text-[11px]">{currentQuiz.answer}</p>
          </div>
          <div className="pt-2 border-t border-slate-800/80">
            <strong className="text-cyan-400 block mb-0.5 flex items-center gap-1 font-semibold">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Explanation:</span>
            </strong>
            <p className="text-slate-300 leading-relaxed font-sans">{currentQuiz.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};
