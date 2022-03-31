// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// only support ERC1155
contract ERC1155Market is ERC1155Holder, Ownable {
	using Counters for Counters.Counter;
	Counters.Counter private _itemIds;

	uint256 private _serviceCharge; // a percentage >= 0 and <= 1000, allow 0 percent service charge

	constructor(uint256 serviceCharge) public {
		require(
			serviceCharge >= 0 && serviceCharge <= 1000,
			"Service Charge must be 0~1000"
		);

		_serviceCharge = serviceCharge;
	}

	function setServiceCharge(uint256 serviceCharge) public onlyOwner {
		require(
			serviceCharge >= 0 && serviceCharge <= 1000,
			"Service Charge must be 0~1000"
		);
		_serviceCharge = serviceCharge;
	}

	function getServiceCharge() public view returns (uint256) {
		return _serviceCharge;
	}

	struct MarketItem {
		uint256 itemId;
		address nftContract;
		uint256 tokenId;
		uint256 amount;
		address payable seller;
		uint256 price;
		bool sold; // sold out
	}

	mapping(uint256 => MarketItem) private idToMarketItem;

	event MarketItemCreated(
		uint256 indexed itemId,
		address indexed nftContract,
		uint256 indexed tokenId,
		uint256 amount,
		address seller,
		uint256 price,
		bool sold
	);

	event MarketItemSold(
		uint256 indexed itemId,
		address indexed nftContract,
		uint256 indexed tokenId,
		uint256 amount,
		address seller,
		address buyer,
		uint256 price
	);

	/* Places an item for sale on the marketplace */
	// seller calls this method to list an token
	// before seller calls this method, the seller should call setApprovalForAll first
	function createMarketItem(
		address nftContract,
		uint256 tokenId,
		uint256 amount,
		uint256 price,
		bytes memory data
	) public {
		require(price >= 1000, "Price must be at least 1000 wei");
		require(amount > 0, "Amount must be at least 1");

		uint256 balance = IERC1155(nftContract).balanceOf(msg.sender, tokenId);
		require(balance >= amount, "Not enough token balance");

		bool isApproved = IERC1155(nftContract).isApprovedForAll(
			msg.sender,
			address(this)
		);
		require(isApproved, "Not allowed to move your token");

		uint256 itemId = _itemIds.current();

		idToMarketItem[itemId] = MarketItem(
			itemId,
			nftContract,
			tokenId,
			amount,
			payable(msg.sender),
			price,
			false
		);
		_itemIds.increment();

		// transfer seller's tokens to this contract
		// prerequisite seller should set approve for all for this contract address
		IERC1155(nftContract).safeTransferFrom(
			msg.sender,
			address(this),
			tokenId,
			amount,
			data
		);

		emit MarketItemCreated(
			itemId,
			nftContract,
			tokenId,
			amount,
			msg.sender,
			price,
			false
		);
	}

	function depositeTokenToMarketItem(
		uint256 itemId,
		uint256 amount,
		bytes memory data
	) public {
		require(
			idToMarketItem[itemId].seller == msg.sender,
			"Not allowed to perform"
		);
		require(amount > 0, "Amount must > 0");

		uint256 balance = IERC1155(idToMarketItem[itemId].nftContract)
			.balanceOf(msg.sender, idToMarketItem[itemId].tokenId);
		require(balance >= amount, "Not enough token balance");

		bool isApproved = IERC1155(idToMarketItem[itemId].nftContract)
			.isApprovedForAll(msg.sender, address(this));
		require(isApproved, "Not allowed to move your token");

		IERC1155(idToMarketItem[itemId].nftContract).safeTransferFrom(
			msg.sender,
			address(this),
			idToMarketItem[itemId].tokenId,
			amount,
			data
		);

		idToMarketItem[itemId].amount = idToMarketItem[itemId].amount + amount;
		if (idToMarketItem[itemId].amount > 0) {
			idToMarketItem[itemId].sold = false;
		}
	}

	function withdrawMarketItem(
		uint256 itemId,
		uint256 amount,
		bytes memory data
	) public {
		require(
			idToMarketItem[itemId].seller == msg.sender,
			"Not allowed to perform"
		);
		require(
			idToMarketItem[itemId].amount >= amount,
			"Not enough token on sale"
		);

		// withdraw listed token to seller's account
		// prerequisite seller should set approve for all for this contract address
		IERC1155(idToMarketItem[itemId].nftContract).safeTransferFrom(
			address(this),
			msg.sender,
			idToMarketItem[itemId].tokenId,
			amount,
			data
		);

		idToMarketItem[itemId].amount = idToMarketItem[itemId].amount - amount;
		if (idToMarketItem[itemId].amount == 0) {
			idToMarketItem[itemId].sold = true;
		}
	}

	/* Creates the sale of a marketplace item */
	/* Transfers ownership of the item, as well as funds between parties */
	// buyer calls this method to buy
	function createMarketSale(
		uint256 itemId,
		uint256 amount,
		bytes memory data
	) public payable {
		require(
			msg.value == idToMarketItem[itemId].price * amount,
			"Amount paid is not correct"
		);
		require(
			amount <= idToMarketItem[itemId].amount,
			"Not enough inventory"
		);

		IERC1155(idToMarketItem[itemId].nftContract).safeTransferFrom(
			address(this),
			msg.sender,
			idToMarketItem[itemId].tokenId,
			amount,
			data
		);

		idToMarketItem[itemId].amount = idToMarketItem[itemId].amount - amount;
		if (idToMarketItem[itemId].amount == 0) {
			idToMarketItem[itemId].sold = true;
		}

		idToMarketItem[itemId].seller.transfer(
			(msg.value / 1000) * (1000 - _serviceCharge)
		);

		if ((msg.value / 1000) * _serviceCharge > 0) {
			payable(owner()).transfer((msg.value / 1000) * _serviceCharge);
		}

		emit MarketItemSold(
			itemId,
			idToMarketItem[itemId].nftContract,
			idToMarketItem[itemId].tokenId,
			amount,
			idToMarketItem[itemId].seller,
			msg.sender,
			idToMarketItem[itemId].price
		);

		// TODO: support 2nd sale interest to token creators
	}

	/* Returns all unsold market items */
	function fetchMarketItems() public view returns (MarketItem[] memory) {
		uint256 itemCount = _itemIds.current();
		uint256 unsoldItemCount = 0;
		for (uint256 i = 0; i < itemCount; i++) {
			if (!idToMarketItem[i].sold) {
				unsoldItemCount++;
			}
		}

		uint256 currentIndex = 0;
		MarketItem[] memory items = new MarketItem[](unsoldItemCount);
		for (uint256 i = 0; i < itemCount; i++) {
			if (!idToMarketItem[i].sold) {
				items[currentIndex] = idToMarketItem[i];
				currentIndex++;
			}
		}
		return items;
	}

	/* Returns all unsold market items for a particular token */
	function fetchMarketItemsByToken(address nftContract, uint256 tokenId)
		public
		view
		returns (MarketItem[] memory)
	{
		uint256 totalItemCount = _itemIds.current();
		uint256 itemCount = 0;

		for (uint256 i = 0; i < totalItemCount; i++) {
			if (
				idToMarketItem[i].nftContract == nftContract &&
				idToMarketItem[i].tokenId == tokenId &&
				!idToMarketItem[i].sold
			) {
				itemCount += 1;
			}
		}

		uint256 currentIndex = 0;
		MarketItem[] memory items = new MarketItem[](itemCount);
		for (uint256 i = 0; i < totalItemCount; i++) {
			if (
				idToMarketItem[i].nftContract == nftContract &&
				idToMarketItem[i].tokenId == tokenId &&
				!idToMarketItem[i].sold
			) {
				items[currentIndex] = idToMarketItem[i];
				currentIndex += 1;
			}
		}
		return items;
	}

	/* Returns only items a user has created */
	function fetchItemsCreated(address seller)
		public
		view
		returns (MarketItem[] memory)
	{
		uint256 totalItemCount = _itemIds.current();
		uint256 itemCount = 0;

		for (uint256 i = 0; i < totalItemCount; i++) {
			if (idToMarketItem[i].seller == seller) {
				itemCount += 1;
			}
		}

		uint256 currentIndex = 0;
		MarketItem[] memory items = new MarketItem[](itemCount);
		for (uint256 i = 0; i < totalItemCount; i++) {
			if (idToMarketItem[i].seller == seller) {
				items[currentIndex] = idToMarketItem[i];
				currentIndex += 1;
			}
		}
		return items;
	}
}
