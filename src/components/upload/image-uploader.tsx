"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file-utils";
import type { EnrichedFoodAnalysisResult } from "@/lib/food-analysis";
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
  const [analysis, setAnalysis] = useState<EnrichedFoodAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    setAnalysis(null);
    setUploadedImage(null);
    resetFileInput();
  }

  function handleFile(file: File | undefined) {
    setError(null);
    setAnalysis(null);

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

  async function analyzeImage() {
    if (!uploadedImage) {
      return;
    }

    setError(null);
    setAnalysis(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", uploadedImage.file);

      const response = await fetch("/api/foods/analyze", {
        method: "POST",
        body: formData,
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "We could not analyze this image. Please try again.";

        setError(message);
        return;
      }

      setAnalysis(data as EnrichedFoodAnalysisResult);
    } catch {
      setError("We could not reach the analysis service. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
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
            <Button type="button" className="w-full sm:w-auto" onClick={analyzeImage} disabled={isAnalyzing}>
              {isAnalyzing ? "Analyzing image..." : "Analyze image"}
            </Button>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={openFilePicker} disabled={isAnalyzing}>
              Replace image
            </Button>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={removeImage} disabled={isAnalyzing}>
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

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {analysis ? (
        <section aria-live="polite" className="space-y-4 rounded-[1.5rem] border bg-background/85 p-4 shadow-inner">
          <div>
            <h2 className="text-lg font-bold text-foreground">Analysis results</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nutrition estimates are based on the closest USDA FoodData Central match.
            </p>
          </div>

          {analysis.foods.length > 0 ? (
            <div className="space-y-3">
              {analysis.foods.map((food, index) => (
                <article key={`${food.name}-${index}`} className="rounded-2xl bg-muted/70 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-semibold text-foreground">{food.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground">
                      {Math.round(food.confidence * 100)}% confidence
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Estimated weight: {food.estimatedWeightGrams} g
                  </p>

                  {food.nutrition ? (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        USDA match: <span className="font-medium text-foreground">{food.nutrition.usdaDescription}</span>
                      </p>
                      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div>
                          <dt className="text-muted-foreground">Calories</dt>
                          <dd className="font-semibold text-foreground">{food.nutrition.calories}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Protein</dt>
                          <dd className="font-semibold text-foreground">{food.nutrition.protein} g</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Carbohydrates</dt>
                          <dd className="font-semibold text-foreground">{food.nutrition.carbohydrates} g</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Fat</dt>
                          <dd className="font-semibold text-foreground">{food.nutrition.fat} g</dd>
                        </div>
                      </dl>
                    </div>
                  ) : food.nutritionError ? (
                    <p className="mt-3 text-sm font-medium text-red-700">Nutrition: {food.nutritionError}</p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
              No foods were detected in this image.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
