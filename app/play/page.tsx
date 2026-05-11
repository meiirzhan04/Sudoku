import { SudokuGame } from "@/app/play/sudoku-game";

export default function PlayPage({ searchParams }: { searchParams?: { gameId?: string } }) {
  return (
    <div className="page-shell px-0 sm:px-6 lg:px-8">
      <SudokuGame gameId={searchParams?.gameId} />
    </div>
  );
}
