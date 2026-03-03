import logo from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const Logo = ({
  className = "",
  showText = true,
  size = "md",
}: LogoProps) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-10",
    lg: "h-14",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>

      {/* Logo Image */}
      <img
        src={logo}
        alt="Finease Logo"
        className={`${sizeClasses[size]} w-auto object-contain dark:invert`}
      />

      {/* Text */}
      {showText && (
        <span
          className={`font-bold tracking-[-0.03em] text-black dark:text-white ${textSizeClasses[size]}`}
        >
          Fin<span className="font-semibold opacity-60">Ease</span>
        </span>
      )}
    </div>
  );
};

export default Logo;