export interface GoogleBookVolumeInfo {
  title: string;
  authors?: string[];
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  pageCount?: number;
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: GoogleBookVolumeInfo;
}

export interface GoogleBooksResponse {
  items?: GoogleBookItem[];
  totalItems: number;
}

export const searchBooks = async (query: string): Promise<GoogleBookItem[]> => {
  if (!query.trim()) return [];

  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=fr&maxResults=20`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: GoogleBooksResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching from Google Books API:', error);
    return [];
  }
};
