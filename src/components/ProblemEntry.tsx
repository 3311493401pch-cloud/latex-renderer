import { Problem } from '../types';

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
  return (
    <div className="problem-entry">
      <div className="problem-entry-header">
        <span className="problem-entry-number">题目 {index + 1}</span>
        <button
          className="btn btn-danger"
          onClick={() => onDelete(problem.id)}
          disabled={!canDelete}
          title={canDelete ? '删除' : '至少保留一道题目'}
        >
          ✕ 删除
        </button>
      </div>
      <div className="problem-entry-body">
        <textarea
          className="problem-latex-input"
          value={problem.latex}
          onChange={(e) => onUpdate(problem.id, 'latex', e.target.value)}
          placeholder="输入 LaTeX 公式，例如：\frac{a}{b}"
          rows={3}
        />
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
