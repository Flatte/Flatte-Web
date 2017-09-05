# Welcome to Flatte
![Flatte Logo](https://flatte.maxabab.com/assets/images/logos/flatte%20logo_Header.png "Flatte Logo") BETA

Client-Side NOSql Firebase Realtime Database modeling and management system. (only with angularjs for now...)

### Attention!
This is a beta release. We have not finished all the tests yet.
Some functions may not work as expected.

**We do not recommend using flatte in your actual projects.**

> _For detailed explanation, please checkout our **[wiki](https://github.com/Flatte/Flatte-Web/wiki)**_

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

There are not many prerequisites required to build and run this project, but you'll need the following:

* Firebase
* AngularJs

## Flatte Manifest Builder 
Easy and free registration
[Flatte Manifesto Builder](https://flatte.maxabab.com)

## How to use
### Install
##### CDN
	<script type="text/javascript" src="https://cdn.rawgit.com/Flatte/Flatte-Web/1.0.1-beta.86/dist/flatte.min.js"></script>
##### Bower
	$ bower install flatte
If you don't want to use bower or cdn, you can manually download the latest version of [flatte.min.js](https://raw.githubusercontent.com/Flatte/Flatte-Web/master/dist/flatte.min.js). 

### Basic Usage

Inject flatte in your angularjs module.
```javascript
angular.module('myApp',['mx.flatte']);
```

Set configurations.
```javascript
angular.module('myApp').run(['flatte',function(flatte){
  flatte.settings({
    debug: false,
    baseRef: "/",
    con: firebase,
    manifest: {},
    predefined: {
      ".true": true,
      ".false": false,
      ".null": null,
      ".timestamp": firebase.database.ServerValue.TIMESTAMP
    }
  });
}])
```

#### Understranding Flatte Manifest
Every node has "_q" and "childs" property. "_q" contains node's own options.
```javascript
flatt.settings().manifest = {
  "foo":{
    "_q":{},      // define action specifications of this node. (ID, saveValue, deleteValue, copy, externalEffect, function)
    "childs":{    // contains children of "foo" node
      "bar":{"_q":{},"childs":{}},
      "baz":{"_q":{},"childs":{}}
    }
  }
}
```
For more information about manifest structure and how to use, please visit our [wiki](https://github.com/Flatte/Flatte-Web/wiki)


#### Example
Defined manifest in settings.
```json
{
  "customers": {
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
```
Sending save data to flatte.
```javascript
angular.module('myApp').controller('myCtrl',['flatte',function(flatte){
  flatte.do([{
    ref:"customer/-KrvGZuVwqwerty",
    data:{"firstName":"Elon","lastName": "Musk","twitter": "@elonmusk"}
  }]);
}]);
```

##### [Example fiddle](https://jsfiddle.net/micanose/pq8t5unx/)

##### Results
| Incoming data                                    | Recorded data                                    |
|--------------------------------------------------|--------------------------------------------------|
| customer/-KrvGZuVwqwerty/firstName:"Elon"         | customer/-KrvGZuVwqwerty/firstName:"**ELON**"     |
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
