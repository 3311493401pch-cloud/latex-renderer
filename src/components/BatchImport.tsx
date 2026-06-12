import { useState } from 'react';
import { parseBatchTex } from '../utils';

interface BatchImportProps {
  onImport: (items: { latex: string; source: string }[]) => void;
  onClose: () => void;
}

function BatchImport({ onImport, onClose }: BatchImportProps) {
  const [text, setText] = useState('');

  const parsed = parseBatchTex(text);

  const handleImport = () => {
    if (parsed.length > 0) {
      onImport(parsed);
    }
  };

  return (
    <div className="batch-import">
      <p className="batch-import-hint">
        每道题目之间用<strong>空行</strong>分隔。可在第一行用{' '}
        <code>% source: 来源名称</code> 标注来源。
      </p>
      <textarea
        className="batch-import-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          '\\frac{1}{2} + \\frac{1}{3}\n\n% source: 张宇30讲\n\\int_0^\\infty e^{-x} dx = 1\n\n\\lim_{x\\to 0} \\frac{\\sin x}{x} = 1'
        }
      />
      {parsed.length > 0 && (
        <p className="batch-import-count">
          识别到 <strong>{parsed.length}</strong> 道题目
        </p>
      )}
      <div className="batch-import-actions">
        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={parsed.length === 0}
        >
          导入{parsed.length > 0 ? ` (${parsed.length})` : ''}
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  );
}

export default BatchImport;
