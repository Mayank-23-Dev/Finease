import { Wallet } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}
const Logo = ({ className = "", showText = true, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-xl",
    lg: "text-xl"
  };
return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showText && (
        <span className={`font-bold ${sizeClasses[size]} tracking-tight`}>
          Finease
        </span>
      )}
    </div>
  );
};

export default Logo;
