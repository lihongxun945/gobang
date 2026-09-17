import './control.css';
import { useDispatch, useSelector } from 'react-redux';
import { startGame, endGame, undoMove, setAiFirst, setDepth, setIndex, setDebug, setOpeningBook, importGame } from '../store/gameSlice';
import { board_size } from '../config';
import { Button, Switch, Select, Modal, Input, Upload, Space, message } from 'antd';
import { STATUS } from '../status';
import { useCallback, useState } from 'react';
import { serializeGame, deserializeGame } from '../ai/gameSerialization';

const depthOptions = [
  { value: '2', label: '新手' },
  { value: '4', label: '入门' },
  { value: '6', label: '普通' },
  { value: '8', label: '高手' },
];

function Control() {
  const dispatch = useDispatch();
  const { loading, winner, status, history, aiFirst, depth, index, score, scoreAssessment, path, currentDepth, debug, openingBook, openingBookDebug, size } = useSelector((state) => state.game);
  const gaming = status === STATUS.GAMING;
  const statusText = loading ? 'AI 思考中' : winner ? (winner === 1 ? '黑棋胜出' : '白棋胜出') : gaming ? '对局进行中' : '准备就绪';

  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');

  const start = useCallback(() => dispatch(startGame({ board_size, aiFirst, depth, openingBook })), [dispatch, aiFirst, depth, openingBook]);
  const end = useCallback(() => dispatch(endGame()), [dispatch]);
  const undo = useCallback(() => dispatch(undoMove()), [dispatch]);

  const openExport = useCallback(() => {
    setExportText(serializeGame({ size, aiFirst, depth, openingBook, history }));
    setExportOpen(true);
  }, [size, aiFirst, depth, openingBook, history]);

  const copyExport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      message.success('已复制到剪贴板');
    } catch (error) {
      message.error('复制失败，请手动复制');
    }
  }, [exportText]);

  const downloadExport = useCallback(() => {
    const blob = new Blob([exportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gobang-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [exportText]);

  const readFileText = useCallback((file) => {
    file.text()
      .then((text) => {
        setImportText(text);
        message.success('已读取文件');
      })
      .catch(() => message.error('读取文件失败'));
    return false;
  }, []);

  const confirmImport = useCallback(() => {
    const result = deserializeGame(importText, board_size);
    if (!result.ok) {
      message.error(result.error);
      return;
    }
    dispatch(importGame(result.data));
    setImportOpen(false);
    setImportText('');
  }, [importText, dispatch]);

  return (
    <div className="control">
      <div className="control-header">
        <span className="eyebrow">Game console</span>
        <div className="game-state"><span className={`state-dot ${loading ? 'busy' : gaming ? 'active' : ''}`} />{statusText}</div>
        <div className="move-count"><strong>{history.length}</strong><span>已落子</span></div>
      </div>

      {gaming && scoreAssessment && (
        <div className={`position-assessment ${scoreAssessment.tone}`}>
          <div><span>局面判断</span><strong>{scoreAssessment.label}</strong></div>
          <small>{scoreAssessment.detail}</small>
        </div>
      )}

      <div className="primary-actions">
        <Button className="start-button" type="primary" size="large" onClick={start} disabled={loading || gaming}>开始新对局</Button>
        <div className="secondary-actions">
          <Button onClick={undo} disabled={loading || !gaming || history.length === 0}>悔棋</Button>
          <Button danger onClick={end} disabled={loading || !gaming}>认输</Button>
        </div>
      </div>

      <section className="settings-section">
        <h3>对局设置</h3>
        <label className="select-setting">
          <span><b>难度</b><small>搜索越深，思考时间越长</small></span>
          <Select value={String(depth)} onChange={(value) => dispatch(setDepth(value))} disabled={loading} options={depthOptions} />
        </label>
        <Setting label="电脑先手" hint="AI 执黑棋率先落子"><Switch checked={aiFirst} onChange={(checked) => dispatch(setAiFirst(checked))} disabled={loading || gaming} /></Setting>
        <Setting label="实战开局库" hint="优先采用已验证的开局"><Switch checked={openingBook} onChange={(checked) => dispatch(setOpeningBook(checked))} disabled={loading || gaming} /></Setting>
        <Setting label="显示手数" hint="在棋子上标记落子顺序"><Switch checked={index} onChange={(checked) => dispatch(setIndex(checked))} /></Setting>
        <Setting label="调试信息" hint="展示搜索和开局库详情"><Switch checked={debug} onChange={(checked) => dispatch(setDebug(checked))} disabled={loading} /></Setting>
      </section>

      <div style={{ marginTop: 16, marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <Space>
          <Button onClick={openExport} disabled={loading || history.length === 0}>导出棋局</Button>
          <Button onClick={() => setImportOpen(true)} disabled={loading}>导入棋局</Button>
        </Space>
      </div>

      {debug && (
        <section className="debug-panel">
          <div className="debug-title"><h3>搜索诊断</h3><span>LIVE</span></div>
          <div className="debug-metrics">
            <Metric label="评分" value={score ?? 0} />
            <Metric label="深度" value={currentDepth || path?.length || 0} />
            <Metric label="开局命中" value={openingBookDebug?.hit ? '是' : '否'} />
            <Metric label="采用着法" value={openingBookDebug?.adopted ? '是' : '否'} />
          </div>
          <DebugLine label="思考路径" value={JSON.stringify(path || [])} />
          <DebugLine label="历史坐标" value={JSON.stringify(history.map(({ i, j }) => [i, j]))} />
          {openingBookDebug?.adopted && <DebugLine label="开局着法" value={JSON.stringify(openingBookDebug.selectedMove)} />}
          {openingBookDebug?.hit && <DebugLine label="开局候选" value={openingBookDebug.candidates.map(({ move, weight, sources }) => `${move.join(',')} · ${weight} · ${sources.join('/')}`).join('；')} />}
        </section>
      )}

      <Modal
        title="导出棋局"
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        footer={null}
        width={520}
      >
        <Input.TextArea value={exportText} readOnly rows={10} />
        <Space style={{ marginTop: 12 }}>
          <Button type="primary" onClick={copyExport}>复制到剪贴板</Button>
          <Button onClick={downloadExport}>下载 .json</Button>
        </Space>
      </Modal>

      <Modal
        title="导入棋局"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportOpen(false)}>取消</Button>,
          <Button key="ok" type="primary" onClick={confirmImport} disabled={loading}>确认导入</Button>,
        ]}
        width={520}
      >
        <Input.TextArea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          rows={10}
          placeholder="粘贴棋局 JSON，或点击下方按钮选择文件"
        />
        <Space style={{ marginTop: 12 }}>
          <Upload accept=".json,application/json,text/plain" showUploadList={false} beforeUpload={readFileText}>
            <Button>选择文件</Button>
          </Upload>
        </Space>
      </Modal>
    </div>
  );
}

const Setting = ({ label, hint, children }) => <label className="setting-item"><span><b>{label}</b><small>{hint}</small></span>{children}</label>;
const Metric = ({ label, value }) => <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
const DebugLine = ({ label, value }) => <div className="debug-line"><b>{label}</b><code>{value}</code></div>;

export default Control;
