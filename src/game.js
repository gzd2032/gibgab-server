function createGame(socket, SPEED) {
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
      socket.emit("game end", `${players[1 - turn].name} wins!`);
    }
    socket.emit("game tick", counter);
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
    socket.emit("game reset");
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
    socket.emit("game start", "Go!");
    socket.emit("game turn", `${players[turn]?.name}`);
    playing = true;
    gameTimer = setInterval(countdown, SPEED);
  }
  function getPlayers() {
    return players;
  }
  function sendReady() {
    socket.emit("game ready", "ready");
  }
  function sendPending() {
    socket.emit("game pending", "pending");
  }
  function changeDirection() {
    if (!playing) return;
    direction = !direction;
    turn = 1 - turn;
    socket.emit("game turn", `${players[turn].name}`);
  }
  function sendUsers() {
    socket.emit("players", players);
    socket.emit("spectators", spectators);
  }
  function swapPlayer(newPlayer, currentPlayer) {
    const spectatorToPlayer = findUser(newPlayer);
    const playerToSpectator = findUser(currentPlayer);
    console.log(spectatorToPlayer, playerToSpectator)
    removePlayer(playerToSpectator.id);
    removeSpectator(spectatorToPlayer.id);
    addSpectator(playerToSpectator);
    addPlayer(spectatorToPlayer);

    socket.emit("players", players);
    socket.emit("spectators", spectators);
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
    getPlayers,
    getSpectators,
    addSpectator,
    removePlayer,
    removeSpectator,
    sendUsers,
    swapPlayer,
  };
}

module.exports = createGame;
