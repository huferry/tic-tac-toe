const game = require('./index')

game.setLogger((log) => console.log(log))

let board = game.newBoard()
let winner = undefined

board = game.setHypotheticalMoves(board, [
    { side: 'x', col: 0, row: 2},
    { side: 'x', col: 1, row: 1},
    { side: 'o', col: 2, row: 0},
])

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
