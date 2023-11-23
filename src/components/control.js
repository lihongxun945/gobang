import './control.css';
import { useDispatch, useSelector } from 'react-redux';
import { startGame, endGame, undoMove, setAiFirst, setDepth, setIndex } from '../store/gameSlice';
import { board_size } from '../config';
import { Button, Switch, Select } from 'antd';
import { STATUS } from '../status';
import { useCallback } from 'react';

function Control() {
  const dispatch = useDispatch();
  const { loading, winner, status, history, aiFirst, depth, index, score, path, currentDepth } = useSelector((state) => state.game);
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
  return (
    <div className="controle">
      <div className="buttons">
        <Button className="button" type="primary" onClick={start} disabled={loading || status !== STATUS.IDLE}>开始</Button>
        <Button className="button" type="primary" onClick={undo} disabled={loading || status !== STATUS.GAMING || history.length === 0}>悔棋</Button>
        <Button className="button" type="primary" onClick={end} disabled={loading || status !== STATUS.GAMING}>认输</Button>
      </div>
      <div className="setting">
        <div className="setting-item">
          电脑先手: <Switch defaultChecked={aiFirst} onChange={onFirstChange} disabled={loading} />
        </div>
        <div className="setting-item">
          难度:
          <Select
            defaultValue={String(depth)}
            style={{ width: 80 }}
            onChange={onDepthChange}
            disabled={loading}
            options={[
              { value: '2', label: '弱智' },
              { value: '4', label: '简单' },
              { value: '6', label: '普通' },
              { value: '8', label: '困难' },
            ]}
          />
        </div>
        <div className="setting-item">
          序号: <Switch defaultChecked={index} onChange={onIndexChange} />
        </div>
      </div>
      <div className="status">
        <div className="status-item">评分：{score}</div>
        <div className="status-item">深度: {currentDepth}</div>
        <div className="status-item">路径: {JSON.stringify(path)}</div>
        <div className="status-item">历史: {JSON.stringify(history.map(h => [h.i, h.j]))}</div>
      </div>
    </div>
  );
}

export default Control;
