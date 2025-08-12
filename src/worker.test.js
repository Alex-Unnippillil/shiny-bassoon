import { handleMessage } from "./worker";

function runWorker(input) {
  return handleMessage({ data: input });
}

test("pawn moves two squares from starting rank", () => {
  const result = runWorker({ board: { e7: { type: "P", color: "b" } }, color: "b" });
  expect(result).toEqual({ move: { from: "e7", to: "e5" } });
});

test("pawn moves one square when double step is blocked", () => {
  const board = {
    e7: { type: "P", color: "b" },
    e5: { type: "P", color: "w" },
  };
  const result = runWorker({ board, color: "b" });
  expect(result).toEqual({ move: { from: "e7", to: "e6" } });
});

test("pawn captures diagonally", () => {
  const board = {
    e4: { type: "P", color: "w" },
    d5: { type: "P", color: "b" },
  };
  const result = runWorker({ board, color: "w" });
  expect(result).toEqual({ move: { from: "e4", to: "d5" } });
});

test("returns error for invalid input", () => {
  const result = runWorker({});
  expect(result).toEqual({ error: "Invalid input" });
});

test("returns error when no legal moves", () => {
  const board = { e4: { type: "P", color: "w" } };
  const result = runWorker({ board, color: "b" });
  expect(result).toEqual({ error: "No legal moves" });
});

