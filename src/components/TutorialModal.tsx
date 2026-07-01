import { useState, useEffect } from 'react';

interface TutorialModalProps {
  onClose: () => void;
}

type Provider = 'huggingface' | 'mathpix';

const HF_STEPS = [
  {
    num: 1,
    title: '注册 Hugging Face 账号',
    detail: (
      <>
        访问{' '}
        <a href="https://huggingface.co/join" target="_blank" rel="noopener noreferrer">
          huggingface.co/join
        </a>{' '}
        注册账号（免费，邮箱即可）
      </>
    ),
  },
  {
    num: 2,
    title: '创建 Access Token',
    detail: (
      <>
        登录后进入{' '}
        <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">
          Settings → Access Tokens
        </a>{' '}
        → 点 <code>New token</code>
      </>
    ),
  },
  {
    num: 3,
    title: '设置 Token 信息',
    detail: (
      <>
        Name 随便填（如 <code>latex-ocr</code>），Type 选 <code>Read</code>，点 Create token
      </>
    ),
  },
  {
    num: 4,
    title: '复制 Token',
    detail: (
      <>
        生成后会显示一段以 <code>hf_</code> 开头的字符串，点复制（⚠️ 只显示一次，请妥善保存）
      </>
    ),
  },
  {
    num: 5,
    title: '回到本站填入',
    detail: (
      <>
        点左侧「🖼 图片识别」→ 服务选 <code>Hugging Face</code> → 粘贴 Token，模型默认
        <code>lukas-blecher/LaTeX-OCR</code> 即可
      </>
    ),
  },
  {
    num: 6,
    title: '上传图片识别',
    detail: '上传题目截图 → 点「🔍 识别」→ 结果可编辑 →「➕ 添加为新题目」',
  },
];

const MATHPIX_STEPS = [
  {
    num: 1,
    title: '注册 Mathpix 账号',
    detail: (
      <>
        访问{' '}
        <a href="https://dashboard.mathpix.com/signup" target="_blank" rel="noopener noreferrer">
          dashboard.mathpix.com/signup
        </a>{' '}
        注册（需邮箱验证）
      </>
    ),
  },
  {
    num: 2,
    title: '进入 API Keys 页面',
    detail: (
      <>
        登录后进入 Dashboard，左侧菜单点{' '}
        <a href="https://dashboard.mathpix.com/api-keys" target="_blank" rel="noopener noreferrer">
          API Keys
        </a>
      </>
    ),
  },
  {
    num: 3,
    title: '创建新 Key',
    detail: <>点 <code>+ Create new API key</code>，名称随便填</>,
  },
  {
    num: 4,
    title: '复制 app_id 和 app_key',
    detail: (
      <>
        创建后会显示 <code>app_id</code>（短字符串）和 <code>app_key</code>（长字符串），分别复制
      </>
    ),
  },
  {
    num: 5,
    title: '回到本站填入',
    detail: (
      <>
        点左侧「🖼 图片识别」→ 服务选 <code>Mathpix</code> → 粘贴 <code>app_id</code> 和 <code>app_key</code>
      </>
    ),
  },
  {
    num: 6,
    title: '上传图片识别',
    detail: '上传题目截图 → 点「🔍 识别」→ 结果可编辑 →「➕ 添加为新题目」',
  },
];

function TutorialModal({ onClose }: TutorialModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [agreed, setAgreed] = useState(false);
  const [provider, setProvider] = useState<Provider>('huggingface');
  const isFirstVisit = !localStorage.getItem('latex-tutorial-seen');

  useEffect(() => {
    if (!isFirstVisit) return;
    let cancelled = false;

    const tick = (remaining: number) => {
      if (cancelled) return;
      setCountdown(remaining);
      if (remaining > 0) {
        setTimeout(() => tick(remaining - 1), 1000);
      }
    };

    tick(5);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canClose = countdown <= 0 && agreed;

  const handleClose = () => {
    if (!canClose) return;
    if (isFirstVisit) {
      localStorage.setItem('latex-tutorial-seen', '1');
    }
    onClose();
  };

  const steps = provider === 'huggingface' ? HF_STEPS : MATHPIX_STEPS;

  return (
    <div className="tutorial-overlay" onClick={handleClose}>
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-header">
          <h2 className="tutorial-title">📖 图片识别使用教程</h2>
          {!canClose ? (
            <span className="tutorial-countdown">
              {countdown > 0
                ? `${countdown} 秒后可关闭`
                : '请先阅读并勾选下方声明'}
            </span>
          ) : (
            <button className="tutorial-close-btn" onClick={handleClose}>
              ✕
            </button>
          )}
        </div>

        <p className="tutorial-intro">
          本站支持上传题目图片自动识别为 LaTeX。需要配置一个识别服务的 API Key（数据仅保存在你的浏览器本地，不会上传到本站服务器）。下方任选其一即可：
        </p>

        {/* Provider Tabs */}
        <div className="tutorial-tabs">
          <button
            className={`tutorial-tab ${provider === 'huggingface' ? 'active' : ''}`}
            onClick={() => setProvider('huggingface')}
          >
            🤗 Hugging Face（免费）
          </button>
          <button
            className={`tutorial-tab ${provider === 'mathpix' ? 'active' : ''}`}
            onClick={() => setProvider('mathpix')}
          >
            ⚡ Mathpix（更精准）
          </button>
        </div>

        <div className="tutorial-tab-info">
          {provider === 'huggingface' ? (
            <p>
              <strong>免费方案</strong>。Hugging Face 提供开源模型推理 API，注册即送额度，
              日常识别题目足够用。识别效果依赖模型，复杂公式偶有偏差。
            </p>
          ) : (
            <p>
              <strong>付费方案</strong>。Mathpix 是业界最精准的公式识别服务，新用户有 1000 次免费额度，
              之后约 $0.01/次。对复杂公式、手写体支持更好。
            </p>
          )}
        </div>

        <ol className="tutorial-steps">
          {steps.map((step) => (
            <li key={step.num} className="tutorial-step">
              <span className="tutorial-step-num">{step.num}</span>
              <div className="tutorial-step-body">
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="tutorial-footer">
          <p className="tutorial-hint">
            💡 也可不用图片识别，直接在「📋 批量导入」粘贴 AI 返回的 LaTeX 代码。
            排版设置（间距 / 字号 / 分栏 / 编号）请探索左侧「⚙ 排版设置」。
          </p>

          <div className="tutorial-disclaimer">
            <label className="tutorial-disclaimer-label">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                我已阅读并同意以上使用说明。本工具仅供<strong>个人学习</strong>使用，
                请尊重原书版权，不得将识别内容用于商业分发或侵权传播。
                如涉及版权问题请联系我删除。
              </span>
            </label>
          </div>

          <p className="tutorial-contact">
            📹 如有任何问题，请通过视频号或 vx：pengch0930 联系我
          </p>
        </div>
      </div>
    </div>
  );
}

export default TutorialModal;
