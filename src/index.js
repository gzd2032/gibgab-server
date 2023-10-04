const express = require("express");
const createGame = require("./game.js");
const { Server } = require("socket.io");
const categories = require('./categories.js')
const SPEED = 250;
const PORT = process.env.PORT || 8000;
const app = express();

app.get("/", (req, res) => {
  res.send("Server is up");
});

const server = app.listen(PORT, () =>
  console.log(`Server is listening on port ${PORT}`)
);

const socket = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? "https://gibgab.onrender.com" : "*",
  },
});

const game = createGame(socket, SPEED, categories);

const createUser = (name, id) => {
  return {
    name,
    id,
  }
}

socket.on("connection", (io) => {
  console.log(io.id + " Connected");
  io.on("disconnecting", () => {
    console.log(io.id + " Disconnected");
    const players = game.removePlayer(io.id);
    const spectators = game.removeSpectator(io.id);
    if (socket.engine.clientsCount > 0) {
      game.sendUsers();
    }
  });
  io.on("join user", (username) => {
    const players = game.getPlayers();
    const newUser = createUser(username, io.id);
    console.log(`${username} has joined`);
    const isExistingPlayer = game.findUser(username);

    if (isExistingPlayer) return

    if (players.length < 2) {
      game.addPlayer(newUser);
      game.sendPending();
    } else {
      game.addSpectator(newUser);
    }
    
    if (players.length === 2) {
      game.sendReady();
    }
    
    game.sendUsers();

  });

  io.on("game start", (user, BOARDSIZE) => {
    if (game.setBoardSize(BOARDSIZE)) {
      game.startGame(user);
    } else {
      socket.emit("game", "error setting boardsize");
    }
  });

  io.on("game reset", () => {
    game.resetCounter();
  });

  io.on("turn", () => {
    game.changeDirection();
  });
  
  io.on("game category", () => {
    game.getCategory();
  });

  io.on("swap", (newPlayerName, currentPlayerName) => {
    console.log(newPlayerName, currentPlayerName)
    game.swapPlayer(newPlayerName, currentPlayerName);
  });
});
