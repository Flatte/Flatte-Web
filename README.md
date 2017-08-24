# Welcome to Flatte
![alt text](https://flatte.maxabab.com/assets/images/logos/flatte%20logo_Header.png "Flatte Logo")

Client-Side nosql Firebase Realtime Database save management. 

### Attention!
This is a beta release. We have not finished all the tests yet.
Some functions may not work as expected.
**We do not recommend using flatte in your actual projects.**

## Demo 
Easy and free registration
[Flatte Manifesto Builder](https://flatte.maxabab.com)

## Example
#### Javascript Code
```javascript
flatte.do([
  {
    Ref:"customer/-KrvGZuVwqwerty",
    data:{"firsName":"Elon","lastName": "Musk","twitter": "@elonmusk"}
  }
]);
```

#### Manifesto Json
```javascript
{
  data:{
    "customer": {
      "childs": {
        "customerID": {
          "_q": {
            "ID": true
          }
          "childs": {
            "firstName": {
              "_q": {
                "saveValue": {"filter": "uppercase"},
                "deleteValue": ".auth",
                "copy":[{"saveValue": "$","deleteValue": "null","path": "/contact/#customerID/firstName"}]
              }
            }
          }
        }
      }
    }
  },
  id_index{
    "customer>ID":"customerID"
  }
}
```
#### Results
| Incoming data                                    | Recorded data                                    |
|--------------------------------------------------|--------------------------------------------------|
| customer/-KrvGZuVwqwerty/firsName:"Elon"         | customer/-KrvGZuVwqwerty/firsName:"**ELON**"     |
| customer/-KrvGZuVwqwerty/lastName:"Musk"         | customer/-KrvGZuVwqwerty/lastName:"Musk"         |
| customer/-KrvGZuVwqwerty/twitter:"@elonmusk"     | customer/-KrvGZuVwqwerty/twitter:"@elonmusk"     |
|                                                  | **contact/-KrvGZuVwqwerty/firsName:"Elon"**      |



![alt text](https://flatte.maxabab.com/assets/images/welcome/flatte_screen/full.png "Flatte Manifesto Builder")

## License
- Flatte is licensed under the MIT license.
  - [http://opensource.org/licenses/MIT](http://opensource.org/licenses/MIT)
