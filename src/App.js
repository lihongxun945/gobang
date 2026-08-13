import Board from './components/board';
import './App.css';
import Control from './components/control';
import packageInfo from '../package.json';

const LAST_UPDATED = '2026-08-13';

function App() {
  return (
    <div className="App">
      <Board />
      <Control />
      <footer className="app-version">
        版本 v{packageInfo.version} · 更新时间 {LAST_UPDATED}
      </footer>
    </div>
  );
}

export default App;
