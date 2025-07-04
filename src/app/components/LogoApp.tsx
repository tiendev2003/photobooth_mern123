import Image from "next/image";

const LogoApp = (
    { className = "" }: { className?: string }
) => {
    return (
        <Image
            src="/logo.png"
            alt="Music Box Photobooth"
            width={300}
            height={150}
            className={`glow-image ${className}`}
        />
    );
};

export default LogoApp;