export type RoomType = 'Single' | 'Double' | 'Suite' | 'Deluxe';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  price: number;
  images: string[];
  video?: string;
  description: string;
  amenities: string[];
  maxGuests: number;
  size: number;
  available: boolean;
  location?: string;
}
