var config = {
	apiKey: "<your-apiKey>",
	authDomain: "<your-authDomain>",
	databaseURL: "<your-databaseURL>",
	projectId: "<your-projectId>",
	storageBucket: "<your-storageBucket>",
	messagingSenderId: "<your-messagingSenderId>"
};
firebase.initializeApp(config);


describe('flatte', function() {
	beforeEach(module('mx.flatte'));

	var flatte;
	beforeEach(inject(function (_flatte_) {
		flatte = _flatte_;
		flatte.settings({
			debug: true,
			con: firebase,
			manifest: {}
		});
		//flatte.set
		firebase.database().ref("tests").set({a:1},function(err){console.log(err);})
	}));

	describe("baseRef",function(){
		it('should return flatte base ref', function () {
			expect(flatte.settings().baseRef).toBe("/");
		});
	});

	describe("saveValue",function(){
		it('should return object', function () {
			var progress = {};
			flatte.do([
				{
					ref:"tests",
					data:{a:1},
					set:false
				}
			],progress).then(function(res){
				console.log(res);
				expect(res).toBe({status:0});
			});
		});
	})

});