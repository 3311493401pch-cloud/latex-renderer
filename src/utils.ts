import { Problem } from './types';

/* ============================================
   LaTeX 智能清洗
   处理从 AI（豆包/ChatGPT 等）复制回来的内容：
   - 去除 ```latex ... ``` / ``` ... ``` 代码块围栏
   - 去除"以下是…""识别结果："等引导性文字
   - 去除行首 markdown 列表符号 "- " "1. "
   - 规整空白
   ============================================ */

/** 引导性语句特征（出现在行首，整行删除） */
const NOISE_LINE_PATTERNS = [
  /^\s*以下(是|为).*/,
  /^\s*识别(结果|到|出)?.*[：:)]\s*$/,
  /^\s*识别(结果|到|出).*$/,
  /^\s*对应(的)?\s*LaTeX.*/,
  /^\s*LaTeX\s*(代码|公式|表达式|内容)?\s*[：:)]\s*$/,
  /^\s*(代码|公式|表达式|内容|结果)\s*[：:)]\s*$/,
  /^\s*(注|说明|提示|备注)\s*[：:)]\s*$/,
  /^\s*(请|你可以|你可以直接).*/,
  /^\s*将.*粘贴.*/,
  /^\s*复制.*即可.*/,
  /^\s*—+\s*$/,
  /^\s*={3,}\s*$/,
  /^\s*\*{3,}\s*$/,
  /^\s*#{1,6}\s+/, // markdown 标题
  /^\s*>\s+/, // markdown 引用
];

/** 去除单行行首的 markdown 列表符号 */
function stripListMarker(line: string): string {
  return line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '');
}

/**
 * 清洗一段"疑似 LaTeX"的文本：
 *  - 剥离 ```...``` 代码围栏，保留内部
 *  - 删除引导性噪声行
 *  - 去除列表标记
 *  - 折叠多余空行
 */
export function sanitizeLatexBlock(raw: string): string {
  if (!raw) return '';

  let text = raw.replace(/\r\n/g, '\n');

  // 1) 剥离代码块围栏：```latex ... ``` 或 ``` ... ```
  //    可能有多块，逐块处理
  const fenceRegex = /```[a-zA-Z]*\n?([\s\S]*?)```/g;
  const fencedMatches = text.match(fenceRegex);
  if (fencedMatches && fencedMatches.length > 0) {
    // 用所有围栏内部内容替换整段
    const innerParts: string[] = [];
    let m: RegExpExecArray | null;
    fenceRegex.lastIndex = 0;
    while ((m = fenceRegex.exec(text)) !== null) {
      innerParts.push(m[1]);
    }
    text = innerParts.join('\n\n');
  } else {
    // 没有完整围栏，但可能有孤立的 ``` 行，直接删掉
    text = text.replace(/^```[a-zA-Z]*\s*$/gm, '').replace(/^```\s*$/gm, '');
  }

  // 2) 逐行处理：删除噪声行 + 去列表标记
  const lines = text.split('\n');
  const kept: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      kept.push('');
      continue;
    }
    // 命中噪声行 → 跳过
    if (NOISE_LINE_PATTERNS.some((re) => re.test(trimmed))) continue;
    kept.push(stripListMarker(line));
  }
  text = kept.join('\n');

  // 3) 折叠 3+ 连续空行为 2 个（保留段落分隔）
  text = text.replace(/\n{3,}/g, '\n\n');

  // 4) 去首尾空白
  return text.trim();
}

/**
 * 智能解析"从 AI 复制回来"的整段文本为多道题目。
 * 在原有 parseBatchTex 基础上增加：
 *  - 先整体清洗代码围栏与噪声
 *  - 按空行分块
 *  - 每块再清洗一次（防止噪声行夹在公式中间）
 *  - 识别 "% source: xxx" 来源标注
 *  - 智能识别 "来源：xxx" / "—— xxx" 等中文来源写法
 */
