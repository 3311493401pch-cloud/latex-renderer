import { useState, useEffect } from 'react';

interface TutorialModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    num: 1,
    title: '打开 AI Agent',
    detail: (
      <>
        访问{' '}
        <a
          href="https://doubao.com/bot/Wg0vYdhD"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://doubao.com/bot/Wg0vYdhD
        </a>
      </>
    ),
  },
  {
    num: 2,
    title: '发送截图',
    detail: '将电子版题目截图或拍照，发送给 Agent',
  },
  {
    num: 3,
    title: '输入「识别」',
    detail: '在对话框中输入「识别」，等待 Agent 返回 LaTeX 代码',
  },
  {
    num: 4,
    title: '复制结果',
    detail: '点击 Agent 回复右上角的复制按钮，复制全部 LaTeX 内容',
  },
  {
    num: 5,
    title: '回到本网站粘贴',
    detail: (
      <>
        点左侧「📋 批量导入」→ 粘贴 →「导入」，或逐条粘贴到题目输入框
      </>
    ),
  },
];

function TutorialModal({ onClose }: TutorialModalProps) {
  const [countdown, setCountdown] = useState(5);
  const isFirstVisit = !localStorage.getItem('latex-tutorial-seen');

  useEffect(() => {
    if (!isFirstVisit) return;
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, isFirstVisit]);

  const handleClose = () => {
    if (isFirstVisit) {
      localStorage.setItem('latex-tutorial-seen', '1');
    }
    onClose();
  };

  return (
    <div className="tutorial-overlay" onClick={handleClose}>
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-header">
          <h2 className="tutorial-title">📖 使用教程</h2>
          {isFirstVisit && countdown > 0 ? (
            <span className="tutorial-countdown">
              {countdown} 秒后可关闭
            </span>
          ) : (
            <button className="tutorial-close-btn" onClick={handleClose}>
              ✕
            </button>
          )}
        </div>

        <ol className="tutorial-steps">
          {STEPS.map((step) => (
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
            💡 排版设置（间距 / 字号 / 分栏 / 编号）请自行探索左侧「⚙ 排版设置」
          </p>
          <p className="tutorial-contact">
            📹 如有任何问题，请通过视频号联系我
          </p>
        </div>
      </div>
    </div>
  );
}

export default TutorialModal;
