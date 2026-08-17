"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import qs from "query-string";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { ChannelType } from "@/generated/prisma/enums";

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Channel name is required." })
    .refine((name) => name !== "general", {
      message: "Channel name cannot be 'general'"
    }),
  type: z.enum(ChannelType)
});

export function EditChannelModal() {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();

  const isModalOpen = isOpen && type === "editChannel";
  const { channel, server } = data;
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: channel?.type || ChannelType.TEXT
    }
  });

  useEffect(() => {
    if (channel) {
      form.setValue("name", channel.name);
      form.setValue("type", channel.type as ChannelType);
    }
  }, [channel, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `/api/channels/${channel?.id}`,
        query: { serverId: server?.id }
      });

      await axios.patch(url, values);

      form.reset();
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Edit Channel
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-8 px-6">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    Channel Name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      disabled={isLoading}
                      placeholder="Enter channel name"
                      className="
                        bg-zinc-300/50
                        dark:bg-zinc-700/50
                        border
                        border-transparent
                        focus-visible:border-black
                        dark:focus-visible:border-white
                        focus-visible:ring-0
                        text-black
                        dark:text-white
                        placeholder:text-zinc-500
                        dark:placeholder:text-zinc-400
                      "
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                  </FieldContent>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    Channel Type
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="bg-zinc-300/50 dark:bg-zinc-700/50 border-0 focus:ring-0 text-black dark:text-white ring-offset-0 focus:ring-offset-0 capitalize outline-none">
                        <SelectValue placeholder="Select a channel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ChannelType).map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            className="capitalize"
                          >
                            {type.toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <DialogFooter className="bg-gray-100 dark:bg-zinc-800 px-6 py-4">
            <Button
              disabled={isLoading}
              type="submit"
              variant="primary"
              className={"mb-2 "}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
