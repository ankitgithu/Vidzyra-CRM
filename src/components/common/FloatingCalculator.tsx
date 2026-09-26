import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calculator,
  X,
  Delete,
  Percent,
  Divide,
  X as Multiply,
  Minus,
  Plus,
  Equal,
  Copy,
  Check,
  History,
  Trash2,
} from 'lucide-react';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

/**
 * Evaluates standard arithmetic expressions with operator precedence (* and / before + and -),
 * handles unary minus and prevents division by zero.
 */
function evaluateMathExpression(input: string): { result?: number; error?: string } {
  const sanitized = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .trim();

  if (!sanitized) return { result: 0 };

  const tokens: (number | string)[] = [];
  let i = 0;
  let expectUnary = true;

  while (i < sanitized.length) {
    const char = sanitized[i];
    if (char === ' ') {
      i++;
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      if (char === '-' && expectUnary) {
        // Unary minus: negative number
        i++;
        let numStr = '-';
        while (
          i < sanitized.length &&
          ((sanitized[i] >= '0' && sanitized[i] <= '9') || sanitized[i] === '.')
        ) {
          numStr += sanitized[i];
          i++;
        }
        if (numStr === '-') return { error: 'Invalid expression' };
        const num = parseFloat(numStr);
        if (isNaN(num)) return { error: 'Invalid expression' };
        tokens.push(num);
        expectUnary = false;
        continue;
      }

      tokens.push(char);
      expectUnary = true;
      i++;
    } else if ((char >= '0' && char <= '9') || char === '.') {
      let numStr = '';
      while (
        i < sanitized.length &&
        ((sanitized[i] >= '0' && sanitized[i] <= '9') || sanitized[i] === '.')
      ) {
        numStr += sanitized[i];
        i++;
      }
      const num = parseFloat(numStr);
      if (isNaN(num)) return { error: 'Invalid expression' };
      tokens.push(num);
      expectUnary = false;
    } else {
      return { error: 'Invalid expression' };
    }
  }

  if (tokens.length === 0) return { result: 0 };

  // Remove trailing operators if any
  while (typeof tokens[tokens.length - 1] === 'string') {
    tokens.pop();
  }

  if (tokens.length === 0) return { result: 0 };

  // Pass 1: Handle multiplication and division (higher precedence)
  const pass1: (number | string)[] = [];
  let idx = 0;
  while (idx < tokens.length) {
    const token = tokens[idx];
    if (token === '*' || token === '/') {
      const prevNum = pass1.pop();
      const nextNum = tokens[idx + 1];
      if (typeof prevNum !== 'number' || typeof nextNum !== 'number') {
        return { error: 'Invalid expression' };
      }
      if (token === '/') {
        if (nextNum === 0) {
          return { error: 'Cannot divide by 0' };
        }
        pass1.push(prevNum / nextNum);
      } else {
        pass1.push(prevNum * nextNum);
      }
      idx += 2;
    } else {
      pass1.push(token);
      idx++;
    }
  }

  // Pass 2: Handle addition and subtraction (left to right)
  let result = pass1[0];
  if (typeof result !== 'number') return { error: 'Invalid expression' };

  let p = 1;
  while (p < pass1.length) {
    const op = pass1[p];
    const nextVal = pass1[p + 1];
    if (typeof nextVal !== 'number') return { error: 'Invalid expression' };

    if (op === '+') {
      result += nextVal;
    } else if (op === '-') {
      result -= nextVal;
    } else {
      return { error: 'Invalid expression' };
    }
    p += 2;
  }

  // Avoid JavaScript floating point inaccuracies (e.g., 0.1 + 0.2 = 0.3)
  const cleanResult = parseFloat(result.toFixed(10));
  return { result: cleanResult };
}

