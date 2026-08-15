"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from 'axios'

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FileUpload from "../fileUpload";
import { useRouter } from "next/navigation";

// -----------------------------
// Zod Schema
// -----------------------------

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Server name is required",
  }),

  // Currently optional because FileUpload is commented out.
  // Once FileUpload is working, change this back to:
  // z.string().min(1, { message: "Server image is required" })
  imageUrl: z.string(),
});

// -----------------------------
// Type
// -----------------------------

type FormValues = z.infer<typeof formSchema>;

// -----------------------------
// Component
// -----------------------------

export const InitialModal = () => {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      name: "",
      imageUrl: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  // -----------------------------
  // Submit
  // -----------------------------

  const onSubmit = async (values: FormValues) => {
    try {
      await axios.post("/api/servers", values);
      form.reset();
      router.refresh();

    } catch (error) {
      console.log(error)
    }

  };

  return (
    <Dialog open>
      <DialogContent className="p-0 overflow-hidden">
        {/* -----------------------------
            Header
        ----------------------------- */}

        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Customize your server
          </DialogTitle>

          <DialogDescription className="text-center text-zinc-500 dark:text-zinc-400">
            Give your server a personality with a name and an image. You can
            always change it later.
          </DialogDescription>
        </DialogHeader>

        {/* -----------------------------
            Form
        ----------------------------- */}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className=" px-6">

            {/* -----------------------------
                Server Image
            ----------------------------- */}

            <div className="flex items-center justify-center text-center">
              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FileUpload
                        endpoint="serverImage"
                        value={field.value}
                        onChange={field.onChange}
                      />

                    </FieldContent>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* -----------------------------
                Server Name
            ----------------------------- */}

            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    Server Name
                  </FieldLabel>

                  <FieldContent>
                    <Input
                      {...field}
                      disabled={isLoading}
                      placeholder="Enter server name"
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
                    />
                  </FieldContent>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          {/* -----------------------------
              Footer
          ----------------------------- */}

          <DialogFooter className="bg-gray-100 dark:bg-zinc-800 px-6 py-4">
            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};