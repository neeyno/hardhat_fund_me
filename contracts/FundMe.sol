//SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();
error FundMe__CallFailed();
error FundMe__NotEnoughETH();

// Interfaces or Lirbaries

/** @title A contract for crowd funding
 *  @author anon
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implement Price feeds as our library
 */
contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MIN_USD = 50 * 1e18; // constant vars don's take a storage slot
    address private immutable i_owner; // i_ - immutable
    address[] private s_funders;
    mapping(address => uint256) private s_funderToAmount;
    AggregatorV3Interface private s_priceFeed; // s_ - means storage variable

    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // functions order:
    // constructor > receive > fallback > external >
    // > public > internal > private > view/pure

    constructor(address priceFeedAddress) {
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
        i_owner = msg.sender;
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     * @notice This function funds this contract
     * @dev ...
     */
    function fund() public payable {
        // require(
        //     msg.value.getConversionRate(s_priceFeed) >= MIN_USD,
        //     "Not enough eth"
        // );
        if (msg.value.getConversionRate(s_priceFeed) < MIN_USD)
            revert FundMe__NotEnoughETH();
        s_funderToAmount[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public payable onlyOwner {
        for (uint256 i; i < s_funders.length; i++) {
            address funder = s_funders[i];
            s_funderToAmount[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        //require(callSuccess, "Call failed");
        if (!callSuccess) revert FundMe__CallFailed();
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        // mappings can't be in memory!!!

        for (uint256 i; i < funders.length; i++) {
            s_funderToAmount[funders[i]] = 0;
        }

        s_funders = new address[](0);
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        //require(callSuccess, "Call failed");
        if (!callSuccess) revert FundMe__CallFailed();
    }

    // getters // view/pure functions - at the bottom
    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAmountFunded(address funder) public view returns (uint256) {
        return s_funderToAmount[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
