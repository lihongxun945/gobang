import './control.css';
import { useDispatch, useSelector } from 'react-redux';
import { startGame, endGame, undoMove, setAiFirst, setDepth, setIndex, setDebug } from '../store/gameSlice';
import { board_size } from '../config';
import { Button, Switch, Select } from 'antd';
import { STATUS } from '../status';
import { useCallback } from 'react';

function Control() {
  const dispatch = useDispatch();
  const { loading, winner, status, history, aiFirst, depth, index, score, path, currentDepth, debug } = useSelector((state) => state.game);
  const start = useCallback(() => {
    dispatch(startGame({board_size, aiFirst, depth}));
  }, [dispatch, board_size, aiFirst, depth]);
  const end = useCallback(() => {
    dispatch(endGame());
  }, [dispatch]);
  const undo = useCallback(() => {
    dispatch(undoMove());
  }, [dispatch]);
  const onFirstChange = useCallback((checked) => {
    dispatch(setAiFirst(checked));
  }, [dispatch]);
  const onDepthChange = useCallback((value) => {
    dispatch(setDepth(value));
  }, [dispatch]);
  const onIndexChange = useCallback((checked) => {
    dispatch(setIndex(checked));
  }, [dispatch]);
  const onDebugChange = useCallback((checked) => {
    dispatch(setDebug(checked));
  }, [dispatch]);
  return (
    <div className="control">
      <div className="buttons">
        <Button className="button" type="primary" onClick={start} disabled={loading || status !== STATUS.IDLE}>开始</Button>
        <Button className="button" type="primary" onClick={undo} disabled={loading || status !== STATUS.GAMING || history.length === 0}>悔棋</Button>
        <Button className="button" type="primary" onClick={end} disabled={loading || status !== STATUS.GAMING}>认输</Button>
      </div>
      <div className="setting">
        <div className="setting-row">
          <div className="setting-item">
            电脑先手: <Switch defaultChecked={aiFirst} onChange={onFirstChange} disabled={loading} />
          </div>
          <div className="setting-item">
            难度:
            <Select
              defaultValue={String(depth)}
              style={{ width: 160 }}
              onChange={onDepthChange}
              disabled={loading}
              options={[
                { value: '2', label: '弱智(2~10层)超快' },
                { value: '4', label: '简单(4~12层)快' },
                { value: '6', label: '普通(6~14层)慢' },
                { value: '8', label: '困难(8~16层)超慢' },
              ]}
            />
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-item">
            序号: <Switch defaultChecked={index} onChange={onIndexChange} />
          </div>
          <div className="setting-item">
            调试: <Switch defaultChecked={debug} onChange={onDebugChange} disabled={loading} />
          </div>
        </div>
      </div>
      {
        debug && <div className="status">
          <div className="status-item">评分：{score}</div>
          <div className="status-item">深度: {path?.length || 0}</div>
          <div className="status-item">思考: {JSON.stringify(path)}</div>
          <div className="status-item">历史: {JSON.stringify(history.map(h => [h.i, h.j]))}</div>
        </div>
      }
    </div>
  );
}

export default Control;
