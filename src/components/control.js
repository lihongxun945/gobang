import './control.css';
import { useDispatch, useSelector } from 'react-redux';
import { startGame, endGame, undoMove, setAiFirst, setDepth, setIndex, setDebug, setOpeningBook } from '../store/gameSlice';
import { board_size } from '../config';
import { Button, Switch, Select } from 'antd';
import { STATUS } from '../status';
import { useCallback } from 'react';

const depthOptions = [
  { value: '2', label: '新手' },
  { value: '4', label: '入门' },
  { value: '6', label: '普通' },
  { value: '8', label: '高手' },
];

function Control() {
  const dispatch = useDispatch();
  const { loading, winner, status, history, aiFirst, depth, index, score, scoreAssessment, path, currentDepth, debug, openingBook, openingBookDebug } = useSelector((state) => state.game);
  const gaming = status === STATUS.GAMING;
  const statusText = loading ? 'AI 思考中' : winner ? (winner === 1 ? '黑棋胜出' : '白棋胜出') : gaming ? '对局进行中' : '准备就绪';

  const start = useCallback(() => dispatch(startGame({ board_size, aiFirst, depth, openingBook })), [dispatch, aiFirst, depth, openingBook]);
  const end = useCallback(() => dispatch(endGame()), [dispatch]);
  const undo = useCallback(() => dispatch(undoMove()), [dispatch]);

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
    </div>
  );
}

const Setting = ({ label, hint, children }) => <label className="setting-item"><span><b>{label}</b><small>{hint}</small></span>{children}</label>;
const Metric = ({ label, value }) => <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
const DebugLine = ({ label, value }) => <div className="debug-line"><b>{label}</b><code>{value}</code></div>;

export default Control;