export function parseBatchTex(text: string): { latex: string; source: string }[] {
  if (!text || !text.trim()) return [];

  // 先整体清洗
  const cleaned = sanitizeLatexBlock(text);
  if (!cleaned) return [];

  const blocks = cleaned.split(/\n{2,}/).filter((b) => b.trim());
  const results: { latex: string; source: string }[] = [];

  for (const blockRaw of blocks) {
    let block = blockRaw.trim();
    if (!block) continue;

    const lines = block.split('\n');
    let source = '';
    const contentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // % source: xxx
      const texSourceMatch = trimmed.match(/^%\s*source\s*[:：]\s*(.+)/i);
      if (texSourceMatch && contentLines.length === 0) {
        source = texSourceMatch[1].trim();
        continue;
      }
      // 来源：xxx / 来源:xxx / —— xxx（行首）
      const cnSourceMatch = trimmed.match(/^(?:来源|出处)\s*[:：]\s*(.+)/);
      if (cnSourceMatch && contentLines.length === 0) {
        source = cnSourceMatch[1].trim();
        continue;
      }
      // 行首 "—— xxx" 且该行很短 → 当作来源
      const dashMatch = trimmed.match(/^——\s*(.+)/);
      if (dashMatch && contentLines.length > 0 && trimmed.length < 30) {
        source = dashMatch[1].trim();
        continue;
      }
      contentLines.push(line);
    }

    const latex = contentLines.join('\n').trim();
    if (latex) {
      // 二次清洗：去除该块内残留的噪声行
      const finalLatex = sanitizeLatexBlock(latex);
      if (finalLatex) {
        results.push({ latex: finalLatex, source });
      }
    }
  }

  return results;
}

/* ============================================
   OCR 后处理：修复 LLM 识别中常见的 LaTeX 错误
   ============================================ */

const OCR_REPLACEMENTS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\\nneq\b/g, replacement: '\\neq' }, // \nneq → \neq
  { pattern: /\\geqsant\b/g, replacement: '\\geqslant' },
  { pattern: /\\leqsant\b/g, replacement: '\\leqslant' },
  { pattern: /\\\s*{/g, replacement: '\\{' },
  { pattern: /\\begin\s*\{\s*cases\s*\}/g, replacement: '\\begin{cases}' },
  { pattern: /\\end\s*\{\s*cases\s*\}/g, replacement: '\\end{cases}' },
  { pattern: /\\begin\s*\{\s*aligned\s*\}/g, replacement: '\\begin{aligned}' },
  { pattern: /\\end\s*\{\s*aligned\s*\}/g, replacement: '\\end{aligned}' },
  { pattern: /\\begin\s*\{\s*pmatrix\s*\}/g, replacement: '\\begin{pmatrix}' },
  { pattern: /\\end\s*\{\s*pmatrix\s*\}/g, replacement: '\\end{pmatrix}' },
  { pattern: /\\in\s*fty\b/g, replacement: '\\infty' },
  { pattern: /\\lim\s+_/g, replacement: '\\lim_{' },
  { pattern: /\\sum\s+_/g, replacement: '\\sum_{' },
  { pattern: /\\int\s+_/g, replacement: '\\int_{' },
  { pattern: /\\to\s+0/g, replacement: '\\to 0' },
  { pattern: /\\cdot\s+/g, replacement: '\\cdot ' },
  { pattern: /\$\s*\$\s+/g, replacement: '$$ ' },
  { pattern: /\s+\$\s*\$/g, replacement: ' $$' },
  { pattern: /\\\\\s*\\end\b/g, replacement: '\\end' }, // 修复 cases 前多余换行
];

/**
 * 修复 OCR 识别后的常见 LaTeX 拼写错误。
 */
