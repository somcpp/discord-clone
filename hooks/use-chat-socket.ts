import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";
import { MessageWithMemberWithProfile } from "@/types";

type ChatSocketProps = {
  addKey: string;
  updateKey: string;
  queryKey: string;
};

export const useChatSocket = ({
  addKey,
  updateKey,
  queryKey,
}: ChatSocketProps) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    // Join the dedicated socket rooms for this channel/conversation
    socket.emit("join-room", addKey);
    if (updateKey !== addKey) {
      socket.emit("join-room", updateKey);
    }

    const handleUpdateMessage = (message: MessageWithMemberWithProfile) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return oldData;
        }

        const newData = oldData.pages.map((page: any) => {
          return {
            ...page,
            items: page.items.map((item: MessageWithMemberWithProfile) => {
              if (item.id === message.id) {
                return message;
              }
              return item;
            }),
          };
        });

        return {
          ...oldData,
          pages: newData,
        };
      });
    };

    const handleAddMessage = (message: MessageWithMemberWithProfile) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [
              {
                items: [message],
              },
            ],
          };
        }

        // Avoid adding duplicate message if already in first page
        const firstPageItems = oldData.pages[0]?.items || [];
        const hasMessage = firstPageItems.some(
          (item: MessageWithMemberWithProfile) => item.id === message.id
        );

        if (hasMessage) {
          return oldData;
        }

        const newData = [...oldData.pages];
        newData[0] = {
          ...newData[0],
          items: [message, ...newData[0].items],
        };

        return {
          ...oldData,
          pages: newData,
        };
      });
    };

    socket.on(updateKey, handleUpdateMessage);
    socket.on(addKey, handleAddMessage);

    return () => {
      socket.off(addKey, handleAddMessage);
      socket.off(updateKey, handleUpdateMessage);
      socket.emit("leave-room", addKey);
      if (updateKey !== addKey) {
        socket.emit("leave-room", updateKey);
      }
    };
  }, [queryClient, addKey, queryKey, socket, updateKey]);
};
