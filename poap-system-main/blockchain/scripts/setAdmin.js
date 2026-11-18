// Cấp (hoặc gỡ) quyền Admin cho ví minter của backend trên contract ClubPOAP.
// Phải chạy bằng ví OWNER (người deploy) - ADMIN_PRIVATE_KEY trong blockchain/.env.
//
// Khai báo trong blockchain/.env (không hard-code trong script):
//   CONTRACT_ADDRESS=0x...
//   MINTER_ADDRESS=0xViMinterKiet,0xViMinterTram,0xViMinterTuyen   (1 hoặc nhiều ví, cách nhau dấu phẩy)
// Rồi chạy:
//   npx hardhat run scripts/setAdmin.js --network sepolia
// Thêm REVOKE=true để gỡ quyền (VD khi lộ private key ví minter).

const hre = require("hardhat");

async function main() {
  const contractAddress = String(process.env.CONTRACT_ADDRESS || "").trim();
  const minters = String(process.env.MINTER_ADDRESS || "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  const status = String(process.env.REVOKE || "").toLowerCase() !== "true";

  if (!hre.ethers.isAddress(contractAddress)) throw new Error("Thiếu hoặc sai CONTRACT_ADDRESS trong blockchain/.env");
  if (minters.length === 0) throw new Error("Thiếu MINTER_ADDRESS trong blockchain/.env");
  const invalid = minters.filter((a) => !hre.ethers.isAddress(a));
  if (invalid.length) throw new Error(`MINTER_ADDRESS không hợp lệ: ${invalid.join(", ")}`);

  const [signer] = await hre.ethers.getSigners();
  const poap = await hre.ethers.getContractAt("ClubPOAP", contractAddress, signer);

  const owner = await poap.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`Ví ${signer.address} không phải owner của contract (owner: ${owner})`);
  }

  for (const minter of minters) {
    if ((await poap.isAdmin(minter)) === status) {
      console.log(`⏭️  ${minter} đã có isAdmin = ${status}, bỏ qua.`);
      continue;
    }
    console.log(`⏳ setAdmin(${minter}, ${status}) trên ${contractAddress}...`);
    const tx = await poap.setAdmin(minter, status);
    await tx.wait();
    console.log(`✅ Xong. Tx: https://sepolia.etherscan.io/tx/${tx.hash}`);
    console.log(`   isAdmin(${minter}) = ${await poap.isAdmin(minter)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
