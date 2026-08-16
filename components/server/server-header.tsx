"use client";

import { MemberRole } from "@/generated/prisma/enums";
import { ServerWithMembersWithProfiles } from "@/types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  ChevronDown,
  LogOutIcon,
  PlusCircle,
  Settings,
  Trash,
  UserPlus,
  Users,
} from "lucide-react";

import { useModal } from "@/hooks/use-modal-store";

interface ServerHeaderProps {
  server: ServerWithMembersWithProfiles;
  role?: MemberRole;
}

export function ServerHeader({ server, role }: ServerHeaderProps) {
  const { onOpen } = useModal();

  const isAdmin = role === MemberRole.ADMIN;
  const isModerator = isAdmin || role === MemberRole.MODERATOR;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="
          w-full
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-zinc-500
        "
      >
        <div
          className="
            h-12
            w-full
            px-3
            flex
            items-center
            text-sm
            font-semibold

            bg-white
            dark:bg-zinc-900

            text-zinc-800
            dark:text-zinc-100

            border-b
            border-zinc-200
            dark:border-zinc-800

            hover:bg-zinc-100
            dark:hover:bg-zinc-800/80

            transition-colors
          "
        >
          <span className="truncate">{server.name}</span>

          <ChevronDown
            className="
              h-4
              w-4
              ml-auto
              shrink-0
              text-zinc-500
              dark:text-zinc-400
            "
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="
          w-60
          p-1.5

          bg-white
          dark:bg-zinc-800

          border
          border-zinc-200
          dark:border-zinc-700

          shadow-xl
          dark:shadow-black/40

          rounded-lg

          text-zinc-700
          dark:text-zinc-300
        "
      >
        {isModerator && (
          <DropdownMenuItem
            onClick={() => onOpen("invite", { server })}
            className="
              px-3
              py-2
              rounded-md
              text-sm
              cursor-pointer

              text-indigo-600
              dark:text-indigo-400

              hover:bg-indigo-50
              dark:hover:bg-indigo-500/10

              focus:bg-indigo-50
              dark:focus:bg-indigo-500/10

              focus:text-indigo-600
              dark:focus:text-indigo-400
            "
          >
            <UserPlus className="h-4 w-4 mr-3" />
            Invite People
          </DropdownMenuItem>
        )}

        {isAdmin && (
          <DropdownMenuItem
            onClick={() => onOpen("editServer", { server })}
            className="
              px-3
              py-2
              rounded-md
              text-sm
              cursor-pointer

              hover:bg-zinc-100
              dark:hover:bg-zinc-700

              focus:bg-zinc-100
              dark:focus:bg-zinc-700
            "
          >
            <Settings className="h-4 w-4 mr-3 text-zinc-500 dark:text-zinc-400" />
            Server Settings
          </DropdownMenuItem>
        )}

        {isAdmin && (
          <DropdownMenuItem
            onClick={() => onOpen("members", { server })}
            className="
              px-3
              py-2
              rounded-md
              text-sm
              cursor-pointer

              hover:bg-zinc-100
              dark:hover:bg-zinc-700

              focus:bg-zinc-100
              dark:focus:bg-zinc-700
            "
          >
            <Users className="h-4 w-4 mr-3 text-zinc-500 dark:text-zinc-400" />
            Manage Members
          </DropdownMenuItem>
        )}

        {isModerator && (
          <DropdownMenuItem
            onClick={() => onOpen("createChannel")}
            className="
              px-3
              py-2
              rounded-md
              text-sm
              cursor-pointer

              hover:bg-zinc-100
              dark:hover:bg-zinc-700

              focus:bg-zinc-100
              dark:focus:bg-zinc-700
            "
          >
            <PlusCircle className="h-4 w-4 mr-3 text-zinc-500 dark:text-zinc-400" />
            Create Channel
          </DropdownMenuItem>
        )}

        {isModerator && (
          <DropdownMenuSeparator className="my-1.5 bg-zinc-200 dark:bg-zinc-700" />
        )}

        {isAdmin && (
          <DropdownMenuItem
            // onClick={() => onOpen("deleteServer", { server })}
            className="
              px-3
              py-2
              rounded-md
              text-sm
              cursor-pointer

              text-rose-600
              dark:text-rose-400

              hover:bg-rose-50
              dark:hover:bg-rose-500/10

              focus:bg-rose-50
              dark:focus:bg-rose-500/10

              focus:text-rose-600
              dark:focus:text-rose-400
            "
          >
            <Trash className="h-4 w-4 mr-3" />
            Delete Server
          </DropdownMenuItem>
        )}

        {!isAdmin && (
          <DropdownMenuItem
            // onClick={() => onOpen("leaveServer", { server })}
            className="
              px-3
              py-2
              rounded-md
              text-sm
              cursor-pointer

              text-rose-600
              dark:text-rose-400

              hover:bg-rose-50
              dark:hover:bg-rose-500/10

              focus:bg-rose-50
              dark:focus:bg-rose-500/10

              focus:text-rose-600
              dark:focus:text-rose-400
            "
          >
            <LogOutIcon className="h-4 w-4 mr-3" />
            Leave Server
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}