const hre = require("hardhat");

async function main() {
  console.log("⏳ Đang tiến hành deploy hợp đồng ClubPOAP lên mạng Sepolia...");

  const ClubPOAP = await hre.ethers.getContractFactory("ClubPOAP");
  const clubPOAP = await ClubPOAP.deploy();

  await clubPOAP.waitForDeployment();
  const contractAddress = await clubPOAP.getAddress();
  const receipt = await clubPOAP.deploymentTransaction()?.wait();

  console.log("✅ Deploy thành công!");
  console.log("📌 Địa chỉ Smart Contract (CONTRACT_ADDRESS):", contractAddress);
  if (receipt) console.log("📦 Block deploy (CONTRACT_DEPLOY_BLOCK):", receipt.blockNumber);
  console.log(`🔎 Xem trên Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
  // Kiểm tra owner (= ví deploy) và các ví Admin mặc định trong constructor
  console.log("👑 Owner (ví deploy):", await clubPOAP.owner());
  const defaultAdmins = {
    "Tuyền": "0x4da3b2e88A9930907b1F94922b648EE289235656",
    "Trâm": "0xfaA155cD28F66C84eb186dAc13FaF8c095Cf1Fd9",
    "Kiệt": "0x19F6f7e08644cbA7E9545666DCc0A2B42cd4e427",
  };
  for (const [name, addr] of Object.entries(defaultAdmins)) {
    console.log(`   isAdmin(${name} ${addr}) = ${await clubPOAP.isAdmin(addr)}`);
  }
  console.log("➡️  Bước tiếp theo: điền CONTRACT_ADDRESS + MINTER_ADDRESS vào blockchain/.env rồi chạy scripts/setAdmin.js.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});