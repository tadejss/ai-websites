import type { RawBusinessData } from "@/ai/types/raw-business-data";
import type { BusinessSource } from "./types";

const avtoServisNovakData: RawBusinessData = {
  name: "Avto Servis Novak",
  category: "Avtoservis",
  description:
    "Servis osebnih vozil v Ljubljani. Diagnostika, vzdrževanje, menjava pnevmatik in hitri servisni pregledi.",
  phone: "+386 40 123 456",
  email: "info@avtoservis-novak.si",
  address: "Celovška cesta 120, 1000 Ljubljana",
  website: "https://avtoservis-novak.si",
  openingHours: "Pon–Pet: 8:00–17:00 · Sob: 8:00–13:00",
  rating: "4.8",
  reviewCount: "127",
  reviews: [
    "Hitra in poštena storitev, priporočam.",
    "Zanesljiv servis z jasno razlago napak.",
    "Odlična menjava pnevmatik in prijazno osebje.",
  ],
};

export function createMockSource(): BusinessSource {
  return {
    async getBusiness() {
      return avtoServisNovakData;
    },
  };
}
