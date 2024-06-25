// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {VestingPosition} from "./IVesting.sol";

library VestedPositionLib {
    function isActive(VestingPosition memory position) internal view returns (bool) {
        return position.start < block.timestamp && block.timestamp < position.end;
    }

    function isMaturing(VestingPosition memory position) internal view returns (bool) {
        uint256 vestingEnd = position.end;
        uint256 matureEnd = vestingEnd + position.duration;

        return vestingEnd < block.timestamp && block.timestamp < matureEnd;
    }

    /**
     * Returns true if the staker is an active vesting position or not all rewards from the latest
     *  active position are matured yet
     * @param position Vesting position
     */
    function isInVestingCycle(VestingPosition memory position) internal view returns (bool) {
        uint256 matureEnd = position.end + position.duration;
        return position.start < block.timestamp && block.timestamp < matureEnd;
    }
}
