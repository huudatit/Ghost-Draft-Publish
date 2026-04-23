const rank: Record<string, number> = {
  guest: 0,
  user: 1,
  editor: 2,
  admin: 3
};

export function canAccessRole(current: string, required: string) {
  return (rank[current] ?? 0) >= (rank[required] ?? 0);
}

export function isPrivilegedRole(role: string) {
  return canAccessRole(role, "editor");
}
