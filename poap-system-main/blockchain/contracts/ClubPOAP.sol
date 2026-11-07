// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title IERC5192 - Chuẩn Minimal Soulbound NFTs
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

contract ClubPOAP is ERC721URIStorage, Ownable, IERC5192 {
    uint256 private _nextTokenId = 1;

    struct EventInfo {
        uint256 capacity;
        uint256 currentAttendees;
        bool exists;
    }

    // Danh sách ví Ban Tổ Chức (Admin) được quyền tạo sự kiện
    mapping(address => bool) public isAdmin;

    // Lưu thông tin sự kiện theo MongoDB _id (eventId)
    mapping(string => EventInfo) public events;

    // Chống claim 2 lần trên On-chain: claimed[eventId][studentWallet]
    mapping(string => mapping(address => bool)) public claimed;

    // Lưu tokenId của sinh viên tại từng sự kiện để Người 3 (Bộ sưu tập) dễ tra cứu
    mapping(string => mapping(address => uint256)) public studentTokenId;

    event EventCreated(string eventId, uint256 capacity, address indexed creator);
    event BadgeClaimed(
        string eventId,
        address indexed student,
        uint256 indexed tokenId,
        string tokenURI
    );

    modifier onlyAdmin() {
        require(isAdmin[msg.sender] || msg.sender == owner(), "ClubPOAP: Khong phai vi Admin");
        _;
    }

    constructor() ERC721("Club POAP Soulbound Badge", "CPOAP") Ownable(msg.sender) {
        // Cấp quyền mặc định cho người deploy và 2 ví Admin trong admin/page.tsx
        isAdmin[msg.sender] = true;
        isAdmin[0x4da3b2e88A9930907b1F94922b648EE289235656] = true; // Ví Tuyền
        isAdmin[0xfaA155cD28F66C84eb186dAc13FaF8c095Cf1Fd9] = true; // Ví Trâm
    }

    /// @notice Thêm hoặc gỡ quyền Admin cho ví khác nếu cần
    function setAdmin(address _admin, bool _status) external onlyOwner {
        isAdmin[_admin] = _status;
    }

    /// @notice 1. Admin đăng ký sự kiện lên Blockchain (hoặc tùy chọn tự động tạo khi claim)
    function createEvent(string memory _eventId, uint256 _capacity) external onlyAdmin {
        require(bytes(_eventId).length > 0, "ClubPOAP: Thieu eventId");
        require(_capacity > 0, "ClubPOAP: So luong phai > 0");
        require(!events[_eventId].exists, "ClubPOAP: Su kien da ton tai");

        events[_eventId] = EventInfo({
            capacity: _capacity,
            currentAttendees: 0,
            exists: true
        });

        emit EventCreated(_eventId, _capacity, msg.sender);
    }

    /// @notice 2. Sinh viên gọi hàm này để đúc (Mint) Soulbound NFT về ví
    function claimBadge(string memory _eventId, string memory _tokenURI) external returns (uint256) {
        require(bytes(_eventId).length > 0, "ClubPOAP: Thieu eventId");
        require(bytes(_tokenURI).length > 0, "ClubPOAP: Thieu tokenURI");
        require(!claimed[_eventId][msg.sender], "ClubPOAP: Vi nay da nhan huy hieu su kien nay");

        // Nếu sự kiện đã được Admin đăng ký on-chain trước thì kiểm tra giới hạn capacity
        if (events[_eventId].exists) {
            require(
                events[_eventId].currentAttendees < events[_eventId].capacity,
                "ClubPOAP: Su kien da du so luong tham du"
            );
            events[_eventId].currentAttendees += 1;
        } else {
            // Fallback an toàn: Nếu sự kiện tạo ở MongoDB từ trước khi deploy contract,
            // vẫn cho phép mint và tự khởi tạo bản ghi on-chain để demo không bị lỗi revert
            events[_eventId] = EventInfo({
                capacity: 1000,
                currentAttendees: 1,
                exists: true
            });
        }

        claimed[_eventId][msg.sender] = true;

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        studentTokenId[_eventId][msg.sender] = tokenId;

        // Phát sự kiện khóa Soulbound chuẩn ERC-5192
        emit Locked(tokenId);
        emit BadgeClaimed(_eventId, msg.sender, tokenId, _tokenURI);

        return tokenId;
    }

    /// @notice Kiểm tra trạng thái khóa chuẩn ERC-5192 (Luôn trả về true vì là Soulbound)
    function locked(uint256 tokenId) external view override returns (bool) {
        require(_ownerOf(tokenId) != address(0), "ClubPOAP: Token khong ton tai");
        return true;
    }

    /// @dev Chặn mọi hành vi chuyển nhượng (Transfer) giữa các ví, chỉ cho phép Mint (from == address(0))
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("ClubPOAP: Soulbound Token khong the chuyen nhuong!");
        }
        return super._update(to, tokenId, auth);
    }

    /// @dev Khai báo hỗ trợ interface chuẩn ERC-5192 (0xb45a3c0e)
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }
}