
function npmcopy(grunt) {
    var data = grunt.file.readJSON("npmcopy.json");
    var packages = grunt.file.readJSON("package.json");

    packages.dependencies = packages.dependencies || {};
    packages.devDependencies = packages.devDependencies || {};

    for (var key in data) {
        var copy = [];
        var packageName;
        if (typeof data[key] === "string") {
            packageName = data[key].split('/')[0];
            if (packageName[0] === "@")
                packageName += "/" + data[key].split('/')[1];

            if (packages.dependencies[packageName] || packages.devDependencies[packageName]) {
                copy.push(data[key]);
            }
        } else {
            for (var i in data[key]) {

                packageName = data[key][i].split('/')[0];
                if (packageName[0] === "@")
                    packageName += "/" + data[key][i].split('/')[1];

                if (packages.dependencies[packageName] || packages.devDependencies[packageName]) {
                    copy.push(data[key][i]);
                }
            }
        }

        if (copy.length === 0) {
            delete data[key];
        } else {
            data[key] = copy;
        }
    }
    //  console.log(data);
    return data;
}

var outputPath = "artifacts";
var srcPath = "src";




function jsEscape(content) {
    return content.replace(/(['\\])/g, '\\$1')
        .replace(/[\f]/g, "\\f")
        .replace(/[\b]/g, "\\b")
        .replace(/[\n]/g, "\\n")
        .replace(/[\t]/g, "\\t")
        .replace(/[\r]/g, "\\r")
        .replace(/[\u2028]/g, "\\u2028")
        .replace(/[\u2029]/g, "\\u2029");
}

module.exports = function (grunt) {
    var distPath = grunt.option('distPath') || "wwwroot/" + new Date().getTime();

    grunt.loadNpmTasks('grunt-npmcopy');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    grunt.registerTask("initProject", ["npmcopy"]);
    grunt.registerTask("buildLib", ["copy:bin", "copy:lib", "copy:templates", "copy:root", "lessDependencis"]);
    grunt.registerTask("packLib", ["cleanDists", "initProject", "buildLib", "requirejs"]);
    grunt.registerTask("packwww", ["cleanDists", "initProject", "buildLib", "copy:www"]);

    grunt.registerTask("cleanDists", function () {
        if (distPath.startsWith("wwwroot/")) {
            grunt.file.delete("wwwroot");
            grunt.file.mkdir("wwwroot");
        }
    });

 


    grunt.registerTask("lessDependencis", "myLessDependencies", function (l, b) {
        var artifacOutDir = outputPath;
        var jsFiles = grunt.file.expand([artifacOutDir + "/**/*.js"], { cwd: artifacOutDir });
        var lessFiles = {};
        jsFiles.forEach(function (f) {


            var content = grunt.file.read(f);
            var path = f.substr(artifacOutDir.length);
            var src = outputPath + path.substr(0, path.lastIndexOf("/") + 1);

            var m = content.match(/define\(\[.*\],/g);
            if (m) {

                var all = m[0].match(/"css\!.*?\.(less|css)"/g);
                if (all && all.length) {

                    for (var j = 0; j < all.length; j++) {

                        var relPath = all[j].substr("css!".length + 1, all[j].length - 2 - "css!".length);

                        if (relPath[0] === "." && relPath[1] === "/")
                            relPath = relPath.substr(2);

                        console.log(src + relPath);

                        if (relPath.substr(relPath.lastIndexOf(".", relPath.lastIndexOf("."))) === ".css") {

                            relPath = relPath.substr(0, relPath.lastIndexOf(".", relPath.lastIndexOf(".") - 1)) + ".less";

                            if (grunt.file.exists(src + relPath)) {

                                lessFiles[f.substr(0, f.lastIndexOf("/") + 1) + relPath.substr(0, relPath.lastIndexOf(".")) + ".min.css"] = src + relPath;
                            }
                        } else {

                            lessFiles[f.substr(0, f.lastIndexOf("/") + 1) + relPath.substr(0, relPath.lastIndexOf(".")) + ".min.css"] = src + relPath;
                        }
                    }
                    var replaced = content;
                    var i = 10;
                    do {
                        old = replaced;
                        replaced = old.replace(/(define\(\[.*"css\!.*)(\.less)(".*\],[\s\S]*)/g, function (a, p1, p2, p3) {
                            console.log(i);
                            console.log("p1 " + p1);
                            console.log("p2 " + p2);
                            return p1 + ".min.css" + p3;
                        });

                    } while (i-- > 0 && old !== replaced);

                    //content.replace(/(define\(\[.*"css\!.*)(\.less)(".*\],[\s\S]*)/g, "$1.min.css$3")
                    grunt.file.write(f, replaced);
                }

            }
        });

        //  console.log(lessFiles);
        var lessTaskName = "less.srclib";
        grunt.config.set(lessTaskName, {
            options: {
                compress: true,
                paths: [outputPath],
                rootpath: outputPath,
                modifyVars: {
                    //   variable: '#fff',
                    "md-focused-color": "#f87f2e",
                    "ci-version": "20180408-04"
                },
                plugins: [
                    new (require('less-plugin-autoprefix'))({ browsers: ["last 2 versions"] }),
                    new (require('less-plugin-clean-css'))({ advanced: true })
                ]
            },
            files: lessFiles
        });
        var tasks = [lessTaskName].filter(function (f) { return f; }).map(function (t) { return t.replace(".", ":"); });
        grunt.task.run(tasks);

    });



    grunt.initConfig({
        requirejs: {
            compileApp: {
                options: {
                    // appDir:'./',
                    baseUrl: outputPath,
                    mainConfigFile: outputPath + "/src/main_common.js", // 'require-config.js','require-config.js',// 
                    paths: {
                        "oidc-client": "empty:",
                        "Msal": "empty:",
                        "adal": "empty:",
                        "stripe": "empty:",
                        "billboardjs": "empty:",
                        "adal-angular": "empty:",
                        "modules": "empty:",
                        "knockout": "libs/knockout/knockout-latest", //"empty:"   
                        "css-builder": "libs/css-builder/css-builder",
                        "normalize": "libs/css-builder/normalize",
                        "nprogress": "empty:"
                    },
                    dir: distPath,
                    modules: [

                      
                    ],
                    removeCombined: true,
                    optimize: "none",//"none",// "uglify",
                    generateSourceMaps: false,
                    optimizeCss: "none",// "standard.keepLines.keepWhitespace",
                    writeBuildTxt: false
                   
                    
                }
            }
        },
        copy: {
            www: {
                files: [

                    {
                        expand: true, cwd: outputPath, src: ["**/*"],
                        dest: distPath
                    }
                ]
            },
            root: {
                files: [

                    {
                        expand: true, cwd: srcPath, src: ["*.html", "*.appcache", "modules.json", "**/*.cshtml"],
                        dest: outputPath
                    }
                ]
            },
            bin: {
                files: [

                    {
                        expand: true, cwd: srcPath, src: ["**/content/**/*.png", "**/content/**/*.jpg", '**/fonts/**/*.eot', '**/fonts/**/*.svg', '**/fonts/**/*.ttf', '**/fonts/**/*.woff', '**/fonts/**/*.woff2'],
                        dest: outputPath + "/src"
                    }
                ]//
            },
            lib: {
                files: [
                    { expand: true, cwd: srcPath, src: ["**/*.less", "**/*.json", "**/templates/**/*.html", "**/*.js"], dest: outputPath + "/src" }
                ]//
                ,
                options: {
                    process: function (content, srcpath) {

                        if (srcpath.split(".").pop() === 'json') {
                            return require("strip-json-comments")(content);
                        }

                        return content;
                    }
                }
            },
            templates: {
                files: [
                    {
                        expand: true, cwd: srcPath, src: ["**/templates/**/*.html"], dest: outputPath + "/src", rename: function (dest, matchedSrcPath) {
                            /* Check if the Sass file has a 
                                * leading underscore.
                                */
                            return dest + "/" + matchedSrcPath + ".js";


                        }

                    }
                ],
                options: {
                    process: function (content, srcpath) {

                        return "define(function(){return '" +
                            jsEscape(content) +
                            "';});\n";
                    }

                }
            }
        }
        ,
        npmcopy: {
            libs: {
                options: {
                    destPrefix: outputPath + '/libs'
                },
                files: npmcopy(grunt)
            }
        }
    });
};