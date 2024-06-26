// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

error Unauthorized(string only);
error StakeRequirement(string src, string msg);
error DelegateRequirement(string src, string msg);
error InvalidSignature(address signer);
error ZeroAddress();
error SendFailed();
