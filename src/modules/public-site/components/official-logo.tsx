import Image from "next/image";

interface OfficialLogoProps {
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function OfficialLogo({
  alt = "Universal Academy of Columbus official logo",
  className = "",
  priority = false,
  sizes = "64px",
}: OfficialLogoProps) {
  return (
    <span className={`official-logo ${className}`.trim()}>
      <Image
        alt={alt}
        className="official-logo-image"
        height={900}
        priority={priority}
        sizes={sizes}
        src="/brand/uac-official-logo.png"
        width={1600}
      />
    </span>
  );
}
