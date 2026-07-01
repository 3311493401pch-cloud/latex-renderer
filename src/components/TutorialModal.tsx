import { useState, useEffect } from 'react';

interface TutorialModalProps {
  onClose: () => void;
}

type Provider = 'siliconflow' | 'simpletex' | 'huggingface' | 'mathpix';

const SILICONFLOW_STEPS = [
  {
    num: 1,
    title: '注册 SiliconFlow 账号',
    detail: (
      <>
        访问{' '}
        <a href="https://cloud.siliconflow.cn/i/user_register" target="_blank" rel="noopener noreferrer">
          cloud.siliconflow.cn
        </a>{' '}
        注册（国内服务，免费，手机号即可，<strong>注册即送 14 元额度</strong>）
      </>
    ),
  },
  {
    num: 2,
    title: '创建 API 密钥',
    detail: (
      <>
        登录后进入{' '}
        <a href="https://cloud.siliconflow.cn/account/ak" target="_blank" rel="noopener noreferrer">
          控制台 → API 密钥
        </a>{' '}
        → 点「新建 API 密钥」→ 复制 <code>sk-...</code>
      </>
    ),
  },
  {
    num: 3,
    title: '开通视觉模型（重要！）',
    detail: (
      <>
        进入{' '}
        <a href="https://cloud.siliconflow.cn/models?tags=%E8%A7%86%E8%A7%89" target="_blank" rel="noopener noreferrer">
          模型广场 → 视觉
        </a>{' '}
        → 找到 <code>Qwen3-VL-32B-Instruct</code> → 点「开通」（免费开通，不扣费）。
        <br />
        ⚠️ 不开通会报 <code>Model disabled</code> 错误！
      </>
    ),
  },
  {
    num: 4,
    title: '回到本站填入',
    detail: (
      <>
        点左侧「🖼 图片识别」→ 服务默认 <code>SiliconFlow</code> → 粘贴 API Key，模型默认
        <code>Qwen3-VL-32B</code> 即可
      </>
    ),
  },
  {
    num: 5,
    title: '上传图片识别',
    detail: '右键粘贴 / 拖拽 / 点击上传题目截图 → 点「🔍 识别」→ 结果可编辑 →「➕ 添加为新题目」',
  },
];

const SIMPLETEX_STEPS = [
  {
    num: 1,
    title: '注册 SimpleTex 账号',
    detail: (
      <>
        访问{' '}
        <a href="https://simpletex.cn/user/register" target="_blank" rel="noopener noreferrer">
          simpletex.cn/user/register
        </a>{' '}
        注册账号（国内服务，免费，邮箱即可）
      </>
    ),
  },
  {
    num: 2,
    title: '进入 API 接口页面',
    detail: (
      <>
        注册登录后，访问{' '}
        <a href="https://simpletex.cn/api" target="_blank" rel="noopener noreferrer">
          simpletex.cn/api
        </a>{' '}
        （或点击官网顶部「API 接口」菜单）
      </>
    ),
  },
  {
    num: 3,
    title: '前往 API 控制面板',
    detail: (
      <>
        在 API 接口页面找到「前往 API 控制面板」按钮并点击（首次可能需开通开放平台账户，按提示同意即可）
      </>
    ),
  },
  {
    num: 4,
    title: '创建用户授权令牌 (UAT)',
    detail: (
      <>
        进入控制面板后，点击左侧菜单「用户授权令牌」→ 点创建 → 名字随便填（如 <code>latex</code>）→ 复制生成的 UAT 字符串
      </>
    ),
  },
  {
    num: 5,
    title: '回到本站填入',
    detail: (
      <>
        点左侧「🖼 图片识别」→ 服务默认 <code>SimpleTex</code> → 粘贴 UAT 令牌
      </>
    ),
  },
  {
    num: 6,
    title: '上传图片识别',
    detail: '右键粘贴 / 拖拽 / 点击上传题目截图 → 点「🔍 识别」→ 结果可编辑 →「➕ 添加为新题目」',
  },
];

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
        <code>yhshin/latex-ocr</code> 即可
      </>
    ),
  },
  {
    num: 6,
    title: '上传图片识别',
    detail: '右键粘贴 / 拖拽 / 点击上传题目截图 → 点「🔍 识别」→ 结果可编辑 →「➕ 添加为新题目」',
  },
];