export const FloatingCalculator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expression, setExpression] = useState('');
  const [currentInput, setCurrentInput] = useState('0');
  const [isResult, setIsResult] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Calculator Action Handlers
  const handleDigit = (digit: string) => {
    if (isError) {
      setIsError(false);
      setExpression('');
      setCurrentInput(digit);
      setIsResult(false);
      return;
    }

    if (isResult) {
      // Start a brand new calculation if pressing a number after equals
      setExpression('');
      setCurrentInput(digit);
      setIsResult(false);
      return;
    }

    if (currentInput === '0') {
      setCurrentInput(digit);
    } else {
      // Limit maximum length to keep display manageable
      if (currentInput.length >= 16) return;
      setCurrentInput((prev) => prev + digit);
    }
  };

  const handleDecimal = () => {
    if (isError || isResult) {
      setIsError(false);
      setExpression('');
      setCurrentInput('0.');
      setIsResult(false);
      return;
    }

    if (!currentInput.includes('.')) {
      setCurrentInput((prev) => (prev ? prev + '.' : '0.'));
    }
  };

  const handleOperator = (op: string) => {
    const symbol = op === '*' ? '×' : op === '/' ? '÷' : op === '-' ? '−' : '+';

    if (isError) {
      setIsError(false);
      setExpression('');
      setCurrentInput('0');
      setIsResult(false);
      return;
    }

    if (isResult) {
      // Continue from the previous result
      setExpression(`${currentInput} ${symbol} `);
      setCurrentInput('');
      setIsResult(false);
      return;
    }

    if (currentInput !== '') {
      setExpression((prev) => `${prev}${currentInput} ${symbol} `);
      setCurrentInput('');
    } else if (expression !== '') {
      // Replace the last operator with the new one
      setExpression((prev) => {
        const trimmed = prev.trim();
        const replaced = trimmed.replace(/[+\−\×\÷\*\/\-]$/, symbol);
        return `${replaced} `;
      });
    }
  };

  const handleEquals = () => {
    if (isError) return;

    const fullExpr = `${expression}${currentInput}`.trim();
    if (!fullExpr || isResult) return;

    const evalResult = evaluateMathExpression(fullExpr);

    if (evalResult.error) {
      setIsError(true);
      setCurrentInput(evalResult.error);
      setExpression(`${fullExpr} =`);
      setIsResult(true);
    } else if (evalResult.result !== undefined) {
      const resStr = evalResult.result.toString();
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        expression: fullExpr,
        result: resStr,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 19)]);
      setExpression(`${fullExpr} =`);
      setCurrentInput(resStr);
      setIsResult(true);
    }
  };

  const handleClear = () => {
    setExpression('');
    setCurrentInput('0');
    setIsResult(false);
    setIsError(false);
  };

  const handleBackspace = () => {
    if (isError || isResult) {
      handleClear();
      return;
    }

    if (currentInput.length > 1) {
      setCurrentInput((prev) => prev.slice(0, -1));
    } else if (currentInput.length === 1) {
      setCurrentInput('0');
    } else if (currentInput === '' && expression.length > 0) {
      // Remove last operator or operand segment from expression
      setExpression((prev) => prev.trim().slice(0, -1).trim());
    }
  };

  const handlePercent = () => {
    if (isError) return;

    const num = parseFloat(currentInput || '0');
    if (isNaN(num)) return;

    // Convert current number to percentage
    const percentVal = parseFloat((num / 100).toFixed(10));
    setCurrentInput(percentVal.toString());
  };

  const handleCopyResult = () => {
    const textToCopy = currentInput || '0';
    if (!textToCopy || isError) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1600);
    });
  };

  const handleApplyHistory = (item: HistoryItem) => {
    setCurrentInput(item.result);
    setExpression(`${item.expression} =`);
    setIsResult(true);
    setIsError(false);
    setShowHistory(false);
  };

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture keystrokes if the user is typing in another CRM input or textarea
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isInput && !panelRef.current?.contains(target)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (e.key === '*') {
        e.preventDefault();
        handleOperator('*');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('/');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Delete' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      } else if (e.key === '%') {
        e.preventDefault();
        handlePercent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentInput, expression, isResult, isError]);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        ref={toggleBtnRef}
        id="crm-floating-calculator-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close Calculator' : 'Open Calculator'}
        title="Calculator"
        className={`fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full shadow-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isOpen
            ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/30 ring-2 ring-indigo-400'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30 hover:scale-105'
        }`}
      >
        <Calculator className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200" />
      </button>

      {/* Floating Calculator Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="crm-floating-calculator-panel"
          role="dialog"
          aria-label="Floating Calculator"
          className="fixed bottom-20 right-4 sm:right-6 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden select-none flex flex-col font-sans transition-all duration-200 animate-in fade-in zoom-in-95"
          style={{ maxHeight: 'calc(100vh - 6.5rem)' }}
        >
          {/* Header Bar */}
          <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600/80 flex items-center justify-center text-white">
                <Calculator className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-100">
                Calculator
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* History Toggle */}
              <button
                type="button"
                onClick={() => setShowHistory((prev) => !prev)}
                title={showHistory ? 'Back to keypad' : 'View history'}
                aria-label="Calculation History"
                className={`p-1.5 rounded-lg text-xs transition ${
                  showHistory
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Calculator (Esc)"
                aria-label="Close Calculator"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Calculator Screen / Display */}
          <div className="bg-slate-900/95 px-4 pt-3 pb-3.5 flex flex-col justify-end text-right border-b border-slate-800/80">
            {/* Expression / Formula Display */}
            <div className="h-5 text-xs font-mono text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center justify-end">
              {expression || (showHistory ? 'History Mode' : '\u00A0')}
            </div>

            {/* Current Value / Result Display */}
            <div className="flex items-center justify-between gap-2 mt-1">
              <button
                type="button"
                onClick={handleCopyResult}
                title="Copy result"
                aria-label="Copy result"
                className="p-1 text-slate-500 hover:text-indigo-400 transition rounded-md"
              >
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <div
                className={`font-mono font-bold tracking-tight text-right overflow-x-auto whitespace-nowrap scrollbar-none flex-1 ${
                  isError
                    ? 'text-rose-400 text-base'
                    : currentInput.length > 10
                    ? 'text-lg text-white'
                    : 'text-2xl text-white'
                }`}
              >
                {currentInput || '0'}
              </div>
            </div>
          </div>

          {/* Body: Keypad or History */}
          {showHistory ? (
            <div className="p-3 bg-slate-50 flex-1 max-h-[310px] overflow-y-auto">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Recent Calculations
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    title="Clear history"
                    className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No calculations yet
                </div>
              ) : (
                <div className="space-y-1.5">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleApplyHistory(item)}
                      className="w-full text-right p-2 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 transition group"
                    >
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {item.expression}
                      </div>
                      <div className="text-sm font-bold text-slate-800 font-mono group-hover:text-indigo-600 transition">
                        = {item.result}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-white grid grid-cols-4 gap-2">
              {/* Row 1: Clear, Backspace, %, ÷ */}
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear All"
                className="h-10 sm:h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm flex items-center justify-center transition active:scale-95 border border-rose-100"
              >
                C
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                aria-label="Backspace"
                className="h-10 sm:h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                <Delete className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handlePercent}
                aria-label="Percent"
                className="h-10 sm:h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                <Percent className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleOperator('/')}
                aria-label="Divide"
                className="h-10 sm:h-11 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-base flex items-center justify-center transition active:scale-95 border border-indigo-100"
              >
                <Divide className="w-4 h-4" />
              </button>

              {/* Row 2: 7, 8, 9, × */}
              <button
                type="button"
                onClick={() => handleDigit('7')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleDigit('8')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleDigit('9')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleOperator('*')}
                aria-label="Multiply"
                className="h-10 sm:h-11 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-base flex items-center justify-center transition active:scale-95 border border-indigo-100"
              >
                <Multiply className="w-4 h-4" />
              </button>

              {/* Row 3: 4, 5, 6, − */}
              <button
                type="button"
                onClick={() => handleDigit('4')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleDigit('5')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleDigit('6')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleOperator('-')}
                aria-label="Subtract"
                className="h-10 sm:h-11 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-base flex items-center justify-center transition active:scale-95 border border-indigo-100"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Row 4: 1, 2, 3, + */}
              <button
                type="button"
                onClick={() => handleDigit('1')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleDigit('2')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleDigit('3')}
                className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => handleOperator('+')}
                aria-label="Add"
                className="h-10 sm:h-11 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-base flex items-center justify-center transition active:scale-95 border border-indigo-100"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Row 5: 0, ., = */}
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="col-span-2 h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDecimal}
                aria-label="Decimal"
                className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base flex items-center justify-center transition active:scale-95 border border-slate-200/60"
              >
                .
              </button>
              <button
                type="button"
                onClick={handleEquals}
                aria-label="Equals"
                className="h-10 sm:h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base flex items-center justify-center transition active:scale-95 shadow-sm shadow-indigo-600/30"
              >
                <Equal className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer Keyboard Hint */}
          <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Supports keyboard: 0-9, +, −, ×, ÷, Enter</span>
            <span className="font-mono">Esc to close</span>
          </div>
        </div>
      )}
    </>
  );
};
