interface PlayerMoveMessage {
  type: 'PLAYER_MOVE';
  from: string;
  to: string;
}

interface AIMoveMessage {
  type: 'AI_MOVE';
  from: string;
  to: string;
}

// Extremely lightweight engine: respond to 1.e4 with 1...e5
function computeAIMove(_from: string, _to: string): { from: string; to: string } {
  // For now ignore the player's move and always play e7e5
  return { from: 'e7', to: 'e5' };
}

self.onmessage = function (event: MessageEvent<PlayerMoveMessage>) {
  const data = event.data;
  if (data && data.type === 'PLAYER_MOVE') {
    const move = computeAIMove(data.from, data.to);
    const message: AIMoveMessage = { type: 'AI_MOVE', ...move };
    setTimeout(() => {
      (self as unknown as Worker).postMessage(message);
    }, 500);
  }
};
