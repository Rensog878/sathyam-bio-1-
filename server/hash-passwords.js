/**
 * One-off maintenance: hash every password still stored in plaintext.
 *
 * Signing in already upgrades an account's password, so this only matters for
 * accounts that have not signed in since hashing was introduced. Safe to re-run:
 * passwords that are already hashed are left alone.
 *
 * Run once:  node hash-passwords.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { hashPassword, isPasswordHash } from './security.js';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI missing in .env');

await mongoose.connect(MONGODB_URI);
const users = mongoose.connection.collection('users');

let upgraded = 0;
let alreadyHashed = 0;

for await (const user of users.find({ password: { $type: 'string' } }, { projection: { password: 1, name: 1 } })) {
  if (isPasswordHash(user.password)) {
    alreadyHashed += 1;
    continue;
  }
  // Only replace the value we read, in case the user signs in (and is upgraded) meanwhile.
  await users.updateOne(
    { _id: user._id, password: user.password },
    { $set: { password: await hashPassword(user.password), updatedAt: new Date().toISOString() } }
  );
  upgraded += 1;
  console.log(`Hashed password for ${user._id} (${user.name || 'unnamed'})`);
}

console.log(`\n${upgraded} password(s) hashed, ${alreadyHashed} already hashed.`);
await mongoose.disconnect();
console.log('Done.');
