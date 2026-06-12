import { LayoutConfig } from '../types';

interface LayoutOptionsProps {
  layout: LayoutConfig;
  onChange: <K extends keyof LayoutConfig>(
    key: K,
    value: LayoutConfig[K]
  ) => void;
}

function LayoutOptions({ layout, onChange }: LayoutOptionsProps) {
  return (
    <div className="layout-options">
      <p className="layout-options-title">排版设置</p>

      <div className="layout-option-row">
        <span className="layout-option-label">题目间距</span>
        <select
          className="layout-option-select"
          value={layout.spacing}
          onChange={(e) =>
            onChange('spacing', e.target.value as LayoutConfig['spacing'])
          }
        >
          <option value="compact">紧凑</option>
          <option value="two-per-page">一页 2 题</option>
          <option value="three-per-page">一页 3 题</option>
        </select>
      </div>

      <div className="layout-option-row">
        <span className="layout-option-label">字号</span>
        <select
          className="layout-option-select"
          value={layout.fontSize}
          onChange={(e) =>
            onChange('fontSize', e.target.value as LayoutConfig['fontSize'])
          }
        >
          <option value="small">小</option>
          <option value="normal">中</option>
          <option value="large">大</option>
        </select>
      </div>

      <div className="layout-option-row">
        <span className="layout-option-label">分栏</span>
        <select
          className="layout-option-select"
          value={layout.columns}
          onChange={(e) =>
            onChange('columns', Number(e.target.value) as 1 | 2)
          }
        >
          <option value={1}>单栏</option>
          <option value={2}>双栏</option>
        </select>
      </div>

      <div className="layout-option-row">
        <span className="layout-option-label">自动编号</span>
        <button
          className={`layout-option-toggle ${layout.numbering ? 'active' : ''}`}
          onClick={() => onChange('numbering', !layout.numbering)}
          aria-label="切换自动编号"
        />
      </div>


    </div>
  );
}

export default LayoutOptions;
