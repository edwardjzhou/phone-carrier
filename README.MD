# phone-carrier
## Installation
```
npm install phone-carrier
```
## Description
- The use cases are exactly the same as google's libphonenumber's PhoneNumberToCarrierMapper.
- Uses libphonenumber-js 
- Is a TypeScript rendition of the Java version of libphonenumber's PhoneNumberToCarrierMapper because the JavaScript version of libphonenumber didn't have a PhoneNumberToCarrierMapper.

## Quick Start / API
```js
import PhoneNumberToCarrierMapper from 'phone-carrier';
async function lookup(msisdn) {
    const mapper = PhoneNumberToCarrierMapper.getInstance()
    const carrierName = await mapper.getNameForValidNumber(msisdn)
    return carrierName 
}

lookup(`+41798765432`) // Swisscom
```

- https://codepen.io/davidkpiano/pen/RjaBpW
- https://featurerich1.github.com