/**
 * One-off maintenance: back up and remove duplicate accounts that share a phone
 * number (keeping the newest), then enforce a unique index on phone.
 *
 * Run once:  node dedupe-phones.js
 */
import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI missing in .env');

const backupPath = process.argv[2] || './duplicate-users-backup.json';

await mongoose.connect(MONGODB_URI);
const users = mongoose.connection.collection('users');

const all = await users.find({}).toArray();

const byPhone = new Map();
for (const u of all) {
  const phone = String(u.phone || '').trim();
  if (!phone) continue;
  if (!byPhone.has(phone)) byPhone.set(phone, []);
  byPhone.get(phone).push(u);
}

const doomed = [];
for (const [phone, list] of byPhone) {
  if (list.length < 2) continue;
  list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const [keep, ...rest] = list;
  console.log(`${phone}: keeping ${keep._id} (${keep.name}), removing ${rest.length}`);
  doomed.push(...rest);
}

if (doomed.length) {
  fs.writeFileSync(backupPath, JSON.stringify(doomed, null, 2));
  console.log(`\nBacked up ${doomed.length} account(s) to ${backupPath}`);

  const result = await users.deleteMany({ _id: { $in: doomed.map(d => d._id) } });
  console.log(`Deleted ${result.deletedCount} duplicate account(s).`);
} else {
  console.log('No duplicates found.');
}

// Enforce uniqueness from here on, for every code path that creates a user.
try {
  await users.createIndex({ phone: 1 }, { unique: true, sparse: true, name: 'phone_unique' });
  console.log('Unique index on phone created.');
} catch (err) {
  console.error('Could not create unique index:', err.message);
}

await mongoose.disconnect();
console.log('Done.');
