const bcrypt = require("bcryptjs");

async function generateHash() {
  const realPassword = "Admin12345"; // change this to your real admin password
  const hash = await bcrypt.hash(realPassword, 10);

  console.log("Use this hashed password in MongoDB:");
  console.log(hash);
}

generateHash();