# Welcome to Flatte

Client-Side nosql Firebase Realtime Database save management. 

## Demo
[Flatte Manifesto Builder](https://flatte.maxabab.com)
![alt text](https://flatte.maxabab.com/assets/images/welcome/flatte_screen/full.png "Flatte Manifesto Builder")

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

## License
- Flatte is licensed under the MIT license.
  - [http://opensource.org/licenses/MIT](http://opensource.org/licenses/MIT)
