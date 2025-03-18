import React from "react";

type Props = {
    piece: string;
    row: number;
    col: number;
};

const pieceImages: Record<string, string> = {
    'p': '/blackPawn.png',
    'r': '/blackRook.png',
    'n': '/blackHorse.png',
    'b': '/blackBishop.png',
    'q': '/blackQueen.png',
    'k': '/blackKing.png', 
    'P': '/whitePawn.png',
    'R': '/whiteRook.png',
    'N': '/whiteHorse.png',
    'B': '/whiteBishop.png',
    'Q': '/whiteQueen.png',
    'K': '/whiteKing.png',
    ' ': '/empty.png',
}

const ChessPiece = ({piece, row, col}: Props) => {

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('piece', JSON.stringify({row, col}));

        if(e.dataTransfer.setDragImage) {
            const img = new Image();
            img.src = pieceImages[piece];
            e.dataTransfer.setDragImage(img, 35, 35);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center">
            <img
                src={pieceImages[piece]}
                alt={piece}
                className="w-4/5 h-4/5 object-contain"
                draggable
                onDragStart={handleDragStart}
                />
        </div>
    )
}

export default ChessPiece;

