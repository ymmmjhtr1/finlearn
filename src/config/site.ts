import {
  BookOpen,
  Calculator,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export const siteConfig = {
  name: "FinLearn",
  description: "금융이 처음인 사람을 위한 쉽고 친절한 금융 학습 플랫폼",
};

export interface NavItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export const mainNav: NavItem[] = [
  {
    title: "학습",
    href: "/learn",
    description: "저축, 투자, 대출 등 금융 기초를 단계별로 배워요",
    icon: GraduationCap,
  },
  {
    title: "용어사전",
    href: "/glossary",
    description: "어려운 금융 용어를 쉬운 말로 풀어 드려요",
    icon: BookOpen,
  },
  {
    title: "계산기",
    href: "/tools",
    description: "이자, 복리, 대출 상환액을 직접 계산해 봐요",
    icon: Calculator,
  },
];