const MATHPIX_STEPS = [
  {
    num: 1,
    title: '注册 Mathpix 账号',
    detail: (
      <>
        访问{' '}
        <a href="https://accounts.mathpix.com/signup" target="_blank" rel="noopener noreferrer">
          accounts.mathpix.com/signup
        </a>{' '}
        注册（需邮箱验证）
      </>
    ),
  },
  {
    num: 2,
    title: '进入 Convert Organizations',
    detail: (
      <>
        登录后访问{' '}
        <a href="https://console.mathpix.com/orgs" target="_blank" rel="noopener noreferrer">
          console.mathpix.com/orgs
        </a>
      </>
    ),
  },
  {
    num: 3,
    title: '创建 OCR API',
    detail: (
      <>
        在页面右上角点击 <code>Create OCR API</code>，按提示创建 Convert Organization
      </>
    ),
  },
  {
    num: 4,
    title: '添加支付方式并支付 setup fee',
    detail: (
      <>
        Mathpix 需要绑定信用卡/借记卡，并支付一次性 setup fee（约 $19.99，不可退款）后才能激活 API key。完成后 dashboard 会显示 API key。
      </>
    ),
  },
  {
    num: 5,
    title: '复制 app_id 和 app_key',
    detail: (
      <>
        在 Organization dashboard 上找到 <code>app_id</code>（短字符串）和 <code>app_key</code>（长字符串），分别复制
      </>
    ),
  },
  {
    num: 6,
    title: '回到本站填入',
    detail: (
      <>
        点左侧「🖼 图片识别」→ 服务选 <code>Mathpix</code> → 粘贴 <code>app_id</code> 和 <code>app_key</code>
      </>
    ),
  },
  {
    num: 7,
    title: '上传图片识别',
    detail: '右键粘贴 / 拖拽 / 点击上传题目截图 → 点「🔍 识别」→ 结果可编辑 →「➕ 添加为新题目」',
  },
];

function TutorialModal({ onClose }: TutorialModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [agreed, setAgreed] = useState(false);
  const [provider, setProvider] = useState<Provider>('siliconflow');
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

  const steps =
    provider === 'siliconflow'
      ? SILICONFLOW_STEPS
      : provider === 'simpletex'
        ? SIMPLETEX_STEPS
        : provider === 'huggingface'
          ? HF_STEPS
          : MATHPIX_STEPS;

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
          本站支持上传题目图片自动识别为 LaTeX。需要配置一个识别服务的 API Key（数据仅保存在你的浏览器本地，不会上传到本站服务器）。推荐 SiliconFlow，国内服务、注册送 14 元额度、无需预充值。
        </p>

        {/* Provider Tabs */}
        <div className="tutorial-tabs">
          <button
            className={`tutorial-tab ${provider === 'siliconflow' ? 'active' : ''}`}
            onClick={() => setProvider('siliconflow')}
          >
            ⭐ SiliconFlow（推荐）
          </button>
          <button
            className={`tutorial-tab ${provider === 'simpletex' ? 'active' : ''}`}
            onClick={() => setProvider('simpletex')}
          >
            📐 SimpleTex
          </button>
          <button
            className={`tutorial-tab ${provider === 'huggingface' ? 'active' : ''}`}
            onClick={() => setProvider('huggingface')}
          >
            🤗 Hugging Face
          </button>
          <button
            className={`tutorial-tab ${provider === 'mathpix' ? 'active' : ''}`}
            onClick={() => setProvider('mathpix')}
          >
            ⚡ Mathpix
          </button>
        </div>

        <div className="tutorial-tab-info">
          {provider === 'siliconflow' ? (
            <p>
              <strong>最推荐方案</strong>。国内服务，无需翻墙，<strong>注册即送 14 元额度</strong>（约 3000+ 次图片识别），
              无需预充值、无需绑卡。OpenAI 兼容 API，调用 Qwen2.5-VL 视觉大模型，对复杂公式识别效果好。
            </p>
          ) : provider === 'simpletex' ? (
            <p>
              专用公式识别服务。轻量模型每月 1000 次免费，标准模型每月 500 次免费。
              UAT 令牌一键创建，接入极简。可能需要先开通开放平台账户。
            </p>
          ) : provider === 'huggingface' ? (
            <p>
              <strong>免费方案</strong>。Hugging Face 提供开源模型推理 API，注册即送额度。
              国外服务，可能需要翻墙，复杂公式偶有偏差。
            </p>
          ) : (
            <p>
              <strong>付费方案</strong>。Mathpix 是业界最精准的公式识别服务，但需要创建 Convert Organization
              并支付一次性 setup fee（约 $19.99）后才能开通 API key。适合对准确率要求极高的场景。
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
