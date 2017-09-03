var config = {
	apiKey: "AIzaSyBAaHRAoW1aamCM6VtKGNyhfc1xQKZy-yw",
	authDomain: "flatte-14ec0.firebaseapp.com",
	databaseURL: "https://flatte-14ec0.firebaseio.com",
	projectId: "flatte-14ec0",
	storageBucket: "",
	messagingSenderId: "535369674847"
};
firebase.initializeApp(config);


describe('flatte', function() {
	beforeEach(function(){
		//flatte.set
		firebase.database().ref("tests").set({a:1},function(err){console.log(err);})
	});

	beforeEach(module('mx.flatte'));

	var flatte;
	beforeEach(inject(function (_flatte_) {
		flatte = _flatte_;
	}));

	describe("baseRef",function(){
		it('should return flatte base ref', function () {
			expect(flatte.baseRef()).toBe("/");
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