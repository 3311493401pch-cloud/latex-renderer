import { Problem } from './types';

/**
 * Parse a TEX file / batch input into individual problems.
 * Format:
 *   - Problems separated by blank lines
 *   - Optional `% source: <name>` on the first line of a problem
 */
export function parseBatchTex(text: string): { latex: string; source: string }[] {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return blocks
    .map((block) => {
      const lines = block.trim().split('\n');
      let source = '';
      let startIdx = 0;
      const sourceMatch = lines[0]?.match(/^%\s*source:\s*(.+)/i);
      if (sourceMatch) {
        source = sourceMatch[1].trim();
        startIdx = 1;
      }
      const latex = lines.slice(startIdx).join('\n').trim();
      return { latex, source };
    })
    .filter((item) => item.latex);
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
