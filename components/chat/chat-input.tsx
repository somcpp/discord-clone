"use client";

import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import axios from "axios";
import qs from "query-string";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal-store";
import { EmojiPicker } from "@/components/emoji-picker";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
  type: "conversation" | "channel";
}

const formSchema = z.object({
  content: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

export function ChatInput({ apiUrl, query, name, type }: ChatInputProps) {
  const { onOpen } = useModal();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: FormValues) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });

      await axios.post(url, values);

      form.reset();
      router.refresh();
    } catch (error) {
      console.error("[CHAT_INPUT_SUBMIT_ERROR]", error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="relative p-4 pb-6">
        <button
          type="button"
          onClick={() => onOpen("messageFile", { apiUrl, query })}
          className="absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center cursor-pointer z-10"
        >
          <Plus className="text-white dark:text-[#313338] h-4 w-4" />
        </button>
        <Input
          placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
          disabled={isLoading}
          className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
          {...form.register("content")}
        />
        <div className="absolute top-7 right-8 z-10">
          <EmojiPicker
            onChange={(emoji: string) => {
              const current = form.getValues("content") || "";
              form.setValue("content", `${current}${emoji}`);
            }}
          />
        </div>
      </div>
    </form>
  );
}
