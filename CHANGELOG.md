# Changelog

## Pending

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:

BUG FIXES:

## v1.0.4

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:

BUG FIXES:
- pubKeys getter for backwards compatibility

## v1.0.3

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:
- Signing API factored out, allowing a slimmer library for UAL type libraries which do not need the extra baggage of havimg eosjs bundled in.

BUG FIXES:
- Filters unexpected responses from the WAX backend that may erroneously come more than once

## v1.0.2

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:
- Made the default verifier function more flexible so as to allow ram purchase actions to be injected into boosted transactions

BUG FIXES:

## v1.0.1

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:

BUG FIXES:
- Make the constructor arguments aside from rpc endpoint optional to improve usage and reduce typescript warnings

## v1.0.0

BREAKING CHANGES:
- Constructor accepts an initialization object rather than a list

FEATURES:
- Ability for WAX to inject a noop to manage bandwidth for waxjs users and contracts

IMPROVEMENTS:

BUG FIXES:

## v0.0.15

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:

BUG FIXES:
- Fix for "new transaction" and "not iterable" errors when signing transactions

## v0.0.14

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:

BUG FIXES:
- Improved error reporting when signing fails or is dismissed by the user

## v0.0.13

BREAKING CHANGES:

FEATURES:
- Optional signing capacity for an API provider to pay for a user's CPU/NET via ONLY_BILL_FIRST_AUTHORIZER

IMPROVEMENTS:

## v0.0.12

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:
- don't fail on alternate origin

## v0.0.11

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS: 
- [KEW-1816] Attempt to auto-login when waxjs is instantiated

BUG FIXES:

## v0.0.10

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:

BUG FIXES:
- [KEW-1806] Fix default params for typescript and make api member public

## v0.0.9

BREAKING CHANGES:
- [KEW-1804] Accept initialization with account and pubkeys

FEATURES:

IMPROVEMENTS:

BUG FIXES:

## v0.0.8

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:
- [KEW-1801] Only autologin on chrome

BUG FIXES:
- Fix for whitelists not getting set by some browsers. Ex Brave

## v0.0.7

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:
- [KEW-1776] Whitelisted actions and auto sign-in

BUG FIXES:

## v0.0.6

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:

BUG FIXES:
- lint for publishing

## v0.0.5

BREAKING CHANGES:

FEATURES:

IMPROVEMENTS:

BUG FIXES:
- [KEW-1724] Opening sign dialog not working on safari

## v0.0.4

BREAKING CHANGES:

FEATURES:
- [KEW-1582] Project Boilerplate
- [KEW-1706] defaults point to prod instances, reorder init params, cloud-wallet path, api tweaks
- [KEW-1701] docs

IMPROVEMENTS:
- [KEW-1716] npom and yarn installation

BUG FIXES:
- [] Fix multiple signatures
- [KEW-1726] Login not working on firefox
