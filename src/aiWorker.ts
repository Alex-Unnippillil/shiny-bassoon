self.onmessage = (
  e: MessageEvent<{ type: string; from: string; to: string }>,
) => {
  const { type, from, to } = e.data || {};
  if (type === 'PLAYER_MOVE') {
    if (from === 'e2' && to === 'e4') {
      setTimeout(() => {
        self.postMessage({ type: 'AI_MOVE', from: 'e7', to: 'e5' });
      }, 500);
    }
  }
};

export {};
