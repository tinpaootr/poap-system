const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// Test cho contract ClubPOAP (Soulbound NFT điểm danh).
// Chạy trên mạng Hardhat giả lập trong máy: không tốn ETH, không động tới contract thật trên Sepolia.
describe("ClubPOAP", function () {
  const EVENT_ID = "6aeecf08d3e4b51f6b75cf5b"; // dạng _id MongoDB
  const TOKEN_URI = "ipfs://QmTestMetadataHash";

  async function deployFixture() {
    const [owner, student1, student2, student3, outsider] = await ethers.getSigners();
    const ClubPOAP = await ethers.getContractFactory("ClubPOAP");
    const poap = await ClubPOAP.deploy();
    await poap.waitForDeployment();
    return { poap, owner, student1, student2, student3, outsider };
  }

  describe("Khởi tạo", function () {
    it("có đúng tên và ký hiệu token", async function () {
      const { poap } = await loadFixture(deployFixture);
      expect(await poap.name()).to.equal("Club POAP Soulbound Badge");
      expect(await poap.symbol()).to.equal("CPOAP");
    });

    it("người deploy là owner và là Admin", async function () {
      const { poap, owner } = await loadFixture(deployFixture);
      expect(await poap.owner()).to.equal(owner.address);
      expect(await poap.isAdmin(owner.address)).to.equal(true);
    });

    it("hai ví Admin cấu hình sẵn trong contract (Tuyền, Trâm) có quyền Admin", async function () {
      const { poap } = await loadFixture(deployFixture);
      expect(await poap.isAdmin("0x4da3b2e88A9930907b1F94922b648EE289235656")).to.equal(true);
      expect(await poap.isAdmin("0xfaA155cD28F66C84eb186dAc13FaF8c095Cf1Fd9")).to.equal(true);
    });

    it("ví bình thường không phải Admin", async function () {
      const { poap, student1 } = await loadFixture(deployFixture);
      expect(await poap.isAdmin(student1.address)).to.equal(false);
    });
  });

  describe("createEvent", function () {
    it("Admin tạo sự kiện thành công và phát sự kiện EventCreated", async function () {
      const { poap, owner } = await loadFixture(deployFixture);
      await expect(poap.createEvent(EVENT_ID, 3))
        .to.emit(poap, "EventCreated")
        .withArgs(EVENT_ID, 3, owner.address);

      const info = await poap.events(EVENT_ID);
      expect(info.capacity).to.equal(3);
      expect(info.currentAttendees).to.equal(0);
      expect(info.exists).to.equal(true);
    });

    it("ví không phải Admin bị từ chối", async function () {
      const { poap, outsider } = await loadFixture(deployFixture);
      await expect(poap.connect(outsider).createEvent(EVENT_ID, 3)).to.be.revertedWith(
        "ClubPOAP: Khong phai vi Admin"
      );
    });

    it("không cho tạo trùng cùng một eventId", async function () {
      const { poap } = await loadFixture(deployFixture);
      await poap.createEvent(EVENT_ID, 3);
      await expect(poap.createEvent(EVENT_ID, 5)).to.be.revertedWith("ClubPOAP: Su kien da ton tai");
    });

    it("từ chối eventId rỗng và sức chứa bằng 0", async function () {
      const { poap } = await loadFixture(deployFixture);
      await expect(poap.createEvent("", 3)).to.be.revertedWith("ClubPOAP: Thieu eventId");
      await expect(poap.createEvent(EVENT_ID, 0)).to.be.revertedWith("ClubPOAP: So luong phai > 0");
    });
  });

  describe("claimBadge", function () {
    it("sinh viên nhận huy hiệu: mint token 1 về đúng ví, phát sự kiện BadgeClaimed và Locked", async function () {
      const { poap, student1 } = await loadFixture(deployFixture);
      await poap.createEvent(EVENT_ID, 3);

      await expect(poap.connect(student1).claimBadge(EVENT_ID, TOKEN_URI))
        .to.emit(poap, "BadgeClaimed")
        .withArgs(EVENT_ID, student1.address, 1n, TOKEN_URI)
        .and.to.emit(poap, "Locked")
        .withArgs(1n);

      expect(await poap.ownerOf(1)).to.equal(student1.address);
      expect(await poap.tokenURI(1)).to.equal(TOKEN_URI);
      expect(await poap.balanceOf(student1.address)).to.equal(1);
      expect(await poap.claimed(EVENT_ID, student1.address)).to.equal(true);
      expect(await poap.studentTokenId(EVENT_ID, student1.address)).to.equal(1);
      expect((await poap.events(EVENT_ID)).currentAttendees).to.equal(1);
    });

    it("tokenId tăng dần khi nhiều sinh viên cùng nhận", async function () {
      const { poap, student1, student2 } = await loadFixture(deployFixture);
      await poap.createEvent(EVENT_ID, 3);
      await poap.connect(student1).claimBadge(EVENT_ID, TOKEN_URI);
      await poap.connect(student2).claimBadge(EVENT_ID, TOKEN_URI);

      expect(await poap.ownerOf(1)).to.equal(student1.address);
      expect(await poap.ownerOf(2)).to.equal(student2.address);
      expect((await poap.events(EVENT_ID)).currentAttendees).to.equal(2);
    });

    it("cùng một ví không nhận được 2 lần cho cùng một sự kiện", async function () {
      const { poap, student1 } = await loadFixture(deployFixture);
      await poap.createEvent(EVENT_ID, 3);
      await poap.connect(student1).claimBadge(EVENT_ID, TOKEN_URI);
      await expect(poap.connect(student1).claimBadge(EVENT_ID, TOKEN_URI)).to.be.revertedWith(
        "ClubPOAP: Vi nay da nhan huy hieu su kien nay"
      );
    });

    it("cùng một ví vẫn nhận được huy hiệu của sự kiện khác", async function () {
      const { poap, student1 } = await loadFixture(deployFixture);
      await poap.createEvent(EVENT_ID, 3);
      await poap.createEvent("event-khac", 3);
      await poap.connect(student1).claimBadge(EVENT_ID, TOKEN_URI);
      await poap.connect(student1).claimBadge("event-khac", TOKEN_URI);
      expect(await poap.balanceOf(student1.address)).to.equal(2);
    });

    it("sự kiện đủ số lượng thì sinh viên tiếp theo bị từ chối", async function () {
      const { poap, student1, student2 } = await loadFixture(deployFixture);
      await poap.createEvent(EVENT_ID, 1);
      await poap.connect(student1).claimBadge(EVENT_ID, TOKEN_URI);
      await expect(poap.connect(student2).claimBadge(EVENT_ID, TOKEN_URI)).to.be.revertedWith(
        "ClubPOAP: Su kien da du so luong tham du"
      );
    });

    it("từ chối eventId rỗng hoặc tokenURI rỗng", async function () {
      const { poap, student1 } = await loadFixture(deployFixture);
      await expect(poap.connect(student1).claimBadge("", TOKEN_URI)).to.be.revertedWith(
        "ClubPOAP: Thieu eventId"
      );
      await expect(poap.connect(student1).claimBadge(EVENT_ID, "")).to.be.revertedWith(
        "ClubPOAP: Thieu tokenURI"
      );
    });

    it("sự kiện chưa đăng ký on-chain vẫn nhận được (cơ chế dự phòng, sức chứa mặc định 1000)", async function () {
      const { poap, student1 } = await loadFixture(deployFixture);
      await poap.connect(student1).claimBadge("su-kien-chua-tao", TOKEN_URI);

      const info = await poap.events("su-kien-chua-tao");
      expect(info.exists).to.equal(true);
      expect(info.capacity).to.equal(1000);
      expect(info.currentAttendees).to.equal(1);
      expect(await poap.ownerOf(1)).to.equal(student1.address);
    });
  });

  describe("Soulbound (ERC-5192): không chuyển nhượng được", function () {
    async function claimedFixture() {
      const base = await deployFixture();
      await base.poap.createEvent(EVENT_ID, 3);
      await base.poap.connect(base.student1).claimBadge(EVENT_ID, TOKEN_URI);
      return base;
    }

    it("locked() luôn trả về true cho token đã mint", async function () {
      const { poap } = await loadFixture(claimedFixture);
      expect(await poap.locked(1)).to.equal(true);
    });

    it("locked() báo lỗi với token không tồn tại", async function () {
      const { poap } = await loadFixture(claimedFixture);
      await expect(poap.locked(999)).to.be.revertedWith("ClubPOAP: Token khong ton tai");
    });

    it("chủ token không thể transferFrom sang ví khác", async function () {
      const { poap, student1, student2 } = await loadFixture(claimedFixture);
      await expect(
        poap.connect(student1).transferFrom(student1.address, student2.address, 1)
      ).to.be.revertedWith("ClubPOAP: Soulbound Token khong the chuyen nhuong!");
      expect(await poap.ownerOf(1)).to.equal(student1.address);
    });

    it("chủ token không thể safeTransferFrom sang ví khác", async function () {
      const { poap, student1, student2 } = await loadFixture(claimedFixture);
      await expect(
        poap
          .connect(student1)
          ["safeTransferFrom(address,address,uint256)"](student1.address, student2.address, 1)
      ).to.be.revertedWith("ClubPOAP: Soulbound Token khong the chuyen nhuong!");
      expect(await poap.ownerOf(1)).to.equal(student1.address);
    });

    it("ví đã được approve cũng không chuyển token đi được", async function () {
      const { poap, student1, student2, outsider } = await loadFixture(claimedFixture);
      await poap.connect(student1).approve(outsider.address, 1);
      await expect(
        poap.connect(outsider).transferFrom(student1.address, student2.address, 1)
      ).to.be.revertedWith("ClubPOAP: Soulbound Token khong the chuyen nhuong!");
      expect(await poap.ownerOf(1)).to.equal(student1.address);
    });
  });

  describe("supportsInterface", function () {
    it("hỗ trợ ERC-5192, ERC-721 và ERC-165; không hỗ trợ interface lạ", async function () {
      const { poap } = await loadFixture(deployFixture);
      expect(await poap.supportsInterface("0xb45a3c0e")).to.equal(true); // ERC-5192
      expect(await poap.supportsInterface("0x80ac58cd")).to.equal(true); // ERC-721
      expect(await poap.supportsInterface("0x01ffc9a7")).to.equal(true); // ERC-165
      expect(await poap.supportsInterface("0xffffffff")).to.equal(false);
    });
  });

  describe("setAdmin", function () {
    it("owner cấp quyền Admin cho ví khác, ví đó tạo được sự kiện", async function () {
      const { poap, outsider } = await loadFixture(deployFixture);
      await poap.setAdmin(outsider.address, true);
      expect(await poap.isAdmin(outsider.address)).to.equal(true);
      await expect(poap.connect(outsider).createEvent(EVENT_ID, 3)).to.emit(poap, "EventCreated");
    });

    it("owner gỡ quyền Admin thì ví đó không tạo được sự kiện nữa", async function () {
      const { poap, outsider } = await loadFixture(deployFixture);
      await poap.setAdmin(outsider.address, true);
      await poap.setAdmin(outsider.address, false);
      await expect(poap.connect(outsider).createEvent(EVENT_ID, 3)).to.be.revertedWith(
        "ClubPOAP: Khong phai vi Admin"
      );
    });

    it("ví không phải owner không được cấp quyền Admin", async function () {
      const { poap, outsider, student1 } = await loadFixture(deployFixture);
      await expect(poap.connect(outsider).setAdmin(student1.address, true))
        .to.be.revertedWithCustomError(poap, "OwnableUnauthorizedAccount")
        .withArgs(outsider.address);
    });
  });
});