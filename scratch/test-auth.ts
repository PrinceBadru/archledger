import { auth } from './lib/auth';
import { prisma } from './lib/db';
import { headers } from 'next/headers'; // wait, auth.api might need context

async function main() {
  const account = await prisma.account.findFirst();
  console.log("Account:", account);
  const user = await prisma.user.findFirst();
  console.log("User:", user);
}

main().catch(console.error);
