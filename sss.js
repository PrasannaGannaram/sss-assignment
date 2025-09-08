// sss.js
// Shamir Secret Sharing Reconstruction
// Author: Hashira Placement Assignment Solution
// Language: JavaScript (Node.js)

const fs = require("fs");

// ---------- Utility Functions ----------

// safe mod for BigInt
function mod(a, p) {
  let res = a % p;
  return res >= 0n ? res : res + p;
}

// Extended Euclidean Algorithm for modular inverse
function egcd(a, b) {
  if (b === 0n) return [a, 1n, 0n];
  let [g, x1, y1] = egcd(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

function invMod(a, p) {
  let [g, x] = egcd(mod(a, p), p);
  if (g !== 1n) {
    throw new Error("Inverse does not exist");
  }
  return mod(x, p);
}

// Decode a number string in a given base into BigInt
function decodeInBaseToBigInt(str, base) {
  const digits = str.toLowerCase();
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  let value = 0n;
  let b = BigInt(base);

  for (let ch of digits) {
    let digit = alphabet.indexOf(ch);
    if (digit < 0 || digit >= base) {
      throw new Error(`Invalid digit '${ch}' for base ${base}`);
    }
    value = value * b + BigInt(digit);
  }
  return value;
}

// Lagrange interpolation at x = 0
function lagrangeAtZero(shares, p) {
  let secret = 0n;

  for (let i = 0; i < shares.length; i++) {
    let { x: xi, y: yi } = shares[i];
    let num = 1n;
    let den = 1n;

    for (let j = 0; j < shares.length; j++) {
      if (i !== j) {
        let xj = shares[j].x;
        num = mod(num * (-xj), p);
        den = mod(den * (xi - xj), p);
      }
    }

    let li = mod(num * invMod(den, p), p);
    secret = mod(secret + yi * li, p);
  }

  return secret;
}

// ---------- Main Program ----------

// Default large prime (Mersenne prime 2^127 - 1) for finite field
const DEFAULT_PRIME = (1n << 127n) - 1n;

// Read JSON file
if (process.argv.length < 3) {
  console.log("Usage: node sss.js <input.json>");
  process.exit(1);
}

const filename = process.argv[2];
const data = JSON.parse(fs.readFileSync(filename, "utf8"));

const n = data.keys.n;
const k = data.keys.k;
const p = DEFAULT_PRIME;

let shares = [];

// Parse each share
for (let key in data) {
  if (key !== "keys") {
    const x = BigInt(key);
    const base = parseInt(data[key].base);
    const valueStr = data[key].value;
    const y = decodeInBaseToBigInt(valueStr, base);
    shares.push({ x, y: mod(y, p) });
  }
}

console.log("All Shares (decoded):", shares);

// Pick first k shares
let chosenShares = shares.slice(0, k);

console.log(`Using first ${k} shares to reconstruct secret...`);

// Reconstruct secret
const secret = lagrangeAtZero(chosenShares, p);

console.log("✅ Reconstructed Secret (f(0)) =", secret.toString());
