"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ACCEPTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

type ImageDimensions = {
  width: number;
  height: number;
};

type UploadedImage = {
  file: File;
  previewUrl: string;
  dimensions: ImageDimensions | null;
};

function isAcceptedImage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  return (
    ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]) ||
    ACCEPTED_IMAGE_EXTENSIONS.includes(extension as (typeof ACCEPTED_IMAGE_EXTENSIONS)[number])
  );
}

export function ImageUploader() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (uploadedImage?.previewUrl) {
        URL.revokeObjectURL(uploadedImage.previewUrl);
      }
    };
  }, [uploadedImage?.previewUrl]);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function resetFileInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removeImage() {
    setError(null);
    setUploadedImage(null);
    resetFileInput();
  }

  function handleFile(file: File | undefined) {
    setError(null);

    if (!file) {
      return;
    }

    if (!isAcceptedImage(file)) {
      setError("Please upload a JPG, JPEG, PNG, or WebP image.");
      resetFileInput();
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Please upload an image that is 10MB or smaller.");
      resetFileInput();
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setUploadedImage({ file, previewUrl, dimensions: null });

    const image = new window.Image();
    image.onload = () => {
      setUploadedImage((currentImage) =>
        currentImage?.previewUrl === previewUrl
          ? {
              ...currentImage,
              dimensions: {
                width: image.naturalWidth,
                height: image.naturalHeight,
              },
            }
          : currentImage,
      );
    };
    image.src = previewUrl;
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        id={inputId}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {uploadedImage ? (
        <div className="space-y-4 rounded-[1.5rem] border bg-background/85 p-4 shadow-inner">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border bg-muted">
            <Image
              src={uploadedImage.previewUrl}
              alt={`Preview of ${uploadedImage.file.name}`}
              fill
              className="object-contain"
              sizes="(min-width: 768px) 35rem, 90vw"
              unoptimized
            />
          </div>

          <dl className="grid gap-3 rounded-2xl bg-muted/70 p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-medium text-muted-foreground">Filename</dt>
              <dd className="mt-1 break-words font-semibold text-foreground">{uploadedImage.file.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Dimensions</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {uploadedImage.dimensions
                  ? `${uploadedImage.dimensions.width} × ${uploadedImage.dimensions.height}px`
                  : "Reading..."}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">File size</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatFileSize(uploadedImage.file.size)}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="w-full sm:w-auto" onClick={openFilePicker}>
              Replace image
            </Button>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={removeImage}>
              Remove image
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "flex aspect-[4/3] cursor-pointer items-center justify-center rounded-[1.25rem] border border-dashed bg-background/80 p-6 text-center transition-colors focus-within:ring-2 focus-within:ring-primary",
            isDragging && "border-primary bg-primary/10",
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFile(event.dataTransfer.files[0]);
          }}
        >
          <span className="max-w-xs space-y-4">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
              📷
            </span>
            <span className="block font-semibold text-foreground">Drag and drop a food image here</span>
            <span className="block text-sm leading-6 text-muted-foreground">
              or click to upload a JPG, JPEG, PNG, or WebP image up to 10MB.
            </span>
          </span>
        </label>
      )}

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
