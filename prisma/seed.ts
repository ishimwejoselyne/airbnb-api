import "dotenv/config";

import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg(new Pool({ connectionString: DATABASE_URL }));
const prisma = new PrismaClient({ adapter });

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(checkIn: Date, checkOut: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
  const end = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate());
  return Math.ceil((end - start) / msPerDay);
}

async function main() {
  await prisma.booking.deleteMany();
  await prisma.listingPhoto.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const [host1, host2, guest1, guest2, guest3] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Aisha Bello",
        email: "aisha.host@example.com",
        username: "aishahost",
        phone: "+2348012345678",
        role: "HOST",
        avatar: "https://example.com/avatars/aisha.png",
        password: passwordHash
      }
    }),
    prisma.user.create({
      data: {
        name: "Maria Garcia",
        email: "maria.host@example.com",
        username: "mariahost",
        phone: "+34911222333",
        role: "HOST",
        avatar: "https://example.com/avatars/maria.png",
        password: passwordHash
      }
    }),
    prisma.user.create({
      data: {
        name: "David Kim",
        email: "david.guest@example.com",
        username: "davidguest",
        phone: "+12025550123",
        role: "GUEST",
        avatar: "https://example.com/avatars/david.png",
        password: passwordHash
      }
    }),
    prisma.user.create({
      data: {
        name: "Fatima Noor",
        email: "fatima.guest@example.com",
        username: "fatimaguest",
        phone: "+971501112233",
        role: "GUEST",
        password: passwordHash
      }
    }),
    prisma.user.create({
      data: {
        name: "James Okoye",
        email: "james.guest@example.com",
        username: "jamesguest",
        phone: "+2348098765432",
        role: "GUEST",
        password: passwordHash
      }
    })
  ]);

  await prisma.profile.create({
    data: { userId: host1.id, bio: "Host in Lagos", website: "https://example.com", country: "Nigeria" }
  });

  const [apartment, house, villa, cabin] = await Promise.all([
    prisma.listing.create({
      data: {
        title: "Cozy Apartment in City Center",
        description: "A bright apartment close to shops and transit.",
        location: "Lagos, Nigeria",
        pricePerNight: 45,
        guests: 2,
        type: "APARTMENT",
        amenities: ["wifi", "air conditioning", "kitchen"],
        rating: 4.6,
        hostId: host1.id
      }
    }),
    prisma.listing.create({
      data: {
        title: "Spacious Family House",
        description: "Perfect for families, with a backyard and BBQ.",
        location: "Madrid, Spain",
        pricePerNight: 90,
        guests: 6,
        type: "HOUSE",
        amenities: ["wifi", "kitchen", "washer"],
        hostId: host2.id
      }
    }),
    prisma.listing.create({
      data: {
        title: "Luxury Villa with Pool",
        description: "A premium villa with a private pool and great views.",
        location: "Cape Town, South Africa",
        pricePerNight: 220,
        guests: 8,
        type: "VILLA",
        amenities: ["wifi", "pool", "parking"],
        rating: 4.9,
        hostId: host2.id
      }
    }),
    prisma.listing.create({
      data: {
        title: "Modern Cabin Getaway",
        description: "Peaceful cabin with mountain views and hiking trails.",
        location: "Denver, USA",
        pricePerNight: 120,
        guests: 4,
        type: "CABIN",
        amenities: ["wifi", "heating", "hot tub"],
        rating: 4.8,
        hostId: host1.id
      }
    })
  ]);

  await prisma.listingPhoto.createMany({
    data: [
      { listingId: apartment.id, url: "https://example.com/listings/apartment-1.jpg" },
      { listingId: apartment.id, url: "https://example.com/listings/apartment-2.jpg" },
      { listingId: cabin.id, url: "https://example.com/listings/cabin-1.jpg" }
    ]
  });

  const now = new Date();
  const booking1In = addDays(now, 10);
  const booking1Out = addDays(now, 13);
  const booking2In = addDays(now, 20);
  const booking2Out = addDays(now, 23);
  const booking3In = addDays(now, 30);
  const booking3Out = addDays(now, 31);

  await prisma.booking.create({
    data: {
      guestId: guest1.id,
      listingId: apartment.id,
      checkIn: booking1In,
      checkOut: booking1Out,
      totalPrice: diffDays(booking1In, booking1Out) * apartment.pricePerNight,
      status: "CONFIRMED"
    }
  });

  await prisma.booking.create({
    data: {
      guestId: guest2.id,
      listingId: cabin.id,
      checkIn: booking2In,
      checkOut: booking2Out,
      totalPrice: diffDays(booking2In, booking2Out) * cabin.pricePerNight,
      status: "PENDING"
    }
  });

  await prisma.booking.create({
    data: {
      guestId: guest3.id,
      listingId: villa.id,
      checkIn: booking3In,
      checkOut: booking3Out,
      totalPrice: diffDays(booking3In, booking3Out) * villa.pricePerNight,
      status: "PENDING"
    }
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

