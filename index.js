var utils = require('loader-utils');
var fs = require('fs');
var path = require('path');
var nunjucks = require('nunjucks');

var NunjucksLoader = nunjucks.Loader.extend({
    //Based off of the Nunjucks 'FileSystemLoader'

    init: function(searchPaths, sourceFoundCallback) {
    	this.sourceFoundCallback = sourceFoundCallback;
        if(searchPaths) {
            searchPaths = Array.isArray(searchPaths) ? searchPaths : [searchPaths];
            // For windows, convert to forward slashes
            this.searchPaths = searchPaths.map(path.normalize);
        }
        else {
            this.searchPaths = ['.'];
        }
    },

    getSource: function(name) {
    	var fullpath = null;
        var paths = this.searchPaths;

        for(var i=0; i<paths.length; i++) {
            var basePath = path.resolve(paths[i]);
            var p = path.resolve(paths[i], name);

            // Only allow the current directory and anything
            // underneath it to be searched
            if(p.indexOf(basePath) === 0 && fs.existsSync(p)) {
                fullpath = p;
                break;
            }
        }

        if(!fullpath) {
            return null;
        }

        this.sourceFoundCallback(fullpath);

        return {
			src: fs.readFileSync(fullpath, 'utf-8'),
			path: fullpath,
			noCache: this.noCache
		};
    }
});

module.exports = function(content) {

    this.cacheable();

	var callback = this.async();
    var opt = utils.getOptions(this) || {};

	var nunjucksSearchPaths = opt.searchPaths;
    var nunjucksContext = opt.context;
    var locales = opt.locales;
    var locale = utils.parseQuery(this.resourceQuery);

    var config = opt.configure || {};
    var configureEnvironment = opt.configureEnvironment || function(env) {};

	var loader = new NunjucksLoader(nunjucksSearchPaths, function (path) {
		this.addDependency(path);
    }.bind(this));

    var nunjEnv = new nunjucks.Environment(loader, config);

    if (locale.locale) {
        nunjEnv.addGlobal('locale', locale.locale);
    }

    if (locales) {
        nunjEnv.addGlobal('locales', locales.localizations);
    }

    configureEnvironment(nunjEnv);

    var template = nunjucks.compile(content, nunjEnv);
    
	html = template.render(nunjucksContext);

	callback(null, html);
};

