"use client";

import { cn } from "@/lib/utils";
import { ActionTooltip } from "../action-tooltip";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

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
  };

  const isActive = params?.serverId === id;

  return (
    <div className="relative group flex items-center mb-4">
      {/* Active / Hover Indicator */}
      <div
        className={cn(
          "absolute left-0 bg-primary rounded-r-full transition-all w-[4px]",
          isActive ? "h-[36px]" : "h-[8px] group-hover:h-[20px]"
        )}
      />

      <ActionTooltip side="right" align="center" label={name}>
        <div
          onClick={handleClick}
          className={cn(
            "relative group flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden",
            isActive && "bg-primary/10 text-primary rounded-[16px]"
          )}
        >
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
      </ActionTooltip>
    </div>
  );
};