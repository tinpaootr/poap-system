const hre = require("hardhat");

async function main() {
  console.log("⏳ Đang tiến hành deploy hợp đồng ClubPOAP lên mạng Sepolia...");

  const ClubPOAP = await hre.ethers.getContractFactory("ClubPOAP");
  const clubPOAP = await ClubPOAP.deploy();

  await clubPOAP.waitForDeployment();
  const contractAddress = await clubPOAP.getAddress();

  console.log("✅ Deploy thành công!");
  console.log("📌 Địa chỉ Smart Contract (CONTRACT_ADDRESS):", contractAddress);
  console.log(`🔎 Xem trên Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});