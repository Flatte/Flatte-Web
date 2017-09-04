/**
 *
 * Client-Side nosql Firebase Realtime Database save management.
 * @link https://flatte.github.io/Flatte-Web/
 * @version v.1.0.1-beta.85 - Mon Sep 04 2017 13:54:19 GMT+0300 (Türkiye Standart Saati)
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

	angular.module('mx.flatte',[]).factory('flatte',flatte);

	flatte.$inject = ['$q','$filter','$timeout'];
	function flatte($q,$filter,$timeout){
		var f = {
			checkConnection : checkConnection,
			settings: settings,
			debug : debug,
			serial : serial,
			db : firebase.database(),
			dbref : firebase.database().ref(),
			dbTime : function(){ return firebase.database.ServerValue.TIMESTAMP },
			dbKey : function(){ return firebase.database().ref().push().key },
			cleanData : function(data){ return JSON.parse(JSON.serialize(data)) },
			do : doAction
		};

		function checkConnection(){
			return $q(function(resolve, reject) {
				/* if firebase object has been defined */
				if ((!!settings.con) && (!!settings.con.database)) {
					/* try to connect defined base path of firebase. As: 'flatteCheckConnection' */
					settings.con.database().ref('.info/connected').once('value', function (snap) {
						if (settings.debug) console.info("%c♣ [Flatte] Connection Success.","color:#3883fa;");
						resolve(true);
					}, function (err) {
						if (settings.debug) console.error('[Flatte] Connection Error: ', err);
						reject(err);return false;
					});
				} else {
					var err = {code:"FB000",message:'Connection Error: settings.con is not defined.'};
					console.error('[Flatte] Connection Error: ', err);
					reject(err);return false;
				}
			});
		};

		function settings(options,set){
			var option;
			// if set remove old properties
			if(set) for(option in this.settings) if ((option !== "settings") && (this.settings.hasOwnProperty(option))) delete this.settings[option];

			// set new properties
			if (options) for(option in options) this.settings[option] = options[option];

			// return settings
			return this.settings;
		}
		/* Default Settings */
		f.settings({
			debug: false,
			baseRef: "/",
			con: null,
			manifest: {},
			predefined: {
				".true": true,
				".false": false,
				".null": null,
				".timestamp": firebase.database.ServerValue.TIMESTAMP
			}
		},true);

		function debug(data){
			if (f.settings().debug) {
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
		function deepExtend(destination, source) {
			for (var property in source) {
				if (source[property] && source[property].constructor &&
					source[property].constructor === Object) {
					destination[property] = destination[property] || {};
					deepExtend(destination[property], source[property]);
				} else {
					destination[property] = source[property];
				}
			}
			return destination;
		}

		function doAction (saveObjects,progress){
			f.debug("flatte.do() called...");
			var
				getTime = function(){
					var date = new Date();
					return date.valueOf();
				},
				guid = "doID" + f.dbKey(),   // Create doActionId for debuging.
				placeIDs = function(ref,from,to,prefix){
					function findItem(ref,from,find){
						return $q(function(resolve){
							var findPromises = [],findResult = false;
							from.map(function(item,index){
								promises.push($q(function(resolve){
									if (prefix + item === find) findResult = ref[index];
									resolve();
								}))
							});
							$q.all(promises).then( function() {
								resolve(findResult)
							}).catch(function(err){console.log(err)});
						})
					}
					var promises = [], result = [];
					to.map(function(item){
						promises.push($q(function(resolve){
							if (from) {
								findItem(ref,from,item).then(function(res){
									if (res) result.push(res); else result.push(item);
									resolve();
								})
							} else {
								result.push(item);
								resolve();
							}
						}))
					});
					return $q(function(resolve){
						$q.all(promises).then(function(){
							resolve(result);
						}).catch(function(err){console.log(err)});
					});
				},
				commands = {
					ID: function(ref,data,path,options,action,manifestPath){
						return $q(function(resolve,reject){
							resolve();
						})
					},
					saveValue: function(ref,data,path,options,action,manifestPath){
						return $q(function(resolve,reject){
							function replace(results){
								var promises = [], result = {}, newKey = "",newVal = "";
								angular.forEach(results,function(value,key){
									if (typeof key === "string") {
										promises.push($q(function(resolve){ placeIDs(path.split('/'),manifestPath,key.split('/'),"#").then(function(res){ newKey = res.join('/'); resolve(); }); }));
									} else {
										newKey = key;
									}
									if (typeof value === "string") {
										promises.push($q(function(resolve){ placeIDs(path.split('/'),manifestPath,value.split('/'),"#").then(function(res){ newVal = res.join('/'); resolve(); }); }));
									} else {
										newVal = value;
									}
								});
								return $q(function(resolve){
									$q.all(promises).then(function(res){
										if (newKey!=="" && newVal!=="") result[newKey] = newVal;
										resolve(result);
									})
								})
							}
							var results = {};
							if ((options !== ".doNothing") && (action === "save")/* && (!angular.isObject(data))*/) {
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

							replace(results).then(function(res){ resolve(res); });
						})
					},
					deleteValue: function(ref,data,path,options,action,manifestPath){
						return $q(function(resolve,reject){
							function replace(results){
								var promises = [], result = {}, newKey = "",newVal = "";
								angular.forEach(results,function(value,key){
									if (typeof key === "string") {
										promises.push($q(function(resolve){ placeIDs(path.split('/'),manifestPath,key.split('/'),"#").then(function(res){ newKey = res.join('/'); resolve(); }); }));
									} else {
										newKey = key;
									}
									if (typeof value === "string") {
										promises.push($q(function(resolve){ placeIDs(path.split('/'),manifestPath,value.split('/'),"#").then(function(res){ newVal = res.join('/'); resolve(); }); }));
									} else {
										newVal = value;
									}
								});
								return $q(function(resolve){
									$q.all(promises).then(function(res){
										if (newKey!=="" && newVal!=="") result[newKey] = newVal;
										resolve(result);
									})
								})
							}

							var results = {};

							if (action !== "save"/* && (!angular.isObject(data))*/) {
								path = (angular.isObject(path)) ? path.join("/") : path;
								if ((options !== ".doNothing") && (action === "delete")) {
									if ((options === "$")) results[path] = data;
									else results[path] = ((options === null) || (options === "null")) ? null : options;
								} else if (action === "setNull") {
									results[path] = null;
								}
							}

							replace(results).then(function(res){ resolve(res); });
						})
					},
					copy: function(ref,data,path,options,action,manifestPath){
						return $q(function(resolve,reject) {
							if (!options) { resolve(); return false; }

							var results = {}, promises = [];

							function run(runRef,runData,options,action){
								var promises = [];

								promises.push($q(function (resolve, reject) {
									placeIDs(path,manifestPath,runRef.split('/'),"#").then(function(resRef){
										placeIDs(path,manifestPath,options.saveValue.split('/'),"#").then(function(resValue){
											commands.saveValue(ref, runData, resRef.join('/'), resValue.join('/'), action,manifestPath).then(function (res) {
												angular.extend(results,res);
												resolve();
											}).catch(function(err){ reject(err); return false; });
										});
									});
								}));
								promises.push($q(function (resolve, reject) {
									placeIDs(path,manifestPath,runRef.split('/'),"#").then(function(resRef){
										placeIDs(path,manifestPath,options.deleteValue.split('/'),"#").then(function(resValue){
											commands.deleteValue(ref, runData, resRef.join('/'), resValue.join('/'), action,manifestPath).then(function (res) {
												angular.extend(results,res);
												resolve();
											}).catch(function(err){ reject(err); return false; });
										});
									});
								}));

								return $q.all(promises)
							}

							function loop(loopRef, loopData,options,action){
								var promises = [];

								if (
									(
										((action === "save") && ((options.saveValue === null) || (options.saveValue === "$") || (options.saveValue.trim() === ""))) ||
										((action !== "save") && ((options.deleteValue === null) || (options.deleteValue === "$") || (options.deleteValue.trim() === "")))
									) && angular.isObject(loopData)
								) {
									angular.forEach(loopData,function(value,key){
										promises.push($q(function (resolve, reject) {
											options.saveValue = (options.saveValue.trim() !== "") ? options.saveValue : "$";
											options.deleteValue = (options.deleteValue.trim() !== "") ? options.deleteValue : "$";
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
					externalEffect: function(ref,data,path,options,action,manifestPath){
						return $q(function(resolve,reject){
							if (!options) { resolve(); return false; }

							var results = {},promises = [];

							function replace(option){
								var promises = [],result = {path:"",if:{key:"",value:""},save:{key:"",value:""},delete:{key:"",value:""}};
								if (!option.hasOwnProperty("path")) option.path = "";
								promises.push($q(function(resolve){ placeIDs(path,manifestPath,option.path.split('/'),"#").then(function(res){ result.path = res.join('/'); resolve(); }); }));
								if (!option.hasOwnProperty("if")) option.if = {key:"",value:""}; else {
									if (!option.if.hasOwnProperty("key")) option.if.key = "";
									if (!option.if.hasOwnProperty("value")) option.if.value = "";
								}
								promises.push($q(function(resolve){ placeIDs(path,manifestPath,option.if.key.split('/'),"#").then(function(res){ result.if.key = res.join('/'); resolve(); }); }));
								promises.push($q(function(resolve){ placeIDs(path,manifestPath,option.if.value.split('/'),"#").then(function(res){ result.if.value = res.join('/'); resolve(); }); }));
								if (!option.hasOwnProperty("save")) option.if = {key:"",value:""}; else {
									if (!option.save.hasOwnProperty("key")) option.save.key = "";
									if (!option.save.hasOwnProperty("value")) option.save.value = "";
								}
								promises.push($q(function(resolve){ placeIDs(path,manifestPath,option.save.key.split('/'),"#").then(function(res){ result.save.key = res.join('/'); resolve(); }); }));
								promises.push($q(function(resolve){ placeIDs(path,manifestPath,option.save.value.split('/'),"#").then(function(res){ result.save.value = res.join('/'); resolve(); }); }));
								if (!option.hasOwnProperty("delete")) option.delete = {key:"",value:""}; else {
									if (!option.delete.hasOwnProperty("key")) option.delete.key = "";
									if (!option.delete.hasOwnProperty("value")) option.delete.value = "";
								}
								promises.push($q(function(resolve){ placeIDs(path,manifestPath,option.delete.key.split('/'),"#").then(function(res){ result.delete.key = res.join('/'); resolve(); }); }));
								promises.push($q(function(resolve){ placeIDs(path,manifestPath,option.delete.value.split('/'),"#").then(function(res){ result.delete.value = res.join('/'); resolve(); }); }));

								return $q(function(resolve,reject){
									$q.all(promises).then(function(){
										var params,match;
										if (typeof result.if.value === "string") {
											match = (result.if.value.replace(/\([^\)]*\)/g, '()')) ? result.if.value.replace(/\([^\)]*\)/g, '()').replace('()', '') : result.if.value;
											if (match) params = result.if.value.match(/\([^\)]*\)/g);
											if (params) params = params[0].replace('(', '').replace(')', '');
										} else {
											match = result.if.value;
										}

										result.if.value = (f.settings().predefined.hasOwnProperty(match)) ? ((typeof f.settings().predefined[match] === "function") ? f.settings().predefined[match](params) : f.settings().predefined[result.if.value]) : result.if.value;
										resolve(result)
									})
								})
							}

							function runData(data,path,options,action){
								var promises = [];
								if (options.save.value !== ".doNothing") {
									if (action === "save") {
										promises.push($q(function (resolve, reject) {
											commands.saveValue(ref, "1", (path + "/" + options.save.key).split('/'), options.save.value, action,manifestPath).then(function (res) {
												if (!angular.equals(data,res)) angular.extend(results, res);
												resolve();
											}).catch(function (err) {
												reject(err);
												return false;
											});
										}));
									} else {
										promises.push($q(function (resolve, reject) {
											commands.deleteValue(ref, data, (path + "/" + options.delete.key).split('/'), options.delete.value, action,manifestPath).then(function (res) {
												if (!angular.equals(data,res)) angular.extend(results, res);
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
										firebase.database().ref(f.settings().baseRef+"/"+res.path).orderByChild(res.if.key).equalTo(res.if.value).once("value",function(snap){
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
					function: function(ref,data,path,options,action,manifestPath){
						function replace(results){
							var promises = [], result = {}, newKey = "",newVal = "";
							angular.forEach(results,function(value,key){
								if (typeof key === "string") {
									promises.push($q(function(resolve){ placeIDs(path,manifestPath,key.split('/'),"#").then(function(res){ newKey = res.join('/'); resolve(); }); }));
								}
								if (typeof value === "string") {
									promises.push($q(function(resolve){ placeIDs(path,manifestPath,value.split('/'),"#").then(function(res){ newVal = res.join('/'); resolve(); }); }));
								}
							});
							return $q(function(resolve){
								$q.all(promises).then(function(res){
									if (newKey!=="" && newVal!=="") result[newKey] = newVal;
									resolve(result);
								})
							})
						}
						function $function(flatte, $q, $ref, $data, $path, $action, $manifestPath) {
							return $q(function (resolve, reject) {
								try {
									var res = {};
									eval(options);
								} catch(err){reject(err);return false;}
							})
						}
						return $q(function(resolve,reject){
							if (options) {
								$function(f, $q, ref, data, path, action, manifestPath).then(function (res) {
									resolve(res)
								}).catch(function (err) {reject(err);return false;});
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

			if (progress) progress[guid] = {total:8};
			if (progress) progress[guid].count = 0;
			if (progress) progress[guid].message = "Pending...";

			return $q(function(resolve,reject){
				f.serial(tasks).then(function(){
					if (f.settings().debug) {
						// Ended action return resolved result
						resolve({results:(doAction.var[guid].results || "No save result generated !.."),manifestInfections:doAction.var[guid].appliedManifest});
					} else {
						// if debug is not true remove variables stored in doAction.var debug container.
						delete doAction.var[guid];
						resolve();
					}
					f.debug("flatte.do() ended with success");
					if (progress) progress[guid].count++;
					if (progress) progress[guid].message = "End action...";
				}).catch(function(err){
					endAction(err);
					reject(err);
					f.debug("flatte.do() ended with error");
				})
			});

			function createAction() {
				f.debug("Create action.");
				if (progress) progress[guid].count++;
				if (progress) progress[guid].message = "Create action...";
				return $q(function(resolve,reject){
					f.debug("Set action container.");
					doAction.var[guid] = {
						log: {"startedAt": getTime()},  // set variable container with doActionId. Add action start time.
						objects: {},                    // object container
						results: {},                    // main result to save database
						appliedManifest: [],            // manifest applied Effect
						eliminatedCodes: [
							"01 - Parent result has been found."
						]
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
				f.debug("Create objects.");
				if (progress) progress[guid].count++;
				if (progress) progress[guid].message = "Create objects...";
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
							$results: {},                                                  // create object results array
							$eliminateds: {}
						};
						if (saveObject.data !== "delete") doAction.var[guid].objects[saveObject.ref].$exists[saveObject.ref] = true;
						createLoopData(doAction.var[guid].objects[saveObject.ref]).then(function(){
							resolve()
						}).catch(function(err){reject(err);return false;});
					}));
				});

				return $q.all(promises)
			}

			function getDbData(ref){
				return $q(function(resolve,reject){
					firebase.database().ref(f.settings().baseRef+"/"+ref).once("value",function(snap){
						var result = {};
						angular.forEach(snap.val(),function(item,key){
							result[key] = item;
						});
						resolve(result);
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
							createExists(ref,item,newPath).then(function(){
								resolve()
							}).catch(function(err){reject(err);return false;});
						} else {
							resolve()
						}
					}))
				});

				return $q.all(promises);
			}

			function createLoopData(object) {
				f.debug("Create loop data.");
				if (progress) progress[guid].count++;
				if (progress) progress[guid].message = "Create loop data...";
				return $q(function(resolve,reject) {
					if ((object.$action !== "save") || (object.set)) {
						getDbData(object.ref).then(function (dbData) {
							if (object.set) {
								createExists(object.ref,object.data,object.$ref).then(function(){
									doAction.var[guid].objects[object.ref].data = deepExtend(dbData, doAction.var[guid].objects[object.ref].data);
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
				f.debug("Perform.");
				if (progress) progress[guid].count++;
				if (progress) progress[guid].message = "Perform...";
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
							loopData(ref,item,newPath).then(function(){
								resolve()
							}).catch(function(err){reject(err);return false;});
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
				function findID(findPath){
					var promises = [],ID = false;
					angular.forEach(eval("f.settings().manifest"+((findPath.length > 0) ? "['"+findPath.join("'].childs['")+"'].childs":"")),function(node,key){
						promises.push($q(function(resolve,reject) {
							if (node.hasOwnProperty("_q") && node._q.hasOwnProperty("ID")) ID = key;
							resolve();
						}));
					});
					return $q(function(resolve){
						$q.all(promises).then(function(res){resolve(ID)}).catch(function(err){reject(err);return false;})
					})
				}

				var
					promises = [],
					newPath = [],
					hasItem = false,
					notFound = false;

				angular.forEach(path,function(item){
					promises.push(function(){return $q(function(resolve,reject){
						try {
							hasItem = eval("f.settings().manifest"+((newPath.length > 0) ? "['"+newPath.join("'].childs['")+"'].childs":"")+".hasOwnProperty('"+item+"')");
						} catch(err){
							hasItem = false;
						}
						if (!hasItem) {
							findID(newPath).then(function(res){
								if (res) newPath.push(res); else notFound = (notFound || true);
								resolve();
							}).catch(function(err){reject(err);return false;});
						} else {
							newPath.push(item);
							resolve();
						}
					})});
				});
				return $q(function(resolve,reject){
					f.serial(promises).then(function(){
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
					} else if (data === null) {
						action = "delete";
					} else {
						action = "save";
					}

					manifest = false;
					try {
						manifest = eval("f.settings().manifest"+((manifestPath.length > 0) ? "['"+manifestPath.join("'].childs['")+"']":"")+"._q");
					} catch(err) {manifest = false; reject(err);return false;}

					if ((manifestPath.length > 0) && (!doAction.var[guid].appliedManifest.hasOwnProperty(manifestPath.join("/")))) doAction.var[guid].appliedManifest.push(manifestPath.join("/"));
					for(var command in commands){
						promises.push($q(function(resolve,reject){
							commands[command](ref,data,path,((manifest && manifest.hasOwnProperty(command) && (manifest[command] !== "")) ? manifest[command] : null),action,manifestPath).then(function(res){
								$.extend(doAction.var[guid].objects[ref].$results,res);
								resolve();
							}).catch(function(err){reject(err);return false;})
						}));
					}

					$q.all(promises).then(function(){
						resolve()
					}).catch(function(err){reject(err);return false;})
				})
			}

			function createFinalResults(){
				f.debug("Create final results.");
				if (progress) progress[guid].count++;
				if (progress) progress[guid].message = "Create final results...";
				function loopElimination(){
					var promises = [];
					function deleteOthers(objectRef,path){
						var promises = [];
						Object.keys(doAction.var[guid].objects[objectRef].$results).reverse().map(function(key) {
							promises.push($q(function (resolve, reject) {
								if ((key !== path) && (key.split('/').slice(0, path.split('/').length).join('/') === path)) {
									doAction.var[guid].objects[objectRef].$eliminateds[key] = "[01] " + doAction.var[guid].objects[objectRef].$results[key];
									delete doAction.var[guid].objects[objectRef].$results[key];
								}
								resolve();
							}));
						});
						return $q(function(resolve,reject){
							$q.all(promises).then(function(){ resolve(); }).catch(function (err) {reject(err);return false;});
						});
					}
					function eliminate(objectRef){
						var promises = [];
						Object.keys(doAction.var[guid].objects[objectRef].$results).reverse().map(function(key) {
							promises.push(function(){$q(function (resolve, reject) {
								if (!angular.isObject(doAction.var[guid].objects[objectRef].$results[key])){
									if (typeof doAction.var[guid].objects[objectRef].$results[key] !== "undefined") {
										deleteOthers(objectRef, key).then(function (found) {
											resolve();
										}).catch(function (err) {reject(err);return false;});
									}
								} else {
									delete doAction.var[guid].objects[objectRef].$results[key];
									resolve();
								}
							})});
						});
						return f.serial(promises);
					}
					angular.forEach(doAction.var[guid].objects,function(object) {
						promises.push($q(function (resolve, reject) {
							eliminate(object.ref).then(function () {
								resolve()
							}).catch(function (err) {reject(err);return false;});
						}));
					});
					return $q.all(promises);
				}
				function replace(){
					var promises = [];
					angular.forEach(doAction.var[guid].objects,function(object) {
						promises.push($q(function (resolve, reject) {
							replacePredefined(object.$results).then(function (res) {
								doAction.var[guid].objects[object.ref].$results = res;
								$.extend(doAction.var[guid].results,res);
								resolve()
							}).catch(function (err) {reject(err);return false;});
						}));
					});
					return $q.all(promises);
				}

				return f.serial([loopElimination,replace]);
			}

			function replacePredefined(data){
				var promises = [],results = {};

				angular.forEach(data,function(value,key){
					promises.push($q(function(resolve,reject){
						var params,match;
						if (typeof value === "string") {
							match = (value.replace(/\([^\)]*\)/g, '()')) ? value.replace(/\([^\)]*\)/g, '()').replace('()', '') : value;
							if (match) params = value.match(/\([^\)]*\)/g);
							if (params) params = params[0].replace('(', '').replace(')', '');
						} else {
							match = value;
						}

						results[key] = (f.settings().predefined.hasOwnProperty(match)) ? ((typeof f.settings().predefined[match] === "function") ? f.settings().predefined[match](params) : f.settings().predefined[match]) : match;
						resolve();
					}));
				});

				return $q(function(resolve,reject){
					$q.all(promises).then(function(){
						resolve(results)
					})
				});
			}

			function update() {
				f.debug("Run Update.");
				if (progress) progress[guid].count++;
				if (progress) progress[guid].message = "Run results...";
				return $q(function(resolve,reject){
					try {
						firebase.database().ref(f.settings().baseRef).update(doAction.var[guid].results,function(err){
							if (err) reject(err); else {
								resolve()
							}
						});
					} catch(err){reject(err)}
				})
			}

			function endAction(err) {
				f.debug("End action.");
				return $q(function(resolve,reject){
					doAction.var[guid].log["endedAt"] = getTime();
					doAction.var[guid].log["duration"] = (doAction.var[guid].log["endedAt"] - doAction.var[guid].log["startedAt"]) + " milliseconds";
					doAction.var[guid].log._error = (err || null);
					resolve()
				})
			}
		}
		doAction.var = {};
		doAction.getDebug = function () { return this.var; };
		doAction.clearDebug = function () { this.var = {}; };

		return f;
	}

}();