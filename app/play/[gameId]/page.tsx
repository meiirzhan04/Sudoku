import { SudokuGame } from "@/app/play/sudoku-game";

export default function PlayGamePage({ params }: { params: { gameId: string } }) {
  return (
    <div className="page-shell px-0 sm:px-6 lg:px-8">
      <SudokuGame gameId={params.gameId} />
    </div>
  );
}
