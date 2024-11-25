# DelegationPoolLib

*Rosen Santev (Based on Polygon Technology&#39;s RewardPoolLib)*

> Delegation Pool Library

This library is used for managing delegators and their rewards within a staking pool. Each staker has a Delegation Pool that tracks delegators&#39; shares of the staker&#39;s rewards. This version supports reward claims based on previous balance states, thanks to the historical `delegatorsParamsHistory` tracking. Rewards do not auto-compound. If a staker has a stake of 10 and earns 1 reward, their stake remains 10, with the rewards tracked separately.





