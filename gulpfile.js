var
	gulp = require('gulp'),
	jsonEditor = require('gulp-json-editor'),
	rename = require('gulp-rename'),
	fs = require('fs'),
	packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8')),
	saveLicense = require('uglify-save-license'),
	uglify = require('gulp-uglify'),
	replace = require('gulp-replace');

var buildProject = {};

/* ********************** *
 * BUILD                  *
 * ********************** */
!function () {
	"use strict";

	gulp.task('build',['build:upgradeVersion','build:packageVersion','build:bowerVersion','build:flatte','build:flatte.min']);
	gulp.task('build:upgradeVersion', function(callback){
		var version = packageJson.version;
		version = version.split('.');
		version[version.length-1] = String(parseInt(version[version.length - 1], 10) + 1);
		packageJson.version = version.join('.');
		callback();
	});
	gulp.task('build:packageVersion', function(callback){
		gulp.src("./package.json")
			.pipe(jsonEditor({'version': packageJson.version}))
			.pipe(gulp.dest("./"))
			.on('error',function(err){console.log("build: version package.json [Error]");callback(err)})
			.on('finish',function(){console.log("build: version package.json [End]");callback()});
	});
	gulp.task('build:bowerVersion', function(callback){
		gulp.src("./bower.json")
			.pipe(jsonEditor({'version': packageJson.version}))
			.pipe(gulp.dest("./"))
			.on('error',function(err){console.log("build: version package.json [Error]");callback(err)})
			.on('finish',function(){console.log("build: version package.json [End]");callback()});
	});
	gulp.task('build:flatte',function(callback){
		gulp.src('src/flatte.js')
			.pipe(replace('{*{version}*}', 'v.' + packageJson.version))
			.pipe(replace('{*{date}*}', new Date()))
			.pipe(gulp.dest('dist'))
			.on('error',function(err){console.log("build: flatte.js [Error]");callback(err)})
			.on('finish',function(){console.log("build: flatte.js [End]");callback()});
	});

	gulp.task('build:flatte.min',function(callback){
		gulp.src('src/flatte.js')
			.pipe(uglify({mangle: {toplevel: true}, output: {comments: saveLicense}}))
			.pipe(replace('{*{version}*}', 'v.' + packageJson.version))
			.pipe(replace('{*{date}*}', new Date()))
			.pipe(rename('flatte.min.js'))
			.pipe(gulp.dest('dist'))
			.on('error',function(err){console.log("build: flatte.min.js [Error]");callback(err)})
			.on('finish',function(){console.log("build: flatte.min.js [End]");callback()});
	});

}();
