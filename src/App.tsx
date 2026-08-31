import { useState, useRef, useCallback, useEffect } from 'react';
import { Interpreter, ExecutionResult } from './engine';
import { examples, Example } from './examples';

// Syntax highlighter for HingScript
function highlightHingScript(code: string): string {
  const keywords = [
    'chhapa', 'agar', 'wara', 'warna', 'jabtak', 'liye', 'mein', 'kaam', 'wapas',
    'sach', 'jhooth', 'khali', 'aur', 'ya', 'nahi', 'ye', 'roko', 'aage',
    'naya', 'bhi', 'rakho', 'badalo', 'banayo', 'new', 'return',
  ];
  const builtins = [
    'sankhya', 'vakya', 'lambai', 'purana', 'dasamlav', 'sqrt', 'abs', 'min', 'max',
    'random', 'range', 'soochi', 'manakosh', 'jod', 'sort', 'ulta', 'map', 'filter',
    'reduce', 'ni8', 'upar', 'nichla', 'shamil', 'hissa', 'juda',
  ];

  // Escape HTML first
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  result = result.replace(/(#.*$)/gm, '<span class="tok-comment">$1</span>');

  // Strings (double and single quoted)
  result = result.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="tok-string">$1</span>');
  result = result.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="tok-string">$1</span>');

  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-number">$1</span>');

  // Built-in functions (before keywords to avoid conflict)
  const builtinRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
  result = result.replace(builtinRegex, '<span class="tok-builtin">$1</span>');

  // Keywords
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  result = result.replace(keywordRegex, '<span class="tok-keyword">$1</span>');

  // Booleans & null
  result = result.replace(/\b(sach|jhooth|khali)\b/g, '<span class="tok-boolean">$1</span>');

  // Operators
  result = result.replace(/(\+\+|--|\*\*|!=|==|&lt;=|&gt;=|&amp;&amp;|\|\||=&gt;|[-+*/%=!&lt;&gt;])/g, '<span class="tok-operator">$1</span>');

  // Parens and brackets
  result = result.replace(/([(){}[\]])/g, '<span class="tok-paren">$1</span>');

  return result;
}

// Line numbers component
function LineNumbers({ count }: { count: number }) {
  return (
    <div className="line-numbers">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

export default function App() {
  const [code, setCode] = useState(examples[0].code);
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeExample, setActiveExample] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [executionCount, setExecutionCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const lineCount = code.split('\n').length;

  // Sync scroll between textarea and display
  const handleScroll = useCallback(() => {
    if (textareaRef.current && displayRef.current) {
      displayRef.current.scrollTop = textareaRef.current.scrollTop;
      displayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Handle tab key in textarea
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
  }, [code]);

  // Run the HingScript code
  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutput(null);
    setExecutionCount(prev => prev + 1);

    try {
      const interpreter = new Interpreter();
      const result = await interpreter.execute(code);
      setOutput(result);
    } catch (err: any) {
      setOutput({
        output: [],
        error: { message: err.message, line: 0, column: 0, type: 'RuntimeError' },
        executionTime: 0,
      });
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Load example
  const loadExample = (example: Example, index: number) => {
    setCode(example.code);
    setActiveExample(index);
    setOutput(null);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0e1a] text-[#e2e8f0] overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[#1e293b] bg-[#0d1117] shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-white font-bold text-sm font-mono">
              H
            </div>
            <div>
              <h1 className="text-base font-bold text-amber-400 leading-none">HingScript</h1>
              <p className="text-[10px] text-[#64748b] leading-none mt-0.5">Hinglish Programming Language</p>
            </div>
          </div>

          {/* Toggle sidebar */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="ml-2 p-1.5 rounded-md hover:bg-[#1e293b] text-[#64748b] hover:text-[#94a3b8] transition-colors"
            title="Examples dikhao/chhupao"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="8" y="2" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="8" y="9" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Keyboard shortcut hint */}
          <span className="text-[11px] text-[#475569] hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[#64748b] text-[10px] font-mono">Ctrl</kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[#64748b] text-[10px] font-mono">Enter</kbd>
            {' se chalao'}
          </span>

          {/* Run button */}
          <button
            onClick={runCode}
            disabled={isRunning}
            className="btn-run flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all
              bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400
              text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Chal raha hai...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Chalao!
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — Examples */}
        {showSidebar && (
          <aside className="w-64 shrink-0 border-r border-[#1e293b] bg-[#0d1117] flex flex-col overflow-hidden">
            <div className="px-3 py-3 border-b border-[#1e293b]">
              <h2 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">📝 Examples</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => loadExample(example, i)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all text-sm
                    ${activeExample === i
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      : 'hover:bg-[#1e293b] border border-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{example.icon}</span>
                    <div>
                      <div className="font-medium text-xs">{example.nameHi}</div>
                      <div className="text-[10px] text-[#64748b] mt-0.5">{example.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {/* Language reference */}
            <div className="px-3 py-3 border-t border-[#1e293b] bg-[#0a0e1a]">
              <h3 className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">🔑 Keywords</h3>
              <div className="grid grid-cols-2 gap-0.5 text-[10px] font-mono">
                <span className="text-amber-400">chhapa</span><span className="text-[#64748b]">= print</span>
                <span className="text-amber-400">agar</span><span className="text-[#64748b]">= if</span>
                <span className="text-amber-400">wara</span><span className="text-[#64748b]">= else</span>
                <span className="text-amber-400">jabtak</span><span className="text-[#64748b]">= while</span>
                <span className="text-amber-400">liye</span><span className="text-[#64748b]">= for</span>
                <span className="text-amber-400">mein</span><span className="text-[#64748b]">= in</span>
                <span className="text-amber-400">kaam</span><span className="text-[#64748b]">= def</span>
                <span className="text-amber-400">wapas</span><span className="text-[#64748b]">= return</span>
                <span className="text-amber-400">ye</span><span className="text-[#64748b]">= let</span>
                <span className="text-amber-400">aur</span><span className="text-[#64748b]">= and</span>
                <span className="text-amber-400">ya</span><span className="text-[#64748b]">= or</span>
                <span className="text-amber-400">nahi</span><span className="text-[#64748b]">= not</span>
                <span className="text-amber-400">sach</span><span className="text-[#64748b]">= true</span>
                <span className="text-amber-400">jhooth</span><span className="text-[#64748b]">= false</span>
                <span className="text-amber-400">khali</span><span className="text-[#64748b]">= null</span>
                <span className="text-amber-400">roko</span><span className="text-[#64748b]">= break</span>
                <span className="text-amber-400">aage</span><span className="text-[#64748b]">= continue</span>
                <span className="text-amber-400">banayo</span><span className="text-[#64748b]">= class</span>
              </div>
            </div>
          </aside>
        )}

        {/* Code editor + Output */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Editor area */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Code editor */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-[#1e293b]">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e293b] bg-[#0d1117] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-[11px] text-[#475569] font-mono">main.hing</span>
                <span className="text-[10px] text-[#475569]">{lineCount} lines</span>
              </div>
              <div className="flex-1 relative overflow-hidden bg-[#0a0e1a]">
                <LineNumbers count={lineCount} />
                <div
                  ref={displayRef}
                  className="code-display absolute inset-0 pl-[52px] overflow-auto pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: highlightHingScript(code) }}
                />
                <textarea
                  ref={textareaRef}
                  className="code-editor absolute inset-0 pl-[52px] overflow-auto"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onScroll={handleScroll}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                />
              </div>
            </div>

            {/* Output panel */}
            <div className="w-[40%] min-w-[280px] flex flex-col bg-[#0d1117] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e293b] shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-400 animate-pulse-glow' : output?.error ? 'bg-red-500' : output ? 'bg-emerald-500' : 'bg-[#475569]'}`}></div>
                  <span className="text-[11px] text-[#94a3b8] font-medium">Output</span>
                </div>
                {output && (
                  <span className="text-[10px] text-[#475569] font-mono">
                    {output.executionTime.toFixed(1)}ms
                    {output.output.length > 0 && ` • ${output.output.length} lines`}
                  </span>
                )}
              </div>
              <div ref={outputRef} className="flex-1 overflow-y-auto p-3 font-mono text-sm">
                {!output && !isRunning && (
                  <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                    <div className="text-4xl mb-3">🚀</div>
                    <p className="text-[#64748b] text-xs">Code likho aur</p>
                    <p className="text-amber-400 font-semibold text-sm mt-1">"Chalao!"</p>
                    <p className="text-[#475569] text-[10px] mt-2">dabao ya <kbd className="px-1 py-0.5 rounded bg-[#1e293b] text-[10px] font-mono">Ctrl+Enter</kbd> dabaao</p>
                  </div>
                )}
                {isRunning && (
                  <div className="flex items-center gap-2 text-amber-400 text-xs animate-pulse-glow">
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Chal raha hai...
                  </div>
                )}
                {output && (
                  <div className="animate-fade-in">
                    {output.output.map((line, i) => (
                      <div key={i} className="output-line text-[#e2e8f0]">{line}</div>
                    ))}
                    {output.error && (
                      <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                        <div className="output-error text-xs font-semibold flex items-center gap-1.5">
                          <span>❌</span>
                          <span>{output.error.type}</span>
                          {output.error.line > 0 && (
                            <span className="text-[#64748b] font-normal">(line {output.error.line})</span>
                          )}
                        </div>
                        <div className="output-error text-xs mt-1">{output.error.message}</div>
                      </div>
                    )}
                    {!output.error && output.output.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#1e293b] text-[10px] text-[#475569] flex items-center gap-1.5">
                        <span className="text-emerald-500">✅</span>
                        Safal! ({output.executionTime.toFixed(1)}ms mein chala)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="flex items-center justify-between px-3 py-1 border-t border-[#1e293b] bg-[#0d1117] text-[10px] text-[#475569] shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                HingScript v1.0
              </span>
              <span>UTF-8</span>
            </div>
            <div className="flex items-center gap-3">
              {executionCount > 0 && <span>{executionCount} executions</span>}
              <span>Python jaisa power, Hinglish mein! 🇮🇳</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
