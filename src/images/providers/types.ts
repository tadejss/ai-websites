export type StockImageProvider = "pexels" | "unsplash";

export type StockPhotoCandidate = {
  provider: StockImageProvider;
  id: string;
  downloadUrl: string;
  sourceUrl: string;
  photographer: string;
  photographerUrl?: string;
  width: number;
  height: number;
  searchQuery: string;
};
