import React, { useState, useEffect } from 'react';
import {
  Calculator as CalcIcon,
  Delete,
  RotateCcw,
  Copy,
  Check,
  Percent,
  Plus,
  Minus,
  X as MultiplyIcon,
  Divide,
  Equal,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCurrency } from '../lib/accounting';
import { useLanguage } from '../context/LanguageContext';

interface ShopCalculatorProps {
  className?: string;
  onUseAmount?: (amount: number) => void;
  compact?: boolean;
}

export const ShopCalculator: React.FC<ShopCalculatorProps> = ({
  className = '',
  onUseAmount,
  compact = false,
}) => {
  const { language } = useLanguage();
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle number input
  const handleDigit = (digit: string) => {
    setDisplay(prev => {
      if (prev === '0' || prev === 'Error') return digit;
      if (prev.length >= 14) return prev;
      return prev + digit;
    });
  };

  // Handle decimal dot
  const handleDot = () => {
    setDisplay(prev => {
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  };

  // Backspace (Delete ⌫)
  const handleDelete = () => {
    setDisplay(prev => {
      if (prev.length <= 1 || prev === 'Error') return '0';
      return prev.slice(0, -1);
    });
  };

  // Clear (AC)
  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  // Handle operators (+, -, *, /)
  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    const currentNum = parseFloat(display) || 0;
    setExpression(`${currentNum} ${op} `);
    setDisplay('0');
  };

  // Percentage (%)
  const handlePercentage = () => {
    if (display === 'Error') return;
    const currentNum = parseFloat(display) || 0;
    if (expression) {
      // If we have an expression like "1000 + ", percentage of 1000:
      const parts = expression.trim().split(' ');
      if (parts.length >= 2) {
        const base = parseFloat(parts[0]) || 0;
        const percentVal = (base * currentNum) / 100;
        setDisplay(String(percentVal));
        return;
      }
    }
    const val = currentNum / 100;
    setDisplay(String(val));
  };

  // Evaluate Expression (=)
  const handleEqual = () => {
    if (!expression || display === 'Error') return;
    try {
      const parts = expression.trim().split(' ');
      if (parts.length < 2) return;

      const num1 = parseFloat(parts[0]);
      const operator = parts[1];
      const num2 = parseFloat(display);

      if (isNaN(num1) || isNaN(num2)) return;

      let result = 0;
      switch (operator) {
        case '+':
          result = num1 + num2;
          break;
        case '-':
          result = num1 - num2;
          break;
        case '×':
        case '*':
          result = num1 * num2;
          break;
        case '÷':
        case '/':
          if (num2 === 0) {
            setDisplay('Error');
            setExpression('');
            return;
          }
          result = num1 / num2;
          break;
        default:
          return;
      }

      // Round floating point inaccuracies (e.g. 0.1 + 0.2 = 0.30000000000000004)
      const cleanResult = Math.round(result * 10000) / 10000;
      const historyItem = `${num1} ${operator} ${num2} = ${cleanResult}`;
      setHistory(prev => [historyItem, ...prev.slice(0, 4)]);
      setExpression(`${num1} ${operator} ${num2} =`);
      setDisplay(String(cleanResult));
    } catch {
      setDisplay('Error');
      setExpression('');
    }
  };

  // Copy result to clipboard
  const handleCopy = () => {
    const num = parseFloat(display);
    if (!isNaN(num)) {
      navigator.clipboard.writeText(String(num));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Listen to keyboard events when focused or hovering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing when typing into form text inputs or textareas
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleDot();
      } else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (e.key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === '%' ) {
        e.preventDefault();
        handlePercentage();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEqual();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, expression]);

  return (
    <div
      className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Header Bar with title, quick controls, collapse */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
            <CalcIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <span>{language === 'en' ? 'Shop Calculator' : 'দোকানের ক্যালকুলেটর'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">₹</span>
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-0.5">
              {language === 'en' ? 'Money & Balance Calc' : 'ক্যাশ ও বাকি হিসাব'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title={language === 'en' ? 'Copy amount' : 'টাকার পরিমাণ কপি করুন'}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-200" />}
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer sm:hidden"
            title={isCollapsed ? 'Expand Calculator' : 'Collapse Calculator'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-200" /> : <ChevronUp className="w-4 h-4 text-slate-200" />}
          </button>
        </div>
      </div>

      {/* Main Calculator Body */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-3">
          {/* LCD Display */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-right">
            <div className="text-xs font-mono font-semibold text-slate-300 min-h-[18px] truncate">
              {expression || (history[0] ? `Last: ${history[0]}` : '')}
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-tight select-all truncate mt-0.5 drop-shadow-sm">
              {display}
            </div>
          </div>

          {/* Quick Helper Badges */}
          <div className="flex items-center justify-between text-xs px-0.5 text-slate-200 font-medium">
            <span className="font-mono font-bold text-slate-200">
              {display !== '0' && display !== 'Error' && !isNaN(parseFloat(display))
                ? `₹ ${parseFloat(display).toLocaleString('en-IN')}`
                : language === 'en' ? 'Keyboard ready' : 'কিবোর্ড সমর্থিত'}
            </span>
            {onUseAmount && display !== '0' && display !== 'Error' && (
              <button
                type="button"
                onClick={() => onUseAmount(parseFloat(display))}
                className="text-amber-300 hover:text-white font-extrabold text-xs hover:underline cursor-pointer flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'en' ? 'Use in Entry' : 'এন্ট্রিতে বসান'}</span>
              </button>
            )}
          </div>

          {/* Calculator Grid */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {/* Row 1: AC, ⌫, %, ÷ */}
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/35 text-rose-200 border border-rose-500/40 font-black text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              AC
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Delete last digit"
            >
              <Delete className="w-4 h-4 text-amber-300" />
            </button>
            <button
              type="button"
              onClick={handlePercentage}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center justify-center font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Percentage"
            >
              <Percent className="w-3.5 h-3.5 text-blue-300" />
            </button>
            <button
              type="button"
              onClick={() => handleOperator('÷')}
              className="py-2.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 flex items-center justify-center font-black text-base transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Divide"
            >
              ÷
            </button>

            {/* Row 2: 7, 8, 9, × */}
            <button
              type="button"
              onClick={() => handleDigit('7')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleDigit('8')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleDigit('9')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleOperator('×')}
              className="py-2.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 flex items-center justify-center font-black text-base transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Multiply"
            >
              ×
            </button>

            {/* Row 3: 4, 5, 6, - */}
            <button
              type="button"
              onClick={() => handleDigit('4')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleDigit('5')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleDigit('6')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleOperator('-')}
              className="py-2.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 flex items-center justify-center font-black text-base transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Subtract"
            >
              -
            </button>

            {/* Row 4: 1, 2, 3, + */}
            <button
              type="button"
              onClick={() => handleDigit('1')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleDigit('2')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleDigit('3')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => handleOperator('+')}
              className="py-2.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 flex items-center justify-center font-black text-base transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Add"
            >
              +
            </button>

            {/* Row 5: 0, 00, ., = */}
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleDigit('00')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-sm font-extrabold border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              00
            </button>
            <button
              type="button"
              onClick={handleDot}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-black border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleEqual}
              className="py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-lg shadow-md flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              title="Equals"
            >
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
