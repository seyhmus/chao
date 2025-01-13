import { makeMove } from "../components/MakeMove";
import { describe, expect, it } from "vitest";

describe("Mancala: Unit Tests", () => {
  it("should distribute 2 stones correctly on 1st pit, switching player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 0, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [1, 2, 1, 1, 2, 0, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 1,
    };

    const result = makeMove(previousState, 0);

    expect(result).toEqual(expectedState);
  });
  it("should distribute 3 stones correctly when the next pit is empty, switching player", () => {
    const previousState = {
      pits: [3, 0, 1, 1, 2, 0, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [1, 1, 2, 1, 2, 0, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 1,
    };

    const result = makeMove(previousState, 0);

    expect(result).toEqual(expectedState);
  });
  it("should distribute 5 stones correctly, switching player", () => {
    const previousState = {
      pits: [5, 0, 1, 1, 2, 0, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [1, 1, 2, 2, 3, 0, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 1,
    };

    const result = makeMove(previousState, 0);

    expect(result).toEqual(expectedState);
  });
  it("should distribute 6 stones correctly, then capture the opponent's stones, switching player", () => {
    const previousState = {
      pits: [6, 0, 1, 1, 2, 0, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [1, 1, 2, 2, 3, 0, 0, 4, 4, 4, 2, 0],
      stores: [5, 0],
      currentPlayer: 1,
    };

    const result = makeMove(previousState, 0);

    expect(result).toEqual(expectedState);
  });
  it("should distribute 7 stones correctly ending in own store, keeping player", () => {
    const previousState = {
      pits: [7, 0, 1, 1, 2, 0, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [1, 1, 2, 2, 3, 1, 4, 4, 4, 4, 2, 0],
      stores: [1, 0],
      currentPlayer: 0,
    };

    const result = makeMove(previousState, 0);

    expect(result).toEqual(expectedState);
  });
  it("should distribute 2 stones correctly on 4th pit, capturing opponent's stones, switching player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 0, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [2, 1, 1, 1, 1, 0, 0, 4, 4, 4, 2, 0],
      stores: [5, 0],
      currentPlayer: 1,
    };

    const result = makeMove(previousState, 4);

    expect(result).toEqual(expectedState);
  });
  it("should put the single stone to own store on last pit, keeping player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 1, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [2, 1, 1, 1, 2, 0, 4, 4, 4, 4, 2, 0],
      stores: [1, 0],
      currentPlayer: 0,
    };

    const result = makeMove(previousState, 5);

    expect(result).toEqual(expectedState);
  });
  it("should put one of the 2 stones to own store on last pit, keeping player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 2, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [2, 1, 1, 1, 2, 1, 4, 4, 4, 4, 2, 0],
      stores: [1, 0],
      currentPlayer: 0,
    };

    const result = makeMove(previousState, 5);

    expect(result).toEqual(expectedState);
  });
  it("should distribute 8 stones correctly on last pit, adding one to own store, switching player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 8, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [2, 1, 1, 1, 2, 1, 5, 5, 5, 5, 3, 1],
      stores: [1, 0],
      currentPlayer: 1,
    };

    const result = makeMove(previousState, 5);

    expect(result).toEqual(expectedState);
  });
  it("should distribute 9 stones correctly on last pit, adding one to own store, skipping other store, switching player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 9, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [3, 1, 1, 1, 2, 1, 5, 5, 5, 5, 3, 1],
      stores: [1, 0],
      currentPlayer: 1,
    };

    const result = makeMove(previousState, 5);

    expect(result).toEqual(expectedState);
  });
  it("should distribute 16 stones correctly on last pit, adding 2 to own store, skipping other store, switching player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 16, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 0,
    };

    const expectedState = {
      pits: [3, 2, 2, 2, 3, 2, 6, 5, 5, 5, 3, 1],
      stores: [2, 0],
      currentPlayer: 1,
    };

    const result = makeMove(previousState, 5);

    expect(result).toEqual(expectedState);
  });
  it("should distribute 2 stones correctly on 10th pit, capturing opponent's stones, switching player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 0, 4, 4, 4, 4, 2, 0],
      stores: [0, 0],
      currentPlayer: 1,
    };

    const expectedState = {
      pits: [0, 1, 1, 1, 2, 0, 4, 4, 4, 4, 1, 0],
      stores: [0, 3],
      currentPlayer: 0,
    };

    const result = makeMove(previousState, 10);

    expect(result).toEqual(expectedState);
  });
  it("should put the single stone to own store on last pit, keeping player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 1, 4, 4, 4, 4, 2, 1],
      stores: [0, 0],
      currentPlayer: 1,
    };

    const expectedState = {
      pits: [2, 1, 1, 1, 2, 1, 4, 4, 4, 4, 2, 0],
      stores: [0, 1],
      currentPlayer: 1,
    };

    const result = makeMove(previousState, 11);

    expect(result).toEqual(expectedState);
  });
  it("should put one of the two stones to own store on last pit, keeping player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 1, 4, 4, 4, 4, 2, 2],
      stores: [0, 0],
      currentPlayer: 1,
    };

    const expectedState = {
      pits: [2, 1, 1, 1, 2, 1, 4, 4, 4, 4, 2, 1],
      stores: [0, 1],
      currentPlayer: 1,
    };

    const result = makeMove(previousState, 11);

    expect(result).toEqual(expectedState);
  });
  it("should distribuete 9 stones correctly, skipping the opponent's store, switching player", () => {
    const previousState = {
      pits: [2, 1, 1, 1, 2, 1, 4, 4, 4, 4, 2, 9],
      stores: [0, 0],
      currentPlayer: 1,
    };

    const expectedState = {
      pits: [3, 2, 2, 2, 3, 2, 5, 4, 4, 4, 2, 1],
      stores: [0, 1],
      currentPlayer: 0,
    };

    const result = makeMove(previousState, 11);

    expect(result).toEqual(expectedState);
  });
  it("should player 1 win the game", () => {
    const previousState = {
      pits: [0, 0, 0, 0, 0, 1, 4, 4, 4, 4, 2, 0],
      stores: [24, 5],
      currentPlayer: 0,
      winner: null,
    };

    const expectedState = {
      pits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      stores: [25, 23],
      currentPlayer: 0,
      winner: 1,
    };

    const result = makeMove(previousState, 5);

    expect(result).toEqual(expectedState);
  });
  it("should player 1 win the game on tie", () => {
    const previousState = {
      pits: [0, 0, 0, 0, 0, 1, 4, 4, 4, 4, 2, 0],
      stores: [23, 6],
      currentPlayer: 0,
      winner: null,
    };

    const expectedState = {
      pits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      stores: [24, 24],
      currentPlayer: 0,
      winner: 1,
    };

    const result = makeMove(previousState, 5);

    expect(result).toEqual(expectedState);
  });
  it("should player 1 win the game on capture", () => {
    const previousState = {
      pits: [0, 0, 0, 0, 1, 0, 4, 4, 4, 4, 2, 0],
      stores: [23, 6],
      currentPlayer: 0,
      winner: null,
    };

    const expectedState = {
      pits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      stores: [28, 20],
      currentPlayer: 0,
      winner: 1,
    };

    const result = makeMove(previousState, 4);

    expect(result).toEqual(expectedState);
  });
  it("should player 2 win the game on tie", () => {
    const previousState = {
      pits: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      stores: [23, 23],
      currentPlayer: 1,
      winner: null,
    };

    const expectedState = {
      pits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      stores: [24, 24],
      currentPlayer: 1,
      winner: 2,
    };

    const result = makeMove(previousState, 11);

    expect(result).toEqual(expectedState);
  });
});
