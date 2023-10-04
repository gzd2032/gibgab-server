const GAME = {
  END:"game end",
  TICK:"game tick",
  RESET:"game reset",
  START:"game start",
  TURN:"game turn",
  READY:"game ready",
  PENDING:"game pending",
  PLAYERS:"players",
  SPECTATORS:"spectators",
}

function createGame(socket, SPEED, db) {
  let boardSize = 0;
  let counter = 0;
  let playing = false;
  let gameTimer = null;
  let direction = true;
  let turn = 0;
  let players = [];
  let spectators = [];
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
      return socket.emit(GAME.END, `${players[1 - turn].name} wins!`);
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
    socket.emit(GAME.TURN, `${players[turn]?.name}`);
    playing = true;
    gameTimer = setInterval(countdown, SPEED);
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
    socket.emit(GAME.TURN, `${players[turn].name}`);
  }
  function sendUsers() {
    socket.emit(GAME.PLAYERS, players);
    socket.emit(GAME.SPECTATORS, spectators);
  }
  function resetUsers(){
    players = [];
    spectators = []
  }
  function getCategory () {
    const number = Math.floor(Math.random() * (categories.length - 1) )
    return db.categories[number]
  }
  function swapPlayer(newPlayer, currentPlayer) {
    const spectatorToPlayer = findUser(newPlayer);
    const playerToSpectator = findUser(currentPlayer);
    console.log(spectatorToPlayer, playerToSpectator)
    removePlayer(playerToSpectator.id);
    removeSpectator(spectatorToPlayer.id);
    addSpectator(playerToSpectator);
    addPlayer(spectatorToPlayer);

    sendUsers();
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
    addSpectator,
    removePlayer,
    getCategory,
    removeSpectator,
    sendUsers,
    swapPlayer,
  };
}

module.exports = createGame;
