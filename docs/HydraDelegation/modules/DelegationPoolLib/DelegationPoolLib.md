# DelegationPoolLib

*Rosen Santev (Based Polygon Technology&#39;s RewardPoolLib)*

> Delegation Pool Lib

library for handling delegators and their rewards Each staker has a Delegation Pool. The rewards that a staker receives are split between the staker and the delegators of that staker. The pool holds the delegators&#39; share of the rewards, and maintains an accounting system for determining the delegators&#39; shares in the pool. Rewards, whether to a staker (from stake) or to a delegator, do not autocompound, as to say that if a staker has a stake of 10 and earns 1 in rewards, their stake remains 10, and they have a separate one in rewards.





