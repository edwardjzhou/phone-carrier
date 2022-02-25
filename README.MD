# phone-carrier
## Installation
```
npm install phone-carrier
```
## Description
- Use it as you would Google's libphonenumber's PhoneNumberToCarrierMapper in Java
- Is a TypeScript rendition of PhoneNumberToCarrierMapper because the JavaScript version of libphonenumber on NPM didn't have a PhoneNumberToCarrierMapper
- Batteries included. Mobile carrier names are read from included binary-encoded files.
- Has no error handling (we read from files). Be sure to try-catch your async functions and .catch your promises.
- Depends upon NPM package libphonenumber-js
## Quick Start / API
```js
// Example 1: ESM and await syntax
import PhoneNumberToCarrierMapper from 'phone-carrier';

async function lookup(msisdn) {
    const mapper = PhoneNumberToCarrierMapper.getInstance();
    const carrierName = await mapper.getNameForValidNumber(msisdn);
    return carrierName;
}
console.log(lookup(`+41798765432`)); // Swisscom
```
```js
// Example 2: CommonJS and promise syntax
const { PhoneNumberToCarrierMapper } = require('phone-carrier')

const mapper = PhoneNumberToCarrierMapper.getInstance()
mapper.getNameForValidNumber(`+917897888888`).then(console.log) // AirTel
```
- https://github.com/featurerich1/phone-carrier
- https://featurerich1.github.io