import { HomeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
interface HomeButtonProps {
    onClick?: () => void;
    disabled?: boolean;
}


const HomeButton = ({ onClick, disabled = false }: HomeButtonProps) => {
    const router = useRouter();
    return (
        <button
            onClick={
                onClick ? onClick : () => {
                    router.push("/");
                }
            }
            disabled={disabled}
            className="w-18 h-18 rounded-full border-2 border-white flex items-center justify-center"
        >
            <HomeIcon className="w-10 h-10" />
        </button>
    );
}
export default HomeButton;