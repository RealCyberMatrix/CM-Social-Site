// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
// import "../tokens/ERC1155Metadata_URI.sol";
import "./IFollowing.sol";

import "hardhat/console.sol";

/**
 *
 * @dev Implementation of the following logic based on ERC1155.
 *
 */
contract ERC1155Following is ERC1155, IFollowing {
    using Address for address;
    
    // only support uint256 => address
    using EnumerableSet for EnumerableSet.AddressSet;

    string public name;
    string public symbol;
    // followers: token_id (followee's address as uint32) => a set of follower addresses
    mapping(uint256 => EnumerableSet.AddressSet) private _followersMap;

    /*
     *     
     *     bytes4(keccak256('listFollowers(address account, int page, int limit)')) == 0x59ce1ff0
     *     bytes4(keccak256('follow(address)')) == 0x4dbf27cc
     *     bytes4(keccak256('unfollow(address)')) == 0x015a4ead
     *     
     *     https://emn178.github.io/online-tools/keccak_256.html
     *     
     *     => 0x59ce1ff0 ^ 0x4dbf27cc ^ 0x015a4ead == 0x152b7691
     */
    bytes4 private constant _INTERFACE_ID_FOLLOWING = 0x152b7691;

    constructor (string memory _name, string memory _symbol, string memory uri_) public ERC1155(uri_) {
        // register the support interfaces to conform to IFollowing via ERC165
        name = _name;
        symbol = _symbol;
        _registerInterface(_INTERFACE_ID_FOLLOWING);
    }

    /* IFollowing Implementation */
    function listFollowers(address account, int page, int limit) external view virtual override returns (address[] memory) {
        uint256 tokenId = uint256(account);
        uint256 length = _followersMap[tokenId].length();
        uint256 start = uint256(page * limit);
        uint256 end = start + uint256(limit);
        if (end > length) { end = length; }
        if (start >= end || start < 0) { return new address[](0); }
        address[] memory results = new address[](end-start);
        for (uint256 i = start; i < end; i++) {
           results[i-start] = _followersMap[tokenId].at(i);  
        }
        return results;
    }

    function follow(address follower) external override {
        uint256 tokenId = uint256(follower);
        address account = _msgSender();
        // the same address can't be followed more than once.
        require(balanceOf(account, tokenId) < 1 && !_followersMap[tokenId].contains(account), 
            "following relation exists"
        );
        _mint(account, tokenId, 1, "");
        _followersMap[tokenId].add(account);
        emit Following(account, follower);
    }

    function unfollow(address follower) external override {
        uint256 tokenId = uint256(follower);
        address account = _msgSender();
        // the same address can't be followed more than once.
        require(balanceOf(account, tokenId) == 1 && _followersMap[tokenId].contains(account), 
           "following relation doesn't exist"
        );
        _burn(account, tokenId, 1);
        _followersMap[tokenId].remove(account);
        emit Unfollowing(account, follower);
    }
}
