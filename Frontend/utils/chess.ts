export const movePiece = (
    board: string[][],
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
) => {
    const newBoard = board.map(row => [...row]);
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = ' ';
    return newBoard;
}