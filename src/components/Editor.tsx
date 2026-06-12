import { useState, useRef } from 'react';
import { Problem, LayoutConfig } from '../types';
import { problemsToTex, downloadTexFile, parseBatchTex, readFileAsText } from '../utils';
import ProblemEntry from './ProblemEntry';
import LayoutOptions from './LayoutOptions';
import BatchImport from './BatchImport';

interface EditorProps {
  problems: Problem[];
  onAdd: () => void;
  onUpdate: (id: string, field: 'latex' | 'source', value: string) => void;
  onDelete: (id: string) => void;
  onBatchImport: (items: { latex: string; source: string }[]) => void;
  onReplaceAll: (items: { latex: string; source: string }[]) => void;
  layout: LayoutConfig;
  onLayoutChange: <K extends keyof LayoutConfig>(
    key: K,
    value: LayoutConfig[K]
  ) => void;
}

function Editor({
  problems,
  onAdd,
  onUpdate,
  onDelete,
  onBatchImport,
  onReplaceAll,
  layout,
  onLayoutChange,
}: EditorProps) {
  const [showBatch, setShowBatch] = useState(false);
  const [showLayout, setShowLayout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const content = problemsToTex(problems);
    downloadTexFile(content);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const items = parseBatchTex(text);
      if (items.length > 0) {
        // Replace all existing problems with imported ones
        onReplaceAll(items);
      }
    } catch {
      alert('读取文件失败，请检查文件格式');
    }
    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <aside className="editor">
      <div className="editor-toolbar">
        <button className="btn btn-primary" onClick={onAdd}>
          ＋ 添加题目
        </button>
        <button
          className="btn btn-outline"
          onClick={() => setShowBatch(!showBatch)}
        >
          📋 批量导入
        </button>
        <button className="btn btn-outline" onClick={handleExport}>
          📤 导出 TEX
        </button>
        <button className="btn btn-outline" onClick={handleImportClick}>
          📥 导入 TEX
        </button>
        <button
          className="btn btn-outline"
          onClick={() => setShowLayout(!showLayout)}
        >
          ⚙ 排版设置
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".tex,.txt"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {showBatch && (
        <BatchImport
          onImport={(items) => {
            onBatchImport(items);
            setShowBatch(false);
          }}
          onClose={() => setShowBatch(false)}
        />
      )}

      {showLayout && (
        <LayoutOptions layout={layout} onChange={onLayoutChange} />
      )}

      <div className="editor-problems">
        {problems.length === 0 ? (
          <div className="editor-empty">
            <p>暂无题目</p>
            <p className="editor-empty-hint">
              点击「添加题目」或「批量导入」开始
            </p>
          </div>
        ) : (
          problems.map((problem, index) => (
            <ProblemEntry
              key={problem.id}
              problem={problem}
              index={index}
              onUpdate={onUpdate}
              onDelete={onDelete}
              canDelete={problems.length > 1}
            />
          ))
        )}
      </div>
    </aside>
  );
}

export default Editor;
