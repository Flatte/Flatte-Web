# Welcome to Flatte
![alt text](https://flatte.maxabab.com/assets/images/logos/flatte%20logo_Header.png "Flatte Logo")

Client-Side nosql Firebase Realtime Database save management. 

### Attention!
This is a beta work. Not all tests were done.
They may have malfunctioning functions.
<span style="color:red">We do not recommend using it in your actual projects.</span>

## Demo
[Flatte Manifesto Builder](https://flatte.maxabab.com)

## Example
#### Javascript Code
```javascript
flatte.do([
  Ref:"customer",
  data:{"-KrvGZuVwqwerty":{"firsName":"Elon","lastName": "Musk","twitter": "@elonmusk"}}
]);
```

#### Manifesto Json
```javascript
{
  "customer": {
    "childs": {
      "customerID": {"_q": {
          "ID": true
        }
        "childs": {
          "firstName": {"_q": {
              "saveValue": {"filter": "uppercase"},
              "deleteValue": ".auth",
              "copy":[{"saveValue": "$","deleteValue": "null","path": "/contact/#customerID/firstName"}]
}}}}}}}
```
#### Finish
| Incoming data                                    | Recorded data                                    |
|--------------------------------------------------|--------------------------------------------------|
| Customer/-KrvGZuVwqwerty/firsName:"Elon"         | Customer/-KrvGZuVwqwerty/firsName:"**ELON**"     |
| Customer/-KrvGZuVwqwerty/lastName:"Musk"         | Customer/-KrvGZuVwqwerty/lastName:"Musk"         |
| Customer/-KrvGZuVwqwerty/twitter:"@elonmusk"     | Customer/-KrvGZuVwqwerty/twitter:"@elonmusk"     |
|                                                  | **Contact/-KrvGZuVwqwerty/firsName:"Elon"**      |

![alt text](https://flatte.maxabab.com/assets/images/welcome/flatte_screen/full.png "Flatte Manifesto Builder")

## License
- Flatte is licensed under the MIT license.
  - [http://opensource.org/licenses/MIT](http://opensource.org/licenses/MIT)
