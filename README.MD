# phone-carrier
## Installation
```
npm install phone-carrier
```
## Description
- Use it as you would the google's libphonenumber's PhoneNumberToCarrierMapper in Java
- Uses libphonenumber-js
- Is a TypeScript rendition of the Java version of libphonenumber's PhoneNumberToCarrierMapper because the JavaScript version of libphonenumber didn't have a PhoneNumberToCarrierMapper

## Quick Start / API
```js
// Example 1: ESM and await syntax
import PhoneNumberToCarrierMapper from 'phone-carrier';
async function lookup(msisdn) {
    const mapper = PhoneNumberToCarrierMapper.getInstance()
    const carrierName = await mapper.getNameForValidNumber(msisdn)
    return carrierName 
}

lookup(`+41798765432`) // Swisscom
```
```js
// Example 2: common-js and promise syntax
const { PhoneNumberToCarrierMapper } = require('phone-carrier')

const mapper = PhoneNumberToCarrierMapper.getInstance()
mapper.getNameForValidNumber(`+917897888888`).then(console.log) // AirTel
```
- https://github.com/featurerich1/phone-carrier
- https://featurerich1.github.io