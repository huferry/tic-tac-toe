const game = require('./index')

game.setLogger((log) => console.log(log))

let board = game.newBoard()
let winner = undefined

console.log(game.draw(board))

while (!winner) {
    const move = game.calculateMove(board)
    console.log('move', move)

    if (!move) break

    board = game.setMove(board, move)
    console.log(game.draw(board))
    winner = game.getWinner(board)
    
}

console.log('winner', winner)
