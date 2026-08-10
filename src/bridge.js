import MinmaxWorker from './minmax.worker';

const worker = new MinmaxWorker();
export const start = async (board_size, aiFirst, depth, openingBook, openingBookMode) => {
  return new Promise((resolve, reject) => {
    worker.postMessage({
      action: 'start',
      payload: {
        board_size,
        aiFirst,
        depth,
        openingBook,
        openingBookMode,
      },
    });
    worker.onmessage = (event) => {
      const { action, payload } = event.data;
      if (action === 'start') {
        resolve(payload);
      }
    };
  })
};

export const move = async (position, depth, openingBook, openingBookMode) => {
  return new Promise((resolve, reject) => {
    worker.postMessage({
      action: 'move',
      payload: {
        position,
        depth,
        openingBook,
        openingBookMode,
      },
    });
    worker.onmessage = (event) => {
      const { action, payload } = event.data;
      if (action === 'move') {
        resolve(payload);
      }
    };
  })
};

export const end = async () => {
  return new Promise((resolve, reject) => {
    worker.postMessage({
      action: 'end',
    });
    worker.onmessage = (event) => {
      const { action, payload } = event.data;
      if (action === 'end') {
        resolve(payload);
      }
    };
  })
};

export const undo = async () => {
  return new Promise((resolve, reject) => {
    worker.postMessage({
      action: 'undo',
    });
    worker.onmessage = (event) => {
      console.log('undo', event);
      const { action, payload } = event.data;
      if (action === 'undo') {
        resolve(payload);
      }
    };
  })
};