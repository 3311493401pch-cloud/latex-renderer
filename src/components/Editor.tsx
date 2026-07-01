import { useState, useRef } from 'react';
import { Problem, LayoutConfig } from '../types';
import { problemsToTex, downloadTexFile, parseBatchTex, readFileAsText } from '../utils';
import ProblemEntry from './ProblemEntry';
import LayoutOptions from './LayoutOptions';
import BatchImport from './BatchImport';
import ImageOcr from './ImageOcr';

interface EditorProps {
  problems: Problem[];
  onAdd: () => void;
  onUpdate: (id: string, field: 'latex' | 'source', value: string) => void;
  onDelete: (id: string) => void;
  onReorder: (newOrder: Problem[]) => void;
  onBatchImport: (items: { latex: string; source: string }[]) => void;
  onReplaceAll: (items: { latex: string; source: string }[]) => void;
  onAddFromOcr: (latex: string, source: string) => void;
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
  onReorder,
  onBatchImport,
  onReplaceAll,
  onAddFromOcr,
  layout,
  onLayoutChange,
}: EditorProps) {
  const [showBatch, setShowBatch] = useState(false);
  const [showLayout, setShowLayout] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
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
        onReplaceAll(items);
      }
    } catch {
      alert('读取文件失败，请检查文件格式');
    }
    e.target.value = '';
  };

  // 拖拽排序
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    // 保持拖拽时元素可见
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    if (id !== dragOverId) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const fromIndex = problems.findIndex((p) => p.id === dragId);
    const toIndex = problems.findIndex((p) => p.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...problems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next);
    setDragId(null);
    setDragOverId(null);
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
        <button
          className="btn btn-outline"
          onClick={() => setShowOcr(!showOcr)}
        >
          🖼 图片识别
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

      {showOcr && (
        <ImageOcr
          onImport={(latex, source) => onAddFromOcr(latex, source)}
          onClose={() => setShowOcr(false)}
        />
      )}

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
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={dragId === problem.id}
              isDragOver={dragOverId === problem.id && dragId !== problem.id}
            />
          ))
        )}
      </div>
    </aside>
  );
}

export default Editor;
