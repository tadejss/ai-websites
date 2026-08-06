import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RawBusinessData } from "@/ai/types/raw-business-data";
import { rawBusinessDataSchema } from "@/ai/validate-raw-business-data";
import type { BusinessSource } from "./types";

function isRawBusinessDataObject(value: unknown): value is RawBusinessData {
  return rawBusinessDataSchema.safeParse(value).success;
}

export function createFileSource(inputPath: string): BusinessSource {
  const absolutePath = resolve(inputPath);

  return {
    async getBusiness() {
      const rawContent = readFileSync(absolutePath, "utf8").trim();

      try {
        const parsed: unknown = JSON.parse(rawContent);

        if (isRawBusinessDataObject(parsed)) {
          return parsed;
        }
      } catch {
        // Fall through to plain text description.
      }

      return { description: rawContent };
    },
  };
}
