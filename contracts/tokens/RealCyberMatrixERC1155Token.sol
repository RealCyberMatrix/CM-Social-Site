// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "../roles/SignerRole.sol";
import "../interface/ERC1155Base.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";

contract RealCyberMatrixERC1155Token is ERC1155Base, SignerRole {
    
    using ECDSA for bytes32;

    string public name;
    string public symbol;

    /**
     * @dev Constructor Function
     * @param _name name of the token ex: Rarible
     * @param _symbol symbol of the token ex: RARI
     * @param _signer address of signer account
     * @param _tokenURIPrefix token URI Prefix
     * @param _uri ex: https://ipfs.daonomic.com
    */
    constructor(string memory _name, string memory _symbol, address _signer, string memory _tokenURIPrefix, string memory _uri) ERC1155Base(_tokenURIPrefix, _uri) public {
        name = _name;
        symbol = _symbol;

        addAdmin(_msgSender());
        addSigner(_msgSender());
        addSigner(_signer);
        _registerInterface(bytes4(keccak256('MINT_WITH_ADDRESS')));
    }

    function mint(bytes memory _signature, uint256 _supply, string memory _uri) public {
        require(
            isSigner(
                keccak256(abi.encodePacked(address(this), _msgSender()))
                    .toEthSignedMessageHash()
                    .recover(_signature)
            )
            ,"invalid signature"
        );
        _mint(_supply, _uri);
    }
}