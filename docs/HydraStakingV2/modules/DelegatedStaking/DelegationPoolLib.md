# DelegationPoolLib

*Rosen Santev (Based Polygon Technology&#39;s RewardPoolLib)*

> Delegation Pool Lib

library for handling delegators and their rewards Each validator has a Delegation Pool. The rewards that a validator receives are split between the validator and the delegators of that validator. The pool holds the delegators&#39; share of the rewards, and maintains an accounting system for determining the delegators&#39; shares in the pool. Rewards, whether to a validator (from stake) or to a delegator, do not autocompound, as to say that if a validator has a stake of 10 and earns 1 in rewards, their stake remains 10, and they have a separate one in rewards.





