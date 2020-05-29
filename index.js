let logger = () => {}

const log = msg => {
    const ts = new Date()
    logger(`${ts.getFullYear()}${ts.getMonth()}${ts.getDate()}-${ts.getHours()}:${ts.getMinutes()}:${ts.getSeconds()} | ${msg}`)
}

const createEmptyArray = () => [null, null, null]

const createEmptyBoard = () => createEmptyArray().map(_ => createEmptyArray())

const count = (board, side) => {
    return board.reduce((total, row) => {
        return total += 
            row.reduce((totalInRow, col) => 
                totalInRow += col === side? 1 : 0, 0)
    }, 0)
}

const nextTurn = board => {
    return count(board, 'x') === count(board, 'o') ? 'x' : 'o'
}

const verifyMove = (board, {side, col, row}) => {
    if (row === undefined || row < 0 || row > 2) throw `Illegal row ${row}`
    if (col === undefined || col < 0 || col > 2) throw `Illegal col ${col}`
    if (side !== 'x' && side !== 'o') throw 'Side can only be x or o'
    if (board[row][col] !== null) throw 'Illegal move: cell is already filled'
    if (nextTurn(board) !== side) throw `Illegal move: ${nextTurn(board)}'s turn`
    if (hasWinner(board)) throw 'Illegal move: game is ended'

    return board
}

const updateBoard = (board, {side, col, row}) => {
    return board.map((r, rowIndex) => {
        return rowIndex === row
            ? r.map((c, colIndex) => {
                return colIndex === col ? side : c
            })
            : r
    })
}

const getRow = (board, row) => board[row].map((side, col) => {
    return { side, col, row, name: `row:${row}` }
})

const getCol = (board, col) => board.map((rowContent, row) => {
    return { side: rowContent[col], col, row, name: `col:${col}` }
})

const getCross = (board, isFirst) => {
    return board.map((rowContent, row) => {
        const col = isFirst ? row : 2 - row
        const side = rowContent[col]
        return { side, row, col, name:`cross:${isFirst?0:1}` }
    })
}

const getAllLines = board => {
    return [
        getRow(board, 0),
        getRow(board, 1),
        getRow(board, 2),
        getCol(board, 0),
        getCol(board, 1),
        getCol(board, 2),
        getCross(board, true),
        getCross(board, false)
    ]
}

const isWinner = line => {
    const print = line
        .map(l => l.side)
        .reduce((all, side) => all += side, '')
    return print === 'xxx' || print === 'ooo'
}

const hasWinner = board => 
    getAllLines(board).filter(l => isWinner(l)).length > 0

const getAllCells = board => {
    const all = []
    for(let row=0; row<3; row++) {
        for(let col=0; col<3; col++) {
            all.push({side: board[row][col], row, col})
        }
    }
    return all
}

const getEmptyCells = board => getAllCells(board).filter(c => c.side === null)

const getWinner = board =>  {
    const winners = getAllLines(board)
        .filter(l => isWinner(l))

    if (winners > 1) throw 'Invalid board, 2 winning lines found'

    return winners.length === 1
        ? { side: winners[0][0].side, line: winners[0] }
        : undefined
}

const pickOne = array => {
    if (!array || array.length === 0) return undefined
    const idx = Math.round(Math.random() * (array.length-1))
    return array[idx]
}

const getMovesToWin = (board, side) => getEmptyCells(board)
    .map(move => {
        return {...move, ...{side}}
    })
    .filter(move => {
        return getWinner(updateBoard(board, move)) !== undefined
    })

const getMoveToWin = (board, side) => {
    const move = pickOne(getMovesToWin(board,side))
    return move
}

const getMoveToBlock = (board, side) => {
    const otherSide = side === 'x' ? 'o' : 'x'
    const otherSidesMoveToWin = getMoveToWin(board, otherSide)
    return otherSidesMoveToWin 
        ? {...otherSidesMoveToWin, ...{side}}
        : undefined
}

const combinationsOfTwo = array => {
    const combinations = []
    for (let i=0; i<array.length-1; i++) {
        for (let j=i+1; j<array.length; j++) {
            combinations.push([
                array[i],
                array[j]
            ])
        }
    }
    return combinations
}

const getAllTwoEmpties = board => {
    const empties = getEmptyCells(board)
    return combinationsOfTwo(empties)
}

const getDistance = (board, moves) => {
    if (Array.isArray(moves)) {
        return getDistance(updateBoard(board, moves[0]), moves[1])
        + getDistance(updateBoard(board, moves[1]), moves[0])
    }

    const move = moves
    return getAllCells(board).filter(c => c.side === move.side)
        .reduce((total, cell) => {
            const dr = cell.row - move.row
            const dc = cell.col - move.col
            return total + Math.sqrt( dr * dr + dc * dc )
        }, 0)
}
const isEdge = cell => {
    return (cell.row === 1 && cell.col !== 1)
        || (cell.row !== 1 && cell.col === 1)
}

const getMoveToCorner = (board, side) => {
    
    const isCorner = ({row, col}) =>
        row !== 1 && col !== 1 

    const corners = getEmptyCells(board)
        .filter(isCorner)
        .map(m => {
            return {
                ...m, ...{side}
            }
        })

    const cornerToWin = corners
        .filter(m => getMoveToWin(updateBoard(board, m), side) !== undefined)

    return cornerToWin.length > 0 ? pickOne(cornerToWin) : pickOne(corners)
}

