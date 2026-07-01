import { useState, useRef, useCallback, useEffect } from 'react';
import { parseBatchTex } from '../utils';

export type OcrProvider = 'huggingface' | 'mathpix';

const STORAGE_KEY_OCR = 'latex-ocr-config';

interface OcrConfig {
  provider: OcrProvider;
  hfToken: string;
  hfModel: string;
  mathpixAppId: string;
  mathpixAppKey: string;
}

function loadConfig(): OcrConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OCR);
    if (raw) return { ...getDefaultConfig(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return getDefaultConfig();
}

function getDefaultConfig(): OcrConfig {
  return {
    provider: 'huggingface',
    hfToken: '',
    hfModel: 'lukas-blecher/LaTeX-OCR',
    mathpixAppId: '',
    mathpixAppKey: '',
  };
}

function saveConfig(config: OcrConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_OCR, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

interface ImageOcrProps {
  onImport: (latex: string, source: string) => void;
  onClose: () => void;
}

function ImageOcr({ onImport, onClose }: ImageOcrProps) {
  const [config, setConfig] = useState<OcrConfig>(loadConfig);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setResult('');
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith('image/')) {
      handleFile(dropped);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRecognize = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      if (config.provider === 'huggingface') {
        await recognizeHuggingFace(file, config);
      } else {
        await recognizeMathpix(file, config);
      }
    } catch (err: any) {
      setError(err?.message || '识别失败');
    } finally {
      setLoading(false);
    }
  }, [file, config]);

  const recognizeHuggingFace = async (image: File, cfg: OcrConfig) => {
    if (!cfg.hfToken) {
      throw new Error('请先输入 Hugging Face API Token');
    }
    if (!cfg.hfModel) {
      throw new Error('请输入模型 ID');
    }

    const resp = await fetch(
      `https://api-inference.huggingface.co/models/${encodeURIComponent(cfg.hfModel)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.hfToken}`,
        },
        body: image,
      }
    );

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Hugging Face 请求失败 (${resp.status}): ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    // 响应可能是 string 或 [{ generated_text: '...' }]
    let text = '';
    if (typeof data === 'string') {
      text = data;
    } else if (Array.isArray(data) && data[0]) {
      text = data[0].generated_text || data[0].text || JSON.stringify(data[0]);
    } else if (data.generated_text) {
      text = data.generated_text;
    } else if (data.text) {
      text = data.text;
    } else {
      text = JSON.stringify(data);
    }
    setResult(text);
  };

  const recognizeMathpix = async (image: File, cfg: OcrConfig) => {
    if (!cfg.mathpixAppId || !cfg.mathpixAppKey) {
      throw new Error('请输入 Mathpix app_id 和 app_key');
    }

    const base64 = await fileToBase64(image);
    const resp = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        app_id: cfg.mathpixAppId,
        app_key: cfg.mathpixAppKey,
      },
      body: JSON.stringify({
        src: base64,
        formats: ['text', 'latex_simplified'],
        include_latex: 1,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Mathpix 请求失败 (${resp.status}): ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    const text = data.latex_simplified || data.latex || data.text || '';
    setResult(text);
  };

  const handleImportAsNew = () => {
    if (!result.trim()) return;
    const parsed = parseBatchTex(result);
    if (parsed.length === 1) {
      onImport(parsed[0].latex, parsed[0].source || '图片识别');
    } else if (parsed.length > 1) {
      parsed.forEach((item) => onImport(item.latex, item.source || '图片识别'));
    } else {
      onImport(result.trim(), '图片识别');
    }
    onClose();
  };

  return (
    <div className="image-ocr">
      <p className="image-ocr-hint">
        上传题目截图，自动识别成 LaTeX。需要自行配置 API Key/Token（数据仅保存在浏览器本地）。
      </p>

      <div className="image-ocr-provider">
        <div className="image-ocr-row">
          <span className="image-ocr-label">识别服务</span>
          <select
            className="image-ocr-select"
            value={config.provider}
            onChange={(e) =>
              setConfig((c) => ({ ...c, provider: e.target.value as OcrProvider }))
            }
          >
            <option value="huggingface">Hugging Face (免费，需 Token)</option>
            <option value="mathpix">Mathpix (精准，需 app_id/key)</option>
          </select>
        </div>

        {config.provider === 'huggingface' && (
          <>
            <div className="image-ocr-row">
              <span className="image-ocr-label">API Token</span>
              <input
                className="image-ocr-input"
                type="password"
                value={config.hfToken}
                onChange={(e) => setConfig((c) => ({ ...c, hfToken: e.target.value }))}
                placeholder="hf_..."
              />
            </div>
            <div className="image-ocr-row">
              <span className="image-ocr-label">模型 ID</span>
              <input
                className="image-ocr-input"
                value={config.hfModel}
                onChange={(e) => setConfig((c) => ({ ...c, hfModel: e.target.value }))}
                placeholder="例如 lukas-blecher/LaTeX-OCR"
              />
            </div>
          </>
        )}

        {config.provider === 'mathpix' && (
          <>
            <div className="image-ocr-row">
              <span className="image-ocr-label">app_id</span>
              <input
                className="image-ocr-input"
                value={config.mathpixAppId}
                onChange={(e) => setConfig((c) => ({ ...c, mathpixAppId: e.target.value }))}
                placeholder="Mathpix app_id"
              />
            </div>
            <div className="image-ocr-row">
              <span className="image-ocr-label">app_key</span>
              <input
                className="image-ocr-input"
                type="password"
                value={config.mathpixAppKey}
                onChange={(e) => setConfig((c) => ({ ...c, mathpixAppKey: e.target.value }))}
                placeholder="Mathpix app_key"
              />
            </div>
          </>
        )}
      </div>

      <div
        className={`image-ocr-dropzone ${dragOver ? 'active' : ''} ${previewUrl ? 'has-preview' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="预览" className="image-ocr-preview" />
        ) : (
          <div className="image-ocr-dropzone-text">
            <span>📤</span>
            <p>拖拽图片到此处，或点击选择</p>
          </div>
        )}
      </div>

      {error && <p className="image-ocr-error">⚠️ {error}</p>}

      <div className="image-ocr-actions">
        <button
          className="btn btn-primary"
          onClick={handleRecognize}
          disabled={!file || loading}
        >
          {loading ? '识别中...' : '🔍 识别'}
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          关闭
        </button>
      </div>

      {result && (
        <div className="image-ocr-result">
          <label className="image-ocr-result-label">识别结果</label>
          <textarea
            className="image-ocr-result-textarea"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={4}
          />
          <div className="image-ocr-actions">
            <button className="btn btn-primary" onClick={handleImportAsNew}>
              ➕ 添加为新题目
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

export default ImageOcr;
