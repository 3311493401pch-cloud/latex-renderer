import { useState, useMemo } from 'react';
import { parseBatchTex, sanitizeLatexBlock } from '../utils';

interface BatchImportProps {
  onImport: (items: { latex: string; source: string }[]) => void;
  onClose: () => void;
}

function BatchImport({ onImport, onClose }: BatchImportProps) {
  const [text, setText] = useState('');

  const parsed = useMemo(() => parseBatchTex(text), [text]);

  // 清洗前后的差异（用于提示用户清洗掉了什么）
  const cleanedPreview = useMemo(() => sanitizeLatexBlock(text), [text]);
  const hasNoise = text.trim() && cleanedPreview !== text.trim() && cleanedPreview.length !== text.trim().length;

  const handleSmartClean = () => {
    const cleaned = sanitizeLatexBlock(text);
    if (cleaned && cleaned !== text) {
      setText(cleaned);
    }
  };

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
        <br />
        💡 从豆包/AI 复制的内容可直接粘贴，点{' '}
        <code>✨ 智能清洗</code> 自动去除代码块标记和解释文字。
      </p>
      <textarea
        className="batch-import-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          '支持直接粘贴 AI 识别结果，例如：\n\n```latex\n\\frac{1}{2} + \\frac{1}{3}\n```\n\n以下是识别到的公式：\n\\int_0^\\infty e^{-x} dx = 1\n\n% source: 张宇30讲\n\\lim_{x\\to 0} \\frac{\\sin x}{x} = 1'
        }
      />
      {parsed.length > 0 && (
        <p className="batch-import-count">
          识别到 <strong>{parsed.length}</strong> 道题目
          {hasNoise && (
            <span style={{ marginLeft: 8, color: 'var(--color-warning)' }}>
              · 检测到可清洗的冗余内容
            </span>
          )}
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
        <button
          className="btn btn-outline"
          onClick={handleSmartClean}
          disabled={!text.trim()}
          title="去除代码块标记、解释文字、列表符号等冗余内容"
        >
          ✨ 智能清洗
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  );
}

export default BatchImport;
