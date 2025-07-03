import Image from "next/image";

const LogoApp = () => {
    return (
        <Image
            src="/logo.svg"
            alt="Music Box Photobooth"
            width={300}
            height={150}
            
            className="glow-image"
        />
    );
};

export default LogoApp;