import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Problem, LayoutConfig, SPACING_MAP, FONT_SIZE_MAP } from '../types';

interface RenderedProblem extends Problem {
  html: string;
  error: string | null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render mixed content: plain text + LaTeX math.
 * Supported math delimiters:
 *   \( ... \)   inline math
 *   \[ ... \]   display math
 *   $ ... $     inline math (single-line)
 *   $$ ... $$   display math
 *
 * Falls back to pure display-math rendering when no delimiters are present.
 */
function renderContent(raw: string): { html: string; error: string | null } {
  if (!raw.trim()) return { html: '', error: null };

  /* Quick check: does this look like mixed content? */
  const hasDelimiters = /\\[(\[]|\$\$?\s*\\/.test(raw);

  if (!hasDelimiters) {
    /* Pure math — render as display math (backward compatible) */
    try {
      const html = katex.renderToString(raw.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
        trust: true,
      });
      return { html, error: null };
    } catch (e: any) {
      return { html: '', error: e.message };
    }
  }

  /* ---- Mixed content pipeline ---- */

  // Tokenize: [text, math, text, math, ...]
  // We use a single regex that matches the earliest delimiter pair.
  const mathRegex = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$/g;

  const segments: string[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(raw)) !== null) {
    // Plain text before this math block
    if (match.index > lastIdx) {
      segments.push(escapeHtml(raw.slice(lastIdx, match.index)));
    }

    const isDisplay = !!match[1] || !!match[3]; // \[...\] or $$...$$
    const math = (match[1] || match[2] || match[3] || match[4] || '').trim();

    if (math) {
      try {
        const rendered = katex.renderToString(math, {
          displayMode: isDisplay,
          throwOnError: false,
          strict: false,
          trust: true,
        });
        segments.push(isDisplay ? `<div class="katex-block">${rendered}</div>` : rendered);
      } catch {
        segments.push(
          `<span class="katex-error-inline">⚠️ ${escapeHtml(math)}</span>`
        );
      }
    }

    lastIdx = match.index + match[0].length;
  }

  // Trailing text
  if (lastIdx < raw.length) {
    segments.push(escapeHtml(raw.slice(lastIdx)));
  }

  return { html: segments.join(''), error: null };
}

interface PreviewProps {
  problems: Problem[];
  layout: LayoutConfig;
}

function ProblemCard({
  problem,
  index,
  numbering,
}: {
  problem: RenderedProblem;
  index: number;
  numbering: boolean;
}) {
  return (
    <div className="preview-problem">
      <div className="preview-problem-content">
        {numbering && (
          <span className="preview-problem-number">({index + 1})</span>
        )}
        {problem.error ? (
          <div className="preview-error">
            <span className="preview-error-icon">⚠️</span>
            <span className="preview-error-text">{problem.error}</span>
            <pre className="preview-error-latex">{problem.latex}</pre>
          </div>
        ) : problem.html ? (
          <span
            className="preview-latex"
            dangerouslySetInnerHTML={{ __html: problem.html }}
          />
        ) : (
          <span className="preview-empty">（空题目）</span>
        )}
        {problem.source && (
          <span className="preview-source">—— 来源：{problem.source}</span>
        )}
      </div>
    </div>
  );
}

function Preview({ problems, layout }: PreviewProps) {
  const rendered: RenderedProblem[] = useMemo(
    () => problems.map((p) => ({ ...p, ...renderContent(p.latex) })),
    [problems]
  );

  const spacingGap = SPACING_MAP[layout.spacing];
  const fontSize = FONT_SIZE_MAP[layout.fontSize];
  const pageSize =
    layout.spacing === 'two-per-page'
      ? 2
      : layout.spacing === 'three-per-page'
        ? 3
        : 0;

  if (problems.length === 0) {
    return (
      <main className="preview">
        <div className="preview-paper" style={{ fontSize }}>
          <div className="preview-placeholder">
            <p>在左侧输入 LaTeX 公式开始预览</p>
          </div>
        </div>
      </main>
    );
  }

  /* Page-grouped mode (一页 N 题) */
  if (pageSize > 0) {
    const pages: RenderedProblem[][] = [];
    for (let i = 0; i < rendered.length; i += pageSize) {
      pages.push(rendered.slice(i, i + pageSize));
    }

    return (
      <main className="preview">
        <div className="preview-paper preview-paper-paged" style={{ fontSize }}>
          {pages.map((pageProblems, pageIndex) => (
            <div key={pageIndex} className="preview-page">
              {pageProblems.map((problem, idx) => (
                <div key={problem.id} className="preview-page-section">
                  <ProblemCard
                    problem={problem}
                    index={pageIndex * pageSize + idx}
                    numbering={layout.numbering}
                  />
                </div>
              ))}
              {/* Pad last page with empty sections so it still divides evenly */}
              {pageProblems.length < pageSize &&
                Array.from({ length: pageSize - pageProblems.length }, (_, i) => (
                  <div
                    key={`pad-${i}`}
                    className="preview-page-section preview-page-section-pad"
                  />
                ))}
            </div>
          ))}
        </div>
      </main>
    );
  }

  /* Compact mode — flat list, no pages */
  return (
    <main className="preview">
      <div className="preview-paper" style={{ fontSize }}>
        <div
          className={`preview-problems ${layout.columns === 2 ? 'preview-columns-2' : ''}`}
          style={{ gap: `${spacingGap}px` }}
        >
          {rendered.map((problem, index) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              index={index}
              numbering={layout.numbering}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default Preview;
