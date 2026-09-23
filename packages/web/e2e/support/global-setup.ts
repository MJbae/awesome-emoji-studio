import { mkdir, rm } from 'node:fs/promises';

export default async function setup() {
  await rm('coverage/e2e', { recursive: true, force: true });
  await mkdir('coverage/e2e/raw', { recursive: true });
}
