export interface Question {
  id: string;
  kind: "OX" | "객관식";
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}
