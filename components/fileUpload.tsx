"use client"

import { UploadDropzone } from "@/lib/uploadthing";
import { X } from "lucide-react";
import Image from "next/image";


interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: "messageFile" | "serverImage";
}

const FileUpload = ({onChange, value, endpoint}: FileUploadProps) => {
  const fileType = value?.split(".").pop();

  if(value && fileType !== "pdf") {
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
      className="absolute top-0 right-0 bg-rose-500 text-white rounded-full p-1 cursor-pointer hover:bg-rose-600"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
</div>
    )
  }

  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        console.log("Files: ", res);
        if (res?.[0]) {
      onChange(res[0].url);
    }
      }}
      onUploadError={(error) => {
        console.log(error);
      }}
    />
  )
}

export default FileUpload