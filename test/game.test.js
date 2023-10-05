const createGame = require("../src/game.js");
const db = require("../src/categories.js")

describe("game countdown functions", () => {
  let game;
  const user1 = {
    name: "john",
    id: "12d2w2",
  };
  const user2 = {
    name: "bill",
    id: "efe33",
  };
  it("should start the game", (done) => {
    let socket = {
      emit: jest.fn((arg1, arg2) => {
        if (arg1 === "game end") done();
      }),
    };

    jest.useFakeTimers();
    jest.spyOn(global, "setInterval");

    // Fast-forward until all timers have been executed

    game = createGame(socket, 100);
    game.addPlayer(user1);
    game.addPlayer(user2);
    game.startGame("john");
    jest.runAllTimers();

    expect(socket.emit).toHaveBeenNthCalledWith(1, "game reset");
    expect(socket.emit).toHaveBeenNthCalledWith(2, "game start", "Go!");
  });

  it("should set the boardsize", () => {
    const BOARDSIZE = 4;
    const errorBoard = "error"
    game = createGame(null, 100);

    const result = game.setBoardSize(BOARDSIZE);
    expect(result).toBe(true);
    const errorSize = game.setBoardSize(errorBoard);
    expect(errorSize).toBe(false);

  });

  it("should change turns and display other users name", (done) => {
    let socket = {
      emit: jest.fn((arg1, arg2) => {
        if (arg1 === "game end") done();
      }),
    };

    jest.useFakeTimers();
    jest.spyOn(global, "setInterval");

    // Fast-forward until all timers have been executed

    game = createGame(socket, 100, db);
    game.changeDirection();
    expect(socket.emit).not.toHaveBeenCalled();

    game.addPlayer(user1);
    game.addPlayer(user2);
    game.startGame("john");
    game.changeDirection();
    jest.runAllTimers();

    expect(socket.emit).toHaveBeenNthCalledWith(1, "game reset");
    expect(socket.emit).toHaveBeenNthCalledWith(2, "game start", "Go!");
    expect(socket.emit).toHaveBeenNthCalledWith(3, "game submessage", "bill");
    expect(socket.emit).toHaveBeenNthCalledWith(4, "game submessage", "john");
    expect(socket.emit).toHaveBeenNthCalledWith(5, "game reset");
    expect(socket.emit).toHaveBeenLastCalledWith("game end", "bill wins!");
  });

  it("should return the list of players", () => {
    game = createGame(null);
    game.addPlayer(user1);
    game.addPlayer(user2);
    const players = game.getPlayers();
    expect(players.length).toBe(2);
    expect(players[0]).toEqual(user1);
    expect(players[1]).toEqual(user2);
  });

  it("should reset the list of players", () => {
    game = createGame(null);
    game.addPlayer(user1);
    game.addPlayer(user2);
    let players = game.getPlayers();
    expect(players.length).toBe(2);
    game.resetUsers();
    players = game.getPlayers();
    expect(players.length).toBe(0);
  });

  it("should remove players from the list of players", () => {
    game = createGame(null);
    game.addPlayer(user1);
    game.addPlayer(user2);
    let players = game.getPlayers();
    expect(players.length).toBe(2);
    game.removePlayer(user1.id)
    players = game.getPlayers();
    expect(players.length).toBe(1);
    game.removePlayer(user2.id)
    players = game.getPlayers();
    expect(players.length).toBe(0);
  });

  it("should return a random category", () => {
    let socket = {
      emit: jest.fn((arg1, arg2) => {
        if (arg1 === "category") {
          expect(db.categories.indexOf(arg2)).toBeGreaterThan(-1);
        };
      }),
    };
    game = createGame(socket, 400, db);
    game.getCategory();
  })

});