const getMoveAvoidCenter = (board, side) => {
    const center = getEmptyCells(board)
        .filter(c => c.row === 1 && c.col === 1)
        .map(m => {
            return {
                ...m, ...{side}
            }
        })

    const notCenter = getEmptyCells(board)
        .filter(c => c.row !== 1 || c.col !== 1)
        .map(m => {
            return {
                ...m, ...{side}
            }
        })

    if (notCenter.length > 0) return pickOne(notCenter)
    
    return center.length > 0 ? center[0] : undefined
}

const hasConfidence = (board, side) => getMovesToWin(board, side).length > 1

const getMoveToConfidence = (board, side) => {
    if (hasConfidence(board, side)) return []

    const candidates = getEmptyCells(board)
        .map(cell => {
            return { ...cell, ...{side} }
        })
        .filter(move => {
            const hypoBoard = updateBoard(board, move)
            return hasConfidence(hypoBoard, side)
        })
    return pickOne(candidates)
}

const getMoveTwoStepsConfidence = (board, side) => {
    const pairs = getAllTwoEmpties(board)
        .map(([cell1, cell2]) => {
            const move1 = { ...cell1, ...{side}}
            const move2 = { ...cell2, ...{side}}
            return [move1, move2]
        })
        .filter(([move1, move2]) => {
            const hypoBoard = updateBoard(updateBoard(board, move1), move2)
            return hasConfidence(hypoBoard, side)
        })
        .map(([move1, move2]) => {
            if (getMovesToWin(updateBoard(board, move1), side).length === 0) return move1
            if (getMovesToWin(updateBoard(board, move2), side).length === 0) return move2
        })
        .filter(m => m !== undefined)

    return pickOne(pairs)
}

const isCorner = cell => cell.row !== 1 && cell.col !== 1

const getMoveSecondStep = (board, side) => {
    const occupiedCells = getAllCells(board).filter(x => x.side !== null)

    const onlyOccupiedCell = occupiedCells.length === 1 ? occupiedCells[0] : undefined

    if (onlyOccupiedCell) {
        if (isEdge(onlyOccupiedCell)) return { side, col: 1, row: 1}
        if (isCorner(onlyOccupiedCell)) return {
            side,
            col: onlyOccupiedCell.col === 2 ? 0 : 2,
            row: onlyOccupiedCell.row === 2 ? 0 : 2
        }
    }
}

const calculateMove = board => {
    if (hasWinner(board)) return undefined
    const side = nextTurn(board)
    const otherSide = side === 'x' ? 'o' : 'x'

    log(`Calculating move for ${side}`)

    let move = getMoveToCorner(board, side)

    if (getEmptyCells(board).length === 9) {
        log(`Empty board, get corner for ${side}: ${JSON.stringify(move)}`)
        return move
    }

    move = getMoveSecondStep(board, side)
    if (move) {
        log(`Found second move strategy for ${side}: ${JSON.stringify(move)}`)
        return move
    }

    move = getMoveToWin(board, side)
    if (move) {
        log(`Found a move to win for ${side}: ${JSON.stringify(move)}`)
        return move
    }

    move = getMoveToBlock(board, side)
    if (move) {
        log(`Found a move to block for ${side}: ${JSON.stringify(move)}`)
        return move
    }

    move = getMoveToConfidence(board, otherSide)
    if (move) {
        move.side = side
        log(`Found a move to couter confidence for ${side}: ${JSON.stringify(move)}`)
        return move
    }

    move = getMoveToConfidence(board, side)
    if (move) {
        log(`Found a move to confidence for ${side}: ${JSON.stringify(move)}`)
        return move
    }

    move = getMoveTwoStepsConfidence(board, side)
    if (move) {
        log(`Found move for 2-step confidence for ${side}: ${JSON.stringify(move)}`)
        return move
    }

    move = getMoveAvoidCenter(board, side)
    if (move) {
        log(`Try avoiding center ${side}: ${JSON.stringify(move)}`)
        return move
    }
}

module.exports = {
    setLogger: customLogger => { logger = customLogger },

    newBoard: setFirstMove => {
        const board = createEmptyBoard()
        return setFirstMove
            ? updateBoard(board, calculateMove(board))
            : board
    },

    draw: board => {
        const drawRow = row => 
            row.reduce((line, i) => line += i ? i : '.', '')
        return board
            .reduce((all, row) => all += drawRow(row) + '\n', '')
    },
    
    setMove: (board, {side, col, row}) => {
        verifyMove(board, {side, col, row})
        return updateBoard(board, {side, col, row})
    },

    setHypotheticalMoves: (board, moves) => {
        return moves
            .reduce((acc, move) => updateBoard(acc, move), board)
    },

    getWinner, 

    isTie: board => getEmptyCells(board).length === 0,

    getPossibleMoves: board => {
        const side = nextTurn(board)
        return getAllCells(board)
            .filter(a => a.side === null)
            .map(cell => { 
                return { side, col: cell.col, row: cell.row}
            })
    },   

    calculateMove
}