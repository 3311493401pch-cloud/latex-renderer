import { useState, useCallback } from 'react';
import { Problem, LayoutConfig, DEFAULT_LAYOUT } from './types';
import Editor from './components/Editor';
import Preview from './components/Preview';
import TutorialModal from './components/TutorialModal';

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `p${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

const DEMO_PROBLEMS: Problem[] = [
  {
    id: generateId(),
    latex: '\\frac{a}{b} + \\frac{c}{d} = \\frac{ad+bc}{bd}',
    source: '',
  },
  {
    id: generateId(),
    latex: '\\int_{0}^{\\infty} e^{-x^2} \\, dx = \\frac{\\sqrt{\\pi}}{2}',
    source: '张宇30讲',
  },
  {
    id: generateId(),
    latex:
      '\\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix} \\begin{pmatrix} x_1 \\\\ x_2 \\end{pmatrix} = \\begin{pmatrix} b_1 \\\\ b_2 \\end{pmatrix}',
    source: '李永乐线代',
  },
];

function App() {
  const [problems, setProblems] = useState<Problem[]>(DEMO_PROBLEMS);
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem('latex-tutorial-seen')
  );

  const addProblem = useCallback(() => {
    setProblems((prev) => [...prev, { id: generateId(), latex: '', source: '' }]);
  }, []);

  const updateProblem = useCallback(
    (id: string, field: 'latex' | 'source', value: string) => {
      setProblems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  const deleteProblem = useCallback((id: string) => {
    setProblems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const batchImport = useCallback(
    (items: { latex: string; source: string }[]) => {
      const newProblems: Problem[] = items.map((item) => ({
        id: generateId(),
        latex: item.latex,
        source: item.source,
      }));
      setProblems((prev) => [...prev, ...newProblems]);
    },
    []
  );

  const replaceAll = useCallback(
    (items: { latex: string; source: string }[]) => {
      const newProblems: Problem[] = items.map((item) => ({
        id: generateId(),
        latex: item.latex,
        source: item.source,
      }));
      setProblems(newProblems);
    },
    []
  );

  const updateLayout = useCallback(
    <K extends keyof LayoutConfig>(key: K, value: LayoutConfig[K]) => {
      setLayout((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div className="app">
      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {/* Floating help button */}
      {!showTutorial && (
        <button
          className="help-fab"
          onClick={() => setShowTutorial(true)}
          title="使用教程"
        >
          ?
        </button>
      )}

      <header className="app-header">
        <h1 className="app-title">LaTeX 题目渲染器</h1>
        <span className="app-subtitle">在线编辑 · 实时预览</span>
        <div className="app-header-spacer" />
        <button className="btn-export" onClick={() => window.print()}>
          🖨 导出 PDF
        </button>
      </header>
      <div className="app-body">
        <Editor
          problems={problems}
          onAdd={addProblem}
          onUpdate={updateProblem}
          onDelete={deleteProblem}
          onBatchImport={batchImport}
          onReplaceAll={replaceAll}
          layout={layout}
          onLayoutChange={updateLayout}
        />
        <Preview problems={problems} layout={layout} />
      </div>
    </div>
  );
}

export default App;
