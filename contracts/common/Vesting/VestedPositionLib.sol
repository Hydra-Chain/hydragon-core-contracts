// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {VestingPosition} from "./IVesting.sol";

library VestedPositionLib {
    /**
     * @notice Check if the current time is between start and end time of the position
     * @param position Vesting position
     * @return bool Returns true if the position is active
     */
    function isActive(VestingPosition memory position) internal view returns (bool) {
        return position.start <= block.timestamp && block.timestamp < position.end;
    }

    /**
     * @notice Check if the current time is between end of the position, but not all rewards are matured yet (needs double duration for maturing)
     * @param position Vesting position
     * @return bool Returns true if the position is maturing
     */
    function isMaturing(VestingPosition memory position) internal view returns (bool) {
        uint256 vestingEnd = position.end;
        uint256 matureEnd = vestingEnd + position.duration;

        return vestingEnd <= block.timestamp && block.timestamp < matureEnd;
    }

    /**
     * @notice Returns true if the staker/delegator is an active vesting position or not all rewards from the latest active position are matured yet
     * @param position Vesting position
     * @return bool Returns true if the position is in vesting cycle
     */
    function isInVestingCycle(VestingPosition memory position) internal view returns (bool) {
        uint256 matureEnd = position.end + position.duration;
        return position.start <= block.timestamp && block.timestamp < matureEnd;
    }
}
