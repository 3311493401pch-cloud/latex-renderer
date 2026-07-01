import { useState, useCallback, useEffect } from 'react';
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

const STORAGE_KEY_PROBLEMS = 'latex-problems-cache';
const STORAGE_KEY_LAYOUT = 'latex-layout-cache';
const STORAGE_KEY_THEME = 'latex-theme';

function loadProblems(): Problem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROBLEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: { latex?: string; source?: string }) => ({
          id: generateId(),
          latex: p.latex ?? '',
          source: p.source ?? '',
        }));
      }
    }
  } catch {
    /* ignore */
  }
  return DEMO_PROBLEMS;
}

function loadLayout(): LayoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAYOUT);
    if (raw) {
      return { ...DEFAULT_LAYOUT, ...JSON.parse(raw) };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LAYOUT;
}

function loadTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function App() {
  const [problems, setProblems] = useState<Problem[]>(loadProblems);
  const [layout, setLayout] = useState<LayoutConfig>(loadLayout);
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme);
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem('latex-tutorial-seen')
  );

  // 同步 data-theme 到 HTML 标签
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // 自动保存题目
  useEffect(() => {
    try {
      const slim = problems.map((p) => ({ latex: p.latex, source: p.source }));
      localStorage.setItem(STORAGE_KEY_PROBLEMS, JSON.stringify(slim));
    } catch {
      /* ignore */
    }
  }, [problems]);

  // 自动保存排版设置
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(layout));
    } catch {
      /* ignore */
    }
  }, [layout]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const addProblem = useCallback(() => {
    setProblems((prev) => [...prev, { id: generateId(), latex: '', source: '' }]);
  }, []);

  const addProblemFromOcr = useCallback(
    (latex: string, source: string) => {
      setProblems((prev) => [
        ...prev,
        { id: generateId(), latex: latex.trim(), source: source.trim() },
      ]);
    },
    []
  );

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

  const reorderProblems = useCallback((newOrder: Problem[]) => {
    setProblems(newOrder);
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
        <span className="app-subtitle">在线编辑 · 实时预览 · 智能清洗</span>
        <div className="app-header-spacer" />
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'light' ? '切换暗色模式' : '切换亮色模式'}
        >
          {theme === 'light' ? '🌙' : '☀'}
        </button>
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
          onReorder={reorderProblems}
          onBatchImport={batchImport}
          onReplaceAll={replaceAll}
          onAddFromOcr={addProblemFromOcr}
          layout={layout}
          onLayoutChange={updateLayout}
        />
        <Preview problems={problems} layout={layout} />
      </div>
    </div>
  );
}

export default App;
