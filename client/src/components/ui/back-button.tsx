import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className = "" }: BackButtonProps) {
  const { goBack } = useNavigationHistory();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={goBack}
      className={`p-2 rounded-full bg-secondary ${className}`}
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
}