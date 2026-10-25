import fs from 'fs';
import { CLUSTER_37_SCHOOLS } from '../src/data/clusterSchoolsData';

const probe = JSON.parse(fs.readFileSync('scripts/authenticated_probe_results.json', 'utf8'));
const cloudSchools = probe.schools?.docs || [];

console.log('--- SCHOOL AUDIT: FIRESTORE VS CANONICAL MASTER ---');
console.log('Total Canonical Schools defined:', CLUSTER_37_SCHOOLS.length);
console.log('Total Schools found in Firestore:', cloudSchools.length);

const cloudByUdise = new Map<string, any>();
cloudSchools.forEach((s: any) => {
  cloudByUdise.set(s.udise || s.id, s);
});

let matched = 0;
let mismatches: string[] = [];

CLUSTER_37_SCHOOLS.forEach((canon) => {
  const cloud = cloudByUdise.get(canon.udise);
  if (!cloud) {
    mismatches.push(`MISSING IN CLOUD: ${canon.udise} - ${canon.name}`);
  } else {
    matched++;
    if (cloud.name !== canon.name) {
      console.log(`Name difference: Canon="${canon.name}" vs Cloud="${cloud.name}"`);
    }
    if (cloud.status !== 'ACTIVE') {
      console.log(`Status difference: Canon="${canon.status}" vs Cloud="${cloud.status}"`);
    }
  }
});

console.log(`Matched Schools: ${matched} / 37`);
if (mismatches.length > 0) {
  console.log('Mismatches:', mismatches);
} else {
  console.log('✓ All 37 Canonical Schools are 100% PRESENT in Cloud Firestore!');
}

// Check for any extra schools in Firestore
const canonUdises = new Set(CLUSTER_37_SCHOOLS.map(s => s.udise));
const extraInCloud = cloudSchools.filter((s: any) => !canonUdises.has(s.udise || s.id));
console.log('Extra/Unauthorized schools in Cloud:', extraInCloud.length);
if (extraInCloud.length > 0) {
  console.log('Extra school list:', extraInCloud.map((s: any) => ({ udise: s.udise || s.id, name: s.name })));
} else {
  console.log('✓ Zero duplicate or unauthorized schools in Cloud Firestore.');
}
