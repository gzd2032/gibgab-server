const GAME = {
  END:"game end",
  TICK:"game tick",
  RESET:"game reset",
  START:"game start",
  SPEED:"game speed",
  SUBMESSAGE:"game submessage",
  READY:"game ready",
  PENDING:"game pending",
  PLAYERS:"players",
  SPECTATORS:"spectators",
}

const SPEED = {
  "high": 300,
  "med": 600,
  "low": 1000
}

function createGame(socket, db) {
  let boardSize = 0;
  let counter = 0;
  let playing = false;
  let gameTimer = null;
  let direction = true;
  let turn = 0;
  let players = [];
  let spectators = [];
  let gameSpeed = SPEED["med"];
  function setBoardSize(size) {
    if (typeof size === "number") boardSize = size;
    return boardSize === size;
  }
  function countdown() {
    if (direction) {
      counter++;
    } else {
      counter--;
    }
    if (Math.abs(counter) > boardSize) {
      resetCounter();
      socket.emit(GAME.END, `${players[1 - turn].name} wins!`);
      socket.emit(GAME.SUBMESSAGE, `reset or swap out player`)
      return
    }
    socket.emit(GAME.TICK, counter);
  }
  function removePlayer(idx) {
    players = players.filter((player) => player.id !== idx);

    return players;
  }
  function removeSpectator(idx) {
    spectators = spectators.filter((player) => player.id !== idx);

    return spectators;
  }
  function findUser(username) {
    return (
      players.find((player) => player.name === username) ||
      spectators.find((player) => player.name === username)
    );
  }
  function resetCounter() {
    clearInterval(gameTimer);
    direction = true;
    counter = 0;
    playing = false;
    gameTimer = null;
    socket.emit(GAME.RESET);
  }
  function addPlayer(player) {
    return players.push(player);
  }
  function addSpectator(player) {
    return spectators.push(player);
  }
  function getSpectators() {
    return spectators;
  }
  function startGame(user) {
    resetCounter();
    turn = 1 - players.map((player) => player.name).indexOf(user);
    direction = turn ? true : false;
    socket.emit(GAME.START, "Go!");
    socket.emit(GAME.SUBMESSAGE, `${players[turn]?.name}`);
    playing = true;
    gameTimer = setInterval(countdown, gameSpeed);
  }
  function getPlayers() {
    return players;
  }
  function sendReady() {
    socket.emit(GAME.READY, "ready");
  }
  function sendPending() {
    socket.emit(GAME.PENDING, "pending");
  }
  function changeDirection() {
    if (!playing) return;
    direction = !direction;
    turn = 1 - turn;
    socket.emit(GAME.SUBMESSAGE, `${players[turn].name}`);
  }
  function sendListOfUsers() {
    socket.emit(GAME.PLAYERS, players);
    socket.emit(GAME.SPECTATORS, spectators);
  }
  function resetUsers(){
    players = [];
    spectators = []
  }
  function getCategory () {
    const number = Math.floor(Math.random() * (db.categories.length - 1) )
    socket.emit("category", db.categories[number]); 
  }
  function changeGameSpeed (newspeed) {
    gameSpeed = SPEED[newspeed]
    socket.emit(GAME.SPEED, newspeed)
  }
  function swapPlayer(newPlayer, currentPlayer) {
    const spectatorToPlayer = findUser(newPlayer);
    const playerToSpectator = findUser(currentPlayer);
    removePlayer(playerToSpectator.id);
    removeSpectator(spectatorToPlayer.id);
    addSpectator(playerToSpectator);
    addPlayer(spectatorToPlayer);
    sendListOfUsers();
    resetCounter();
  }

  return {
    players,
    spectators,
    addPlayer,
    startGame,
    changeDirection,
    setBoardSize,
    findUser,
    sendReady,
    sendPending,
    resetCounter,
    resetUsers,
    getPlayers,
    getSpectators,
    changeGameSpeed,
    addSpectator,
    removePlayer,
    getCategory,
    removeSpectator,
    sendListOfUsers,
    swapPlayer,
  };
}

module.exports = createGame;
