import { useRef, useState } from 'react';
import { Problem } from '../types';
import { SYMBOL_GROUPS } from '../utils';

interface ProblemEntryProps {
  problem: Problem;
  index: number;
  onUpdate: (id: string, field: 'latex' | 'source', value: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

function ProblemEntry({
  problem,
  index,
  onUpdate,
  onDelete,
  canDelete,
}: ProblemEntryProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSymbols, setShowSymbols] = useState(false);

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      onUpdate(problem.id, 'latex', problem.latex + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = problem.latex.slice(0, start);
    const after = problem.latex.slice(end);
    const next = before + text + after;
    onUpdate(problem.id, 'latex', next);
    // 恢复光标到插入内容之后
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="problem-entry">
      <div className="problem-entry-header">
        <span className="problem-entry-number">题目 {index + 1}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowSymbols((v) => !v)}
            title="常用 LaTeX 符号"
            style={{ padding: '3px 9px', fontSize: '0.76rem' }}
          >
            ∑ 符号
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onDelete(problem.id)}
            disabled={!canDelete}
            title={canDelete ? '删除' : '至少保留一道题目'}
          >
            ✕ 删除
          </button>
        </div>
      </div>
      <div className="problem-entry-body">
        <textarea
          ref={textareaRef}
          className="problem-latex-input"
          value={problem.latex}
          onChange={(e) => onUpdate(problem.id, 'latex', e.target.value)}
          placeholder="输入 LaTeX 公式，例如：\frac{a}{b} 或直接粘贴 AI 识别结果"
          rows={3}
        />

        {showSymbols && (
          <div className="symbol-toolbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            {SYMBOL_GROUPS.map((group) => (
              <div key={group.label} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                <span className="symbol-group-label">{group.label}</span>
                {group.symbols.map((sym) => (
                  <button
                    key={sym.label}
                    type="button"
                    className="symbol-btn"
                    title={sym.insert}
                    onClick={() => insertAtCursor(sym.insert)}
                  >
                    {sym.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <input
          className="problem-source-input"
          value={problem.source}
          onChange={(e) => onUpdate(problem.id, 'source', e.target.value)}
          placeholder="来源（选填），例如：张宇30讲"
        />
      </div>
    </div>
  );
}

export default ProblemEntry;
