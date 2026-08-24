"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { FileIcon, X } from "lucide-react";
import Image from "next/image";

interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: "messageFile" | "serverImage";
}

const FileUpload = ({ onChange, value, endpoint }: FileUploadProps) => {
  const fileType = value?.split(".").pop()?.toLowerCase();

  // Server icon upload (circular preview)
  if (value && fileType !== "pdf" && endpoint === "serverImage") {
    return (
      <div className="flex justify-center items-center">
        <div className="relative w-20 h-20">
          <Image
            fill
            src={value}
            alt="Upload"
            className="rounded-full object-cover"
          />
          <button
            onClick={() => onChange("")}
            className="absolute top-0 right-0 bg-rose-500 text-white rounded-full p-1 cursor-pointer hover:bg-rose-600 shadow-sm"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Chat message image upload (rectangular preview)
  if (value && fileType !== "pdf" && endpoint === "messageFile") {
    return (
      <div className="flex justify-center items-center w-full">
        <div className="relative w-full max-w-[340px] h-52 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-sm flex items-center justify-center">
          <Image
            fill
            src={value}
            alt="Message attachment"
            className="object-contain p-1"
          />
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-rose-600 shadow-md transition z-10"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Chat message PDF upload
  if (value && fileType === "pdf") {
    return (
      <div className="relative flex items-center p-3 mt-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 w-full max-w-[340px] mx-auto">
        <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-500 shrink-0" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-3 text-sm text-indigo-500 dark:text-indigo-400 hover:underline truncate flex-1 font-medium"
        >
          {value.split("/").pop() || "PDF File"}
        </a>
        <button
          onClick={() => onChange("")}
          className="bg-rose-500 text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-rose-600 transition shrink-0 ml-2"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        if (res?.[0]?.url) {
          onChange(res[0].url);
        }
      }}
      onUploadError={(error: Error) => {
        console.error("[UPLOADTHING_ERROR]", error);
      }}
    />
  );
};

export default FileUpload;