#Tic Tac Toe Engine

```javascript
const game = require('tic-tac-toe')

game.setLogger((log) => console.log(log))

let board = game.newBoard()
let winner = undefined

while (!winner) {
    const move = game.calculateMove(board)
    console.log('move', move)

    if (!move) break

    board = game.setMove(board, move)
    console.log(game.draw(board))
    winner = game.getWinner(board)
}

console.log('winner', winner)

```