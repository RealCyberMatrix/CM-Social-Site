// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./ERC1155Metadata_URI.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";


abstract contract ERC1155Base is Ownable, ERC1155Metadata_URI, ERC1155 {
    // id => creator
    mapping (uint256 => address) public _creators;
    mapping (uint256 => uint256) public _supplies;

    uint256[] private _tokenIds;

    constructor(string memory tokenURIPrefix, string memory uri) ERC1155Metadata_URI(tokenURIPrefix) ERC1155(uri) public {

    }

    function _mint(uint256 _supply, string memory _uri) internal {
        uint256 _id = _tokenIds.length;

        require(_creators[_id] == address(0x0), "Token is already minted");
        require(_supply != 0, "Supply should be positive");
        require(bytes(_uri).length > 0, "uri should be set");

        _creators[_id] = msg.sender;
        _mint(msg.sender, _id, _supply, "");
        _tokenIds.push(_id);
        _supplies[_id] = _supply;
        _setTokenURI(_id, _uri);

        // Transfer event with mint semantic
        emit URI(_uri, _id);
    }

    function burn(address _owner, uint256 _id, uint256 _value) external {

        require(_owner == msg.sender || isApprovedForAll(_owner, msg.sender) == true, "Need operator approval for 3rd party burns.");

        _burn(_owner, _id, _value);
        _supplies[_id] = _supplies[_id] - _value; // _burn method already checked the negative amount
    }

    function _setTokenURI(uint256 tokenId, string memory uri) override virtual internal {
        require(_creators[tokenId] != address(0x0), "_setTokenURI: Token should exist");
        super._setTokenURI(tokenId, uri);
    }

    function setTokenURIPrefix(string memory tokenURIPrefix) public onlyOwner {
        _setTokenURIPrefix(tokenURIPrefix);
    }

    function uri(uint256 _id) override(ERC1155Metadata_URI, ERC1155) external view returns (string memory) {
        return _tokenURI(_id);
    }


    function uriBatch(uint256[] memory ids) public view returns (string[] memory) {
        string[] memory result = new string[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = _tokenURI(ids[i]);
        }
        return result;
    }

    function supplyBatch(uint256[] memory ids) public view returns (uint256[] memory) {
        uint256[] memory supplies = new uint256[](ids.length);
        for (uint256 i = 0; i < ids.length; ++i) {
            supplies[i] = _supplies[ids[i]];
        }
        return supplies;
    }

    function creatorBatch(uint256[] memory ids) public view returns (address[] memory) {
        address[] memory creators = new address[](ids.length);
        for (uint256 i = 0; i < ids.length; ++i) {
            creators[i] = _creators[ids[i]];
        }
        return creators;
    }

    // return non-zero-supply tokenIds
    function getTokenIds() public view returns (uint256[] memory) {
        uint256 length = 0;
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            if (_supplies[_tokenIds[i]] > 0) {
                length++;
            }
        }

        uint256[] memory result = new uint256[](length);

        uint256 resultIdx = 0;
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            if (_supplies[_tokenIds[i]] > 0) {
                result[resultIdx] = _tokenIds[i];   // push is not available for memory
                resultIdx++;
            }
        }
        return result;
    }
}