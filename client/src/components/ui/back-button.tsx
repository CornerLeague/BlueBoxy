import { ArrowLeft } from "lucide-react";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className = "" }: BackButtonProps) {
  const { goBack } = useNavigationHistory();

  return (
    <ArrowLeft 
      className={`w-5 h-5 p-2 rounded-full bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors ${className}`}
      onClick={goBack}
    />
  );
}