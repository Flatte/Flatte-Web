/**
 *
 * Nosql denormalization management for Firabase
 * @link https://flatte.github.io/Flatte-Web/
 * @version v.1.0.1-beta.73 - Sat Aug 26 2017 19:48:17 GMT+0300 (Türkiye Standart Saati)
 *
 * Copyright (c) 2017 Flatte - Sezer Ekinci <sezer@maxabab.com>, Kaan Ekinci <kaan@maxabab.com>
 * @license MIT License, https://opensource.org/licenses/MIT
 *
 * @author Sezer Ekinci <sezer@maxabab.com>
 * @author Kaan Ekinci <kaan@maxabab.com>
 *
 * @Controbutors https://github.com/Flatte/Flatte-Web/graphs/contributors
 *
 */

!function(){
	"use strict";

	angular.module('mx.flatte',[])
		.provider('mxFlatte',flatteProvider)
		.run(flatteRun)
		.service('flatte',flatte);

	flatteProvider.$inject = [];
	function flatteProvider(){
		var provider = this;
		var settings = {
			debug: false,
			baseRef: "/",
			conStatus: false,
			con: null,
			manifest: null,
			predefined: {
				".timestamp": firebase.database.ServerValue.TIMESTAMP,  // firebase server timestamp creates double timestamp. Manifest Builder shows it as updated;
				".auth": false,                         // who is doing this action
				".id": function(){ return firebase.database().ref().push().key; }
			}
		};

		provider.settings = function(options){ angular.extend(settings,options); };

		provider.$get = $get;

		$get.$inject = ['$q','$injector'];
		function $get($q,$injector){
			var checkConnection = function(){
				return $q(function(resolve, reject) {
					/* if firebase object has been defined */
					if ((!!settings.con) && (!!settings.con.database)) {
						/* try to connect defined base path of firebase. As: 'flatteCheckConnection' */
						settings.con.database().ref('.info/connected').once('value', function (snap) {
							if (settings.debug) console.info("%c♣ [Flatte] Connection Success.","color:#3883fa;");
							settings.conStatus = true;
							resolve(true);
						}, function (err) {
							if (settings.debug) console.error('[Flatte] Connection Error: ', err);
							settings.conStatus = false;
							reject(err);return false;
						});
					} else {
						var err = {code:"FB000",message:'Connection Error: settings.con is not defined.'};
						console.error('[Flatte] Connection Error: ', err);
						reject(err);return false;
					}
				});
			};

			/**
			 * Return available $get properties
			 */
			return {
				settings: settings,
				checkConnection: checkConnection
			}
		}
	}

	flatteRun.$inject = ['mxFlatte'];
	function flatteRun(mxFlatte) {
		mxFlatte.checkConnection();
	}

	flatte.$inject = ['mxFlatte','$q','$filter'];
	function flatte(mxFlatte,$q,$filter){
		var f = this;
		f.debug = debug;
		f.serial = serial;
		f.db = firebase.database();
		f.dbref = f.db.ref();
		f.dbTime = function(){ return firebase.database.ServerValue.TIMESTAMP };
		f.dbKey = function(){ return firebase.database().ref().push().key };
		f.cleanData = function(data){ return JSON.parse(JSON.serialize(data)) };
		f.setManifest = function(manifest){mxFlatte.settings.manifest = manifest};
		f.setPredefined = function(newData){
			mxFlatte.settings.predefined = newData;
		};
		f.predefined = function(item,value){
			if (item) {
				if (typeof item === "object") {
					angular.forEach(item,function(value,key){
						mxFlatte.settings.predefined[key] = value;
					})
				} else {
					mxFlatte.settings.predefined[item] = value;
				}
			} else return mxFlatte.settings.predefined;
		};
		f.baseRef = function(ref){if (ref) mxFlatte.settings.baseRef = ref; else return mxFlatte.settings.baseRef; };
		f.do = doAction;

		function debug(data){
			if (mxFlatte.settings.debug) {
				if (angular.isObject(data)) {
					console.info("%c♣ [" + data.code + "] "+ data.message,"color:#3883fa;");
				} else console.info("%c♣ "+data,"color:#3883fa;");
			}
		}
		function serial(tasks) {
			var prevPromise;
			angular.forEach(tasks, function (task, key) {
				if (!prevPromise) {
					prevPromise = task();
				} else {
					prevPromise = prevPromise.then(task).catch(function(reason){return $q.reject(reason);})
				}
			});
			return prevPromise || $q.when();
		}

		/* Fb Do Functions */
		function doAction (saveObjects){
			f.debug("flatte.do() called...");
			var
				getTime = function(){
					var date = new Date();
					return date.valueOf();
				},
				guid = "GUID" + f.dbKey(),   // Create doActionId for debuging.
				commands = {
					ID: function(ref,data,path,options,action){
						return $q(function(resolve,reject){
							resolve();
						})
					},
					saveValue: function(ref,data,path,options,action){
						return $q(function(resolve,reject){
							var results = {};
							if ((options !== ".doNothing") && (action === "save") && (!angular.isObject(data))) {
								path = (angular.isObject(path)) ? path.join("/") : path;
								if (angular.isObject(options)){
									if (options.filter) {
										var params = (options.hasOwnProperty("params")) ? options.params.split("|") : [];
										params.unshift(data);
										results[path] = $filter(options.filter).apply(this, params);
									} else {
										results[path] = data;
									}
								} else {
									if ((options === null) || (options === "$")) results[path] = data;
									else results[path] = options;
								}
							}

							resolve(results);
						})
					},
					deleteValue: function(ref,data,path,options,action){
						return $q(function(resolve,reject){
							var results = {};

							if ((options !== ".doNothing") && (!angular.isObject(data))) {
								path = (angular.isObject(path)) ? path.join("/") : path;
								if (action === "delete") {
									if ((options === "$")) results[path] = data;
									else results[path] = ((options === null) || (options === "null")) ? null : options;
								} else if (action === "setNull") {
									results[path] = null;
								}
							}

							resolve(results);
						})
					},
					copy: function(ref,data,path,options,action){
						return $q(function(resolve,reject) {
							if (!options) { resolve(); return false; }

							var results = {}, promises = [];

							function run(runRef,runData,options,action){
								var promises = [];

								promises.push($q(function (resolve, reject) {
									commands.saveValue(ref, runData, runRef, options.saveValue, action).then(function (res) {
										angular.extend(results,res);
										resolve();
									}).catch(function(err){ reject(err); return false; });
								}));
								promises.push($q(function (resolve, reject) {
									commands.deleteValue(ref, runData, runRef, options.deleteValue, action).then(function (res) {
										angular.extend(results,res);
										resolve();
									}).catch(function(err){ reject(err); return false; });
								}));

								return $q.all(promises)
							}

							function loop(loopRef, loopData,options,action){
								var promises = [];

								if (angular.isObject(loopData)) {
									angular.forEach(loopData,function(value,key){
										promises.push($q(function (resolve, reject) {
											loop(loopRef+'/'+key,value,options,action).then(function (res) { resolve(res); }).catch(function(err){ reject(err); return false; });
										}));
									});
								} else {
									promises.push($q(function (resolve, reject) {
										run(loopRef,loopData,options,action).then(function (res) { resolve(res); }).catch(function(err){ reject(err); return false; });
									}));
								}

								return $q.all(promises)
							}

							if (options) {
								options.map(function (o) {
									promises.push($q(function (resolve, reject) {
										loop(o.path,data, o, action).then(function (res) { resolve(); }).catch(function(err){ reject(err); return false; });
									}));
								});
							}

							$q.all(promises).then(function(res){resolve(results)}).catch(function(err){ reject(err); return false; });
						})
					},
					externalEffect: function(ref,data,path,options,action){
						return $q(function(resolve,reject){
							if (!options) { resolve(); return false; }

							var results = {},promises = [];

							function replace(option){
								return $q(function(resolve,reject){
									_replace(ref,option).then(function(res){
										option = res;
										_replace(ref,option.if).then(function(res){
											option.if = res;
											_replaceIDs(ref,option.save.key).then(function(res){
												option.save.key = res;
												_replaceIDs(ref,option.delete.key).then(function(res){
													option.delete.key = res;
													resolve(option);
												})
											})
										})
									})
								})
							}

							function runData(data,path,options,action){
								var promises = [];
								if (options.save.value !== ".doNothing") {
									if (action === "save") {
										promises.push($q(function (resolve, reject) {
											commands.saveValue(ref, "1", (path + "/" + options.save.key).split('/'), options.save.value, action).then(function (res) {
												angular.extend(results, res);
												resolve();
											}).catch(function (err) {
												reject(err);
												return false;
											});
										}));
									} else {
										promises.push($q(function (resolve, reject) {
											commands.deleteValue(ref, data, (path + "/" + options.delete.key).split('/'), options.delete.value, action).then(function (res) {
												angular.extend(results, res);
												resolve();
											}).catch(function (err) {
												reject(err);
												return false;
											});
										}));
									}
								}
								return $q.all(promises)
							}

							function loopData(items,data,options,action){
								var promises = [];
								angular.forEach(items,function(value,key){
									promises.push($q(function (resolve, reject) {
										runData(data,options.path+"/"+key,options,action).then(function () { resolve(); }).catch(function(err){ reject(err); return false; });
									}));
								});

								return $q.all(promises)
							}

							angular.forEach(options,function(option){
								promises.push($q(function(resolve,reject){
									replace(option).then(function(res){
										firebase.database().ref(f.baseRef()+"/"+res.path).orderByChild(res.if.key).equalTo(res.if.value).once("value",function(snap){
											loopData(snap.val(),data, res, action).then(function (res) { resolve(); }).catch(function(err){ reject(err); return false; });
										},function(err){reject(err)});
									});
								}));
							});

							$q.all(promises).then(function(res){
								resolve(results);
							})
						})
					},
					function: function(ref,data,path,options,action){
						function $function(flatte, $q, $ref, $data, $path, $action) {
							return $q(function (resolve, reject) {
								try {
									var res = {};
									eval(options);
								} catch(err){reject(err);return false;}
							})
						}
						return $q(function(resolve,reject){
							if (options) {
								$function(f, $q, ref, data, path, action).then(function (res) {resolve(res)}).catch(function (err) {reject(err);return false;});
							} else {
								resolve();
							}
						});
					}
				},
				tasks = [
					createAction,
					createObjects,
					loopData,
					perform,
					createFinalResults,
					update,
					endAction
				];

			return $q(function(resolve,reject){
				f.serial(tasks).then(function(){
					if (mxFlatte.settings.debug) {
						// Ended action return resolved result
						resolve({results:(doAction.var[guid].results || "No save result generated !.."),manifestInfections:doAction.var[guid].appliedManifest});
					} else {
						// if debug is not true remove variables stored in doAction.var debug container.
						delete doAction.var[guid];
						resolve();
					}
					f.debug("flatte.do() ended with success");
				}).catch(function(err){reject(err)})
			});

			function createAction() {
				f.debug("Create action.");
				return $q(function(resolve,reject){
					f.debug("Set action container.");
					doAction.var[guid] = {
						log: {"startedAt": getTime()},   // set variable container with doActionId. Add action start time.
						objects: {},                    // object container
						results: {},                    // main result to save database
						appliedManifest: []             // manifest applied Effect
					};

					f.debug("Check sent data");
					// Check if object is sent
					if (!saveObjects) {
						var err = {code: "F001", message: "Object not found! Please send object first."};
						endAction(err);
						reject(err);return false;
					}
					// Check if object is array
					if (!angular.isArray(saveObjects)) {
						var err = {code: "F002", message: "Object is not array! Please send object as an array."};
						endAction(err);
						reject(err);return false;
					}

					resolve()
				});
			}

			function createObjects(){
				var promises = [];
				angular.forEach(saveObjects, function (saveObject) {
					promises.push($q(function(resolve,reject) {
						// check if object referance is sent.
						if (!saveObject.ref) {
							saveObject.ref = "";
							/*var err = {code: "F003", message: "Object referance not found! Please send object referance first."};
							endAction(err);
							reject(err);return false;*/
						}
						// check if object data is sent.
						if (!saveObject.data) {
							var err = {
								code: "F004",
								message: "Object data not found! Please send object data first. (ref: " + saveObject.ref + ")"
							};
							endAction(err);
							reject(err);return false;
						}

						doAction.var[guid].objects[saveObject.ref] = {
							ref: saveObject.ref,                                          // set sent object ref in doVar
							data: saveObject.data,                                        // set sent object data in doVar
							set: saveObject.set,                                          // set sent object data record type
							$action: (saveObject.data === "delete") ? "delete" : "save",  // set object action type.
							$exists: {},                                                  // existing sent paths
							$ids: {},                                                     // create object ids array
							$ref: (saveObject.ref !== "" && saveObject.ref !== "/") ? saveObject.ref.split('/') : [],                              // set object referance array
							$results: {}                                                  // create object results array,
						};
						if (saveObject.data !== "delete") doAction.var[guid].objects[saveObject.ref].$exists[saveObject.ref] = true;
						createLoopData(doAction.var[guid].objects[saveObject.ref]).then(function(){resolve()}).catch(function(err){reject(err);return false;});
					}));
				});

				return $q.all(promises)
			}

			function getDbData(ref){
				return $q(function(resolve,reject){
					firebase.database().ref(f.baseRef()+"/"+ref).once("value",function(snap){
						resolve((snap.val() || {}));
					},function(err){reject(err);return false;})
				});
			}

			function createExists(ref,data,path){
				var promises = [];
				angular.forEach(data,function(item,key){
					promises.push($q(function(resolve,reject){
						var newPath = (path) ? angular.copy(path) : [];
						newPath.push(key);
						doAction.var[guid].objects[ref].$exists[newPath.join('/')] = true;
						if (angular.isObject(item)) {
							createExists(ref,item,newPath).then(function(){resolve()}).catch(function(err){reject(err);return false;});
						} else {
							resolve()
						}
					}))
				});

				return $q.all(promises);
			}

			function createLoopData(object) {
				return $q(function(resolve,reject) {
					if ((object.$action !== "save") || (object.set)) {
						getDbData(object.ref).then(function (dbData) {
							if (object.set) {
								createExists(object.ref,object.data,object.$ref).then(function(){
									doAction.var[guid].objects[object.ref].data = angular.extend(dbData, doAction.var[guid].objects[object.ref].data);
									resolve()
								}).catch(function (err) {reject(err);return false;});
							} else {
								doAction.var[guid].objects[object.ref].data = dbData;
								resolve()
							}
						}).catch(function (err) {reject(err);return false;});
					} else {
						resolve()
					}
				});
			}

			function perform(){
				var promises = [];
				angular.forEach(doAction.var[guid].objects,function(object){
					promises.push($q(function(resolve,reject){
						createIdPaths(object.ref,object.$ref).then(function(manifestPath){
							applyManifest(object.ref,object.data,object.$ref,manifestPath).then(function(){
								resolve()
							}).catch(function(err){reject(err);return false;})
						}).catch(function(err){reject(err);return false;})
					}));
					promises.push($q(function(resolve,reject){
						loopData(object.ref,object.data,object.$ref).then(function(){
							resolve()
						}).catch(function(err){reject(err);return false;})
					}));
				});
				return $q.all(promises);
			}

			function loopData(ref,data,path){
				var promises = [];
				angular.forEach(data,function(item,key){
					var newPath = (path) ? angular.copy(path) : [];
					newPath.push(key);
					promises.push($q(function(resolve,reject){
						if (angular.isObject(item)) {
							loopData(ref,item,newPath).then(function(){resolve()}).catch(function(err){reject(err);return false;});
						} else {
							resolve()
						}
					}));
					promises.push($q(function(resolve,reject){
						createIdPaths(ref,newPath).then(function(manifestPath){
							applyManifest(ref,item,newPath,manifestPath).then(function(){
								resolve()
							}).catch(function(err){reject(err);return false;})
						}).catch(function(err){reject(err);return false;})
					}));
				});
				return $q.all(promises);
			}

			function createIdPaths(ref,path){
				return $q(function(resolve,reject){
					var
						promises = [],
						newPath = [],
						hasItem = false,
						notFound = false;
					angular.forEach(path,function(item){
						promises.push($q(function(resolve,reject){
							try {
								hasItem = eval("mxFlatte.settings.manifest.data"+((newPath.length > 0) ? "['"+newPath.join("'].childs['")+"'].childs":"")+".hasOwnProperty('"+item+"')");
							} catch(err){
								hasItem = false;
							}
							if (!hasItem) {
								if ((mxFlatte.settings.manifest.hasOwnProperty("id_index"))&&(mxFlatte.settings.manifest.id_index.hasOwnProperty(newPath.join('>')+">ID"))) {
									var ID = mxFlatte.settings.manifest.id_index[newPath.join('>')+">ID"];
									if (ID) {
										newPath.push(ID);
										doAction.var[guid].objects[ref].$ids["#"+ID] = item;
									} else {
										notFound = (notFound || true)
									}
								} else {
									notFound = (notFound || true)
								}
								resolve();
							} else {
								newPath.push(item);
								resolve();
							}
						}));
					});
					return $q.all(promises).then(function(){
						resolve((!notFound) ? newPath : false);
					}).catch(function(err){reject(err);return false;})
				})
			}

			function applyManifest(ref,data,path,manifestPath){
				return $q(function(resolve,reject){
					var manifest = {},promises = [];
					var action;
					if ((!doAction.var[guid].objects[ref].$exists[path.join('/')]) && (doAction.var[guid].objects[ref].set === "permanent")) {
						action = "setNull";
					} else if (
						(doAction.var[guid].objects[ref].set !== "permanent") &&
						(
							(doAction.var[guid].objects[ref].$action === "delete") ||
							((doAction.var[guid].objects[ref].$action === "save") && (!doAction.var[guid].objects[ref].$exists[path.join('/')]) && (doAction.var[guid].objects[ref].set))
						)
					) {
						action = "delete";
					} else {
						action = "save";
					}

					manifest = false;
					try {
						manifest = eval("mxFlatte.settings.manifest.data"+((manifestPath.length > 0) ? "['"+manifestPath.join("'].childs['")+"']":"")+"._q");
					} catch(err) {manifest = false; reject(err);return false;}

					if (manifest) {
						doAction.var[guid].appliedManifest.push((manifestPath.length > 0) ? manifestPath.join("/") : "");
						for(var command in commands){
							promises.push($q(function(resolve,reject){
								commands[command](ref,data,path,((manifest && manifest.hasOwnProperty(command) && (manifest[command] !== "")) ? manifest[command] : null),action).then(function(res){
									$.extend(doAction.var[guid].objects[ref].$results,res);
									resolve();
								}).catch(function(err){reject(err);return false;})
							}));
						}
					}

					$q.all(promises).then(function(){
						resolve();
					}).catch(function(err){reject(err);return false;})
				})
			}

			function createFinalResults(){
				var promises = [];
				angular.forEach(doAction.var[guid].objects,function(object) {
					promises.push($q(function (resolve, reject) {
						_replace(object.ref, object.$results).then(function (res) {
							doAction.var[guid].objects[object.ref].$results = res;
							$.extend(doAction.var[guid].results,res);
							resolve()
						}).catch(function (err) {
							reject(err);
							return false;
						});
					}));
				});
				return $q.all(promises);
			}

			function _replace(ref,data){
				var promises = [],results = {};

				angular.forEach(data,function(value,key){
					promises.push($q(function(resolve,reject){
						_replaceIDs(ref,key).then(function(keyRes){
							_replaceIDs(ref,value).then(function(valueRes){
								results[keyRes] = (mxFlatte.settings.predefined.hasOwnProperty(valueRes)) ? ((typeof mxFlatte.settings.predefined[valueRes] === "function") ? mxFlatte.settings.predefined[valueRes]() : mxFlatte.settings.predefined[valueRes]) : valueRes;
								resolve();
							}).catch(function(err){reject(err);return false;})
						}).catch(function(err){reject(err);return false;})
					}));
				});

				return $q(function(resolve,reject){
					$q.all(promises).then(function(){
						resolve(results)
					})
				});
			}

			function _replaceIDs(ref,val){
				var promises = [], result = angular.copy(val);
				if (result && typeof result === "string") {
					angular.forEach(doAction.var[guid].objects[ref].$ids, function (value, key) {
						promises.push($q(function(resolve,reject){
							var pattern = new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "g");
							result = result.replace(pattern, value);
							resolve();
						}));
					});
				}
				return $q(function(resolve,reject){
					$q.all(promises).then(function(){
						resolve((typeof result === "string") ? result.trim().replace(/(\/+)/g,'/').replace(/(^\/+)|(\/+$)/gi,"") : result);
					})
				});
			}

			function update() {
				f.debug("Run Update.");
				return $q(function(resolve,reject){
					firebase.database().ref(f.baseRef()).update(doAction.var[guid].results,function(err){
						if (err) reject(err); else resolve()
					});
				})
			}

			function endAction(err) {
				return $q(function(resolve,reject){
					doAction.var[guid].log["endedAt"] = getTime();
					doAction.var[guid].log["duration"] = (doAction.var[guid].log["endedAt"] - doAction.var[guid].log["startedAt"]) + " milliseconds";
					doAction.var[guid].log._error = (err || null);
					resolve();
				})
			}
		}
		doAction.var = {};
		doAction.getDebug = function () { return this.var; };

	}

}();