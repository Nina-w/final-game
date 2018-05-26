var timer = 10;
var context = $canvas.getContext('2d');
var gamePieces = {};
var timerInterval = setInterval(function() {
  if(timer === 0) {
    clearInterval(timerInterval);
    circleCount();
  }
  timer--;
}, 1000);
var timerPosition = {x: 10 , y:50};

socket.on('playerUpdate', updatePlayers);

function updatePlayers(players) {
  var playerNames = Object.keys(players);
  playerNames.forEach(function(playerName) {
    if(playerName === user) return;
    if(!gamePieces[playerName]) {
      createNewPlayer(playerName);
    }

    var player = players[playerName];
    var gamePiece = gamePieces[playerName];
    gamePiece.x = player.x;
    gamePiece.y = player.y;
  })

  var gamePiecesNames = Object.keys(gamePieces);
  gamePiecesNames.forEach(function(gamePieceName) {
    if(!players[gamePieceName]) {
      delete gamePieces[gamePieceName];
    };
  });

  console.log(players);
}

function createNewPlayer(playerName) {
  var gamePiece = {loaded: false, x: 0, y: 0};
  gamePiece.avatar = new Image();
  gamePiece.avatar.onload = function() {
    gamePiece.loaded = true;
  }
  gamePiece.avatar.src = '/picture/' + playerName;
  gamePieces[playerName] = gamePiece;
}

function drawGamePiece() {
  var playerNames = Object.keys(gamePieces);
  var pieceWidth = Math.min($canvas.width, $canvas.height)/15;
  playerNames.forEach(function(playerName) {
    var gamePiece = gamePieces[playerName];
    if(!gamePiece.loaded) return;
    context.drawImage(
      gamePiece.avatar
    , gamePiece.x
    , gamePiece.y
    , pieceWidth, pieceWidth
  );
  })
}

function animate() {
  context.clearRect(0, 0, $canvas.width, $canvas.height);
  drawGamePiece();
  context.fillText(`Time: ${timer}`,timerPosition.x, timerPosition.y);
  window.requestAnimationFrame(animate);
}

function updatePlayerPosition(e) {
  var gamePiece = gamePieces[user];
  var speed = 10;
  switch(e.key) {
    case 'ArrowLeft':
      gamePiece.x-= 10;
      break;
    case 'ArrowRight':
      gamePiece.x+= 10;
      break;
    case 'ArrowDown':
      gamePiece.y+= 10;
      break;
    case 'ArrowUp':
      gamePiece.y-= 10;
      break;
    default:
      return;
  }
  socket.emit('playerUpdate', {x: gamePiece.x, y: gamePiece.y});
}

function circleCount() {
  var count = document.querySelectorAll('.circle').length;
  socket.emit('endGame', {count: count, user: user});

}
window.requestAnimationFrame(animate);
createNewPlayer(user);
document.body.addEventListener('keydown', updatePlayerPosition);
