import { Metadata } from "next";
import { BattleClient } from "./battle-client";

export const metadata: Metadata = {
  title: "Sudoku Battle | SudokuMind",
  description: "Race friends on the same Sudoku puzzle with live progress, lobby, results and rematches."
};

export default function BattlePage() {
  return <BattleClient />;
}
