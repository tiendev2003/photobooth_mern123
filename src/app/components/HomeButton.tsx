import { useBooth } from "@/lib/context/BoothContext";
import { HomeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
interface HomeButtonProps {
    onClick?: () => void;
    disabled?: boolean;
}


const HomeButton = ({ onClick, disabled = false }: HomeButtonProps) => {
    const router = useRouter();
    const { clearAllBoothData } = useBooth();

    return (
        <button
            onClick={
                onClick ? onClick : () => {
                    clearAllBoothData();
                    router.push("/");
                }
            }
            disabled={disabled}
            className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center"
        >
            <HomeIcon className="w-14 h-14" />
        </button>
    );
}
export default HomeButton;