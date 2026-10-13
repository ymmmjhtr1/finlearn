import type { LucideIcon } from "lucide-react";

export interface Course {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  lessons: string[];
  /** 용어사전에 있는 용어 이름 */
  terms: string[];
  action: { label: string; href: string };
}
