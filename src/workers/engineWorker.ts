interface MoveMessage {
  type: 'move';
  fen: string;
}

interface AIMoveMessage {
  type: 'aiMove';
  move: string;
}

// Extremely lightweight engine: respond to common opening with e7e5
function computeAIMove(fen: string): string {
  // If we recognise the starting position after 1.e4, respond with 1...e5
  if (fen.startsWith('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b')) {
    return 'e7e5';
  }
  // default reply
  return 'e7e5';
}

self.onmessage = function (event: MessageEvent<MoveMessage>) {
  const data = event.data;
  if (data && data.type === 'move') {
    const move = computeAIMove(data.fen);
    const message: AIMoveMessage = { type: 'aiMove', move };
    (self as unknown as Worker).postMessage(message);
  }
};
