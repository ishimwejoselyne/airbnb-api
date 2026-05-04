export type UserRole = "host" | "guest";

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
}

export const users: User[] = [
  {
    id: 1,
    name: "Aisha Bello",
    email: "aisha@example.com",
    username: "aishab",
    phone: "+2348012345678",
    role: "host",
    avatar: "https://example.com/avatars/aisha.png",
    bio: "Host in Lagos. Loves welcoming guests."
  },
  {
    id: 2,
    name: "David Kim",
    email: "david@example.com",
    username: "davidk",
    phone: "+12025550123",
    role: "guest",
    bio: "Remote worker, travels often."
  },
  {
    id: 3,
    name: "Maria Garcia",
    email: "maria@example.com",
    username: "mariag",
    phone: "+34911222333",
    role: "host"
  }
];

export function getNextUserId(): number {
  const maxId = users.reduce((max, u) => Math.max(max, u.id), 0);
  return maxId + 1;
}

