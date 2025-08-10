const React = require('react');
const { Chess } = require('chess.js');

function useGameStore() {
  const [game] = React.useState(() => new Chess());
  const [status, setStatus] = React.useState('playing');
  const [pendingPromotion, setPendingPromotion] = React.useState(null);

  const updateStatus = React.useCallback(() => {
    if (game.in_checkmate()) {
      setStatus('checkmate');
    } else if (game.in_stalemate()) {
      setStatus('stalemate');
    } else if (game.in_check()) {
      setStatus('check');
    } else {
      setStatus('playing');
    }
  }, [game]);

  const makeMove = React.useCallback(
    (from, to, promotion) => {
      const move = promotion ? { from, to, promotion } : { from, to };
      const result = game.move(move);
      if (result) {
        updateStatus();
      }
      return result;
    },
    [game, updateStatus]
  );

  const move = React.useCallback(
    (from, to) => {
      const piece = game.get(from);
      if (
        piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && to[1] === '8') ||
          (piece.color === 'b' && to[1] === '1'))
      ) {
        setPendingPromotion({ from, to, color: piece.color });
        return null;
      }
      return makeMove(from, to);
    },
    [game, makeMove]
  );

  const promote = React.useCallback(
    (piece) => {
      if (pendingPromotion) {
        makeMove(pendingPromotion.from, pendingPromotion.to, piece);
        setPendingPromotion(null);
      }
    },
    [pendingPromotion, makeMove]
  );

  const board = React.useMemo(() => game.board(), [game, status]);

  return {
    board,
    move,
    promote,
    pendingPromotion,
    isCheck: game.in_check(),
    isCheckmate: game.in_checkmate(),
    isStalemate: game.in_stalemate(),
    status,
  };
}

module.exports = useGameStore;
