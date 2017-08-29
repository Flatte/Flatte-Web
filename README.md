# Welcome to Flatte
![Flatte Logo](https://flatte.maxabab.com/assets/images/logos/flatte%20logo_Header.png "Flatte Logo") BETA

Client-Side nosql Firebase Realtime Database save management. 

### Attention!
This is a beta release. We have not finished all the tests yet.
Some functions may not work as expected.

**We do not recommend using flatte in your actual projects.**

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

There are not many prerequisites required to build and run this project, but you'll need the following:

* Firebase
* AngularJs

### Installing
Coming soon...

## Demo 
Easy and free registration
[Flatte Manifesto Builder](https://flatte.maxabab.com)

## Basic Usage
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
```json
{
  "data":{
    "customer": {
      "childs": {
        "customerID": {
          "_q": {
            "ID": true
          },
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



![Flatte Example Photo](https://flatte.maxabab.com/assets/images/welcome/flatte_screen/full.png "Flatte Manifesto Builder")

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [Flatte Web Tags](https://github.com/Flatte/Flatte-Web/tags). 


## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Sezer Ekinci** - *Initial work* - [@micanose](https://github.com/micanose)
* **Kaan Ekinci** - *Initial work* - [@kaanekinci](https://github.com/kaanekinci)

See also the list of [contributors](https://github.com/Flatte/Flatte-Web/graphs/contributors) who participated in flatte.

## License
- Flatte is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
  - [http://opensource.org/licenses/MIT](http://opensource.org/licenses/MIT)
