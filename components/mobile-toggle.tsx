import React from "react";
import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";
import ServerSidebar from "./server/server-sidebar";

export function MobileToggle({ serverId }: { serverId: string }) {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full max-w-[312px] p-0 flex-row gap-0 overflow-hidden sm:max-w-[312px]"
      >
        <div className="flex h-full w-[72px] shrink-0">
          <NavigationSidebar />
        </div>
        <div className="flex h-full min-h-0 min-w-0 flex-1">
          <ServerSidebar serverId={serverId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}