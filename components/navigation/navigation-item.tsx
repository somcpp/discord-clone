"use client"

import { cn } from "@/lib/utils";
import { ActionTooltip } from "../action-tooltip";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface NavigationItemProps {
  id: string;
  imageUrl: string;
  name: string;
}

export const NavigationItem = ({
  id,
  imageUrl,
  name
}: NavigationItemProps) => {

  const params = useParams();
  const router = useRouter();
  
  const handleClick = () => {
    router.push(`/servers/${id}`);
  }

  return (
    <div className="relative">

      <ActionTooltip side="right" align="center" label={name}>

        {/* Active indicator */}
        <div

          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-[4px] bg-primary rounded-r-full transition-all",
            params?.serverId === id ? "h-[36px]" : "h-0"
          )}
        />

        {/* Image */}
        <div 
        onClick={handleClick}
        className="flex items-center justify-center mx-1 h-[48px] w-[48px]">
          <Image
            src={imageUrl}
            alt={name}
            width={40}
            height={30}
            className="rounded-full object-cover"
          />
        </div>

      </ActionTooltip>

    </div>
  );
};