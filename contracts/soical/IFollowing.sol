// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/introspection/IERC165.sol";

/**
 * @dev Required interface of following logic for social media
 */
interface IFollowing is IERC165 {

    /**
     * @dev emitted when `follower` address follows `followee` address
     */
    event Following(address indexed follower, address indexed followee);

    /**
     * @dev emitted when `follower` address unfollows `followee` address
     */
    event Unfollowing(address indexed follower, address indexed followee);

    function listFollowers(address account, int page, int limit) external view returns (address[] memory);

    /**
     * following to the follower's address
     */
    function follow(address follower) external;

    /**
     * unfollowing to the follower's address
     */
    function unfollow(address follower) external;
}