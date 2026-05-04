export type ListingType = "apartment" | "house" | "villa" | "cabin";

export interface Listing {
  id: number;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: ListingType;
  amenities: string[];
  rating?: number;
  host: string;
}

export const listings: Listing[] = [
  {
    id: 1,
    title: "Cozy Apartment in City Center",
    description: "A bright apartment close to shops and transit.",
    location: "Lagos, Nigeria",
    pricePerNight: 45,
    guests: 2,
    type: "apartment",
    amenities: ["wifi", "air conditioning", "kitchen"],
    rating: 4.6,
    host: "Aisha Bello"
  },
  {
    id: 2,
    title: "Modern Cabin Getaway",
    description: "Peaceful cabin with great views and hiking trails.",
    location: "Denver, USA",
    pricePerNight: 120,
    guests: 4,
    type: "cabin",
    amenities: ["wifi", "heating", "parking", "hot tub"],
    rating: 4.8,
    host: "Maria Garcia"
  },
  {
    id: 3,
    title: "Spacious Family House",
    description: "Perfect for families, with a backyard and BBQ.",
    location: "Madrid, Spain",
    pricePerNight: 90,
    guests: 6,
    type: "house",
    amenities: ["wifi", "kitchen", "washer", "dryer"],
    host: "Maria Garcia"
  }
];

export function getNextListingId(): number {
  const maxId = listings.reduce((max, l) => Math.max(max, l.id), 0);
  return maxId + 1;
}