export function fixOcrLatexErrors(raw: string): string {
  if (!raw) return '';

  let text = raw.replace(/\r\n/g, '\n');

  for (const { pattern, replacement } of OCR_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  // 修复独立公式行被 $ 包裹的问题
  text = text.replace(/\$\s*(\\\[[\s\S]*?\\\])\s*\$/g, '$1');

  // 修复多个连续空行
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Serialise problems into a .tex file content string.
 */
export function problemsToTex(problems: Problem[]): string {
  return problems
    .map((p) => {
      let block = '';
      if (p.source) block += `% source: ${p.source}\n`;
      block += p.latex;
      return block;
    })
    .join('\n\n');
}

/**
 * Trigger a browser download of the given content as a .tex file.
 */
export function downloadTexFile(content: string, filename?: string): void {
  const name = filename ?? `latex-problems-${new Date().toISOString().slice(0, 10)}.tex`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read a File object as text.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}

/**
 * 常用 LaTeX 符号快捷插入集（供符号工具栏使用）
 */
export interface SymbolGroup {
  label: string;
  symbols: { insert: string; label: string }[];
}

export const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    label: '运算',
    symbols: [
      { insert: '\\frac{a}{b}', label: '分数' },
      { insert: '\\sqrt{x}', label: '根号' },
      { insert: '\\sqrt[n]{x}', label: 'n次根' },
      { insert: 'a^{b}', label: '上标' },
      { insert: 'a_{b}', label: '下标' },
      { insert: '\\pm', label: '±' },
      { insert: '\\times', label: '×' },
      { insert: '\\div', label: '÷' },
      { insert: '\\cdot', label: '·' },
    ],
  },
  {
    label: '关系',
    symbols: [
      { insert: '\\neq', label: '≠' },
      { insert: '\\leq', label: '≤' },
      { insert: '\\geq', label: '≥' },
      { insert: '\\approx', label: '≈' },
      { insert: '\\equiv', label: '≡' },
      { insert: '\\to', label: '→' },
      { insert: '\\rightarrow', label: '→' },
      { insert: '\\Rightarrow', label: '⇒' },
      { insert: '\\infty', label: '∞' },
    ],
  },
  {
    label: '微积分',
    symbols: [
      { insert: '\\int_{a}^{b}', label: '积分' },
      { insert: '\\iint', label: '二重积分' },
      { insert: '\\sum_{i=1}^{n}', label: '求和' },
      { insert: '\\prod_{i=1}^{n}', label: '连乘' },
      { insert: '\\lim_{x \\to 0}', label: '极限' },
      { insert: '\\partial', label: '∂' },
      { insert: '\\nabla', label: '∇' },
      { insert: '\\,dx', label: 'dx' },
    ],
  },
  {
    label: '函数',
    symbols: [
      { insert: '\\sin', label: 'sin' },
      { insert: '\\cos', label: 'cos' },
      { insert: '\\tan', label: 'tan' },
      { insert: '\\log', label: 'log' },
      { insert: '\\ln', label: 'ln' },
      { insert: '\\exp', label: 'exp' },
      { insert: '\\max', label: 'max' },
      { insert: '\\min', label: 'min' },
    ],
  },
  {
    label: '括号/矩阵',
    symbols: [
      { insert: '\\left( \\right)', label: '自适应()' },
      { insert: '\\left[ \\right]', label: '自适应[]' },
      { insert: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', label: '矩阵' },
      { insert: '\\begin{cases} \n \n\\end{cases}', label: '分段' },
      { insert: '\\begin{aligned}\n\n\\end{aligned}', label: '对齐' },
      { insert: '\\overline{ab}', label: '上划线' },
      { insert: '\\underline{ab}', label: '下划线' },
      { insert: '\\vec{a}', label: '向量' },
    ],
  },
  {
    label: '希腊',
    symbols: [
      { insert: '\\alpha', label: 'α' },
      { insert: '\\beta', label: 'β' },
      { insert: '\\gamma', label: 'γ' },
      { insert: '\\delta', label: 'δ' },
      { insert: '\\theta', label: 'θ' },
      { insert: '\\lambda', label: 'λ' },
      { insert: '\\mu', label: 'μ' },
      { insert: '\\pi', label: 'π' },
      { insert: '\\sigma', label: 'σ' },
      { insert: '\\omega', label: 'ω' },
    ],
  },
];
