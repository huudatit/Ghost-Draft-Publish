import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function randomToken(bytes = 10): string {
  return crypto.randomBytes(bytes).toString("hex");
}

function generateEmail(prefix: string): string {
  return `${prefix}-${randomToken(4)}@ghost.local`;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const accounts = {
    player: {
      email: generateEmail("player"),
      password: randomToken(10)
    },
    editor: {
      email: generateEmail("editor"),
      password: randomToken(10)
    },
    admin: {
      email: generateEmail("admin"),
      password: randomToken(10)
    }
  };

  const player = await db.user.upsert({
    where: { email: accounts.player.email },
    update: {},
    create: {
      email: accounts.player.email,
      displayName: "Player One",
      passwordHash: hashPassword(accounts.player.password),
      role: "user"
    }
  });

  const editor = await db.user.upsert({
    where: { email: accounts.editor.email },
    update: {},
    create: {
      email: accounts.editor.email,
      displayName: "Layout Editor",
      passwordHash: hashPassword(accounts.editor.password),
      role: "editor"
    }
  });

  const admin = await db.user.upsert({
    where: { email: accounts.admin.email },
    update: {
      passwordHash: hashPassword(accounts.admin.password)
    },
    create: {
      email: accounts.admin.email,
      displayName: "Archive Admin",
      passwordHash: hashPassword(accounts.admin.password),
      role: "admin"
    }
  });

  const approvedTemplateA = await db.template.upsert({
    where: { slug: "ledger-echo" },
    update: {},
    create: {
      slug: "ledger-echo",
      name: "Ledger Echo",
      body: "Approved copy pulled from the archive mirror.",
      approved: true,
      shared: true,
      minimumRole: "editor",
      clueText: "The record that arrived before the restore never matched the one that was reviewed."
    }
  });

  const approvedTemplateB = await db.template.upsert({
    where: { slug: "paper-veil" },
    update: {},
    create: {
      slug: "paper-veil",
      name: "Paper Veil",
      body: "Shared template with a clean editorial stamp.",
      approved: true,
      shared: true,
      minimumRole: "editor",
      clueText: "The preview badge and restore badge do not agree when the clock runs backward."
    }
  });

  const draftA = await db.draft.upsert({
    where: { id: "draft-player-001" },
    update: {},
    create: {
      id: "draft-player-001",
      ownerId: player.id,
      title: "Ghost Note",
      body: "The first draft is always honest.",
      status: "draft",
      visibility: "private"
    }
  });

  const draftB = await db.draft.upsert({
    where: { id: "draft-editor-001" },
    update: {},
    create: {
      id: "draft-editor-001",
      ownerId: editor.id,
      title: "Editor Scratch",
      body: "A review memo with too many margins.",
      status: "in_review",
      visibility: "private",
      templateId: approvedTemplateA.id,
      restoreSeed: 1
    }
  });

  await db.auditLog.createMany({
    data: [
      {
        userId: player.id,
        draftId: draftA.id,
        action: "seed_note",
        detail: "preview order matters more than preview contents"
      },
      {
        userId: editor.id,
        draftId: draftB.id,
        action: "seed_note",
        detail: "shared template restoration leaves a transient trail"
      },
      {
        userId: admin.id,
        action: "seed_note",
        detail: "admin account seeded at runtime"
      }
    ]
  });

  await mkdir(path.join(".private"), { recursive: true });
  await writeFile(
    path.join(".private", "seed-credentials.json"),
    JSON.stringify(
      {
        player: accounts.player,
        editor: accounts.editor,
        admin: accounts.admin
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
