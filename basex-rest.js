var _ = require('lodash');
var Q = require('q');
var http = require('http');
var pa = require('path');
var fs = require('fs');

var tpl = {
  query: _.template(fs.readFileSync('./templates/query.xml', 'utf8')),
  command: _.template(fs.readFileSync('./templates/command.xml', 'utf8')),
  run: _.template(fs.readFileSync('./templates/run.xml', 'utf8'))
};

var defaults = {
    host: 'localhost',
    path: '/rest',
    port: '8984',
    user: 'admin',
    pass: 'admin'
};

var validtypes = {
    'xml': 'application/xml',
    'json': 'application/json',
    'jsonml': 'application/jsonml',
    'text': 'text/plain',
    'html': 'text/html',
    'csv': 'text/comma-separated-values',
    'raw': 'application/octet-stream'
};

var responseHandler = function(deferred){
    return function(res){
        var response = [];
        switch(res.statusCode){
            case 200:
            case 201:
                res.setEncoding('utf8');
                res.on('data', function(data){
                    response.push(data)
                })
                res.on('end', function(){
                    deferred.resolve(response.join(''))
                });
                break;
            default:
                deferred.reject(new Error('Request failed: '+res.statusCode));
                break;
        }
    }
}

function BaseXRESTClient(settings){
    this.settings = _.extend(settings || {}, defaults);
};

BaseXRESTClient.prototype = {
    _req: function(params, callback){
        var opt = this.settings;
        return http.request(_.extend({
            hostname: opt.host,
            port: opt.port,
            auth: opt.user + ':' + opt.pass
        }, params || {}), callback);
    },
    _delete: function(path){
        var deferred = Q.defer(),
            callback = responseHandler(deferred),
            req = this._req({
                method: 'DELETE',
                path: pa.join(this.settings.path, path)
            }, callback);

        req.end();

        return deferred.promise;
    },
    _put: function(data, path, type){
        var deferred = Q.defer(),
            callback = responseHandler(deferred),
            headers = {
              'Content-Type': type,
              'Content-Length': data ? data.length : 0
            },
            req = this._req({
                method: 'PUT',
                path: pa.join(this.settings.path, path),
                headers: data ? headers : data
            }, callback);
        
        if(data)
            req.write(data);

        req.end();

        return deferred.promise;

    },
    _post: function(data, path){
        var deferred = Q.defer(),
            callback = responseHandler(deferred),
            headers = {
              'Content-Type': 'application/xml',
              'Content-Length': data.length
            },
            req = this._req({
                method: 'POST',
                path: pa.join(this.settings.path, path),
                headers: headers
            }, callback);

        req.write(data);
        req.end();

        return deferred.promise;
    },
    _get: function(path){
         var deferred = Q.defer(),
             callback = responseHandler(deferred),
             req = this._req({
                 method: 'GET',
                 path: pa.join(this.settings.path, path)
             }, callback);

        req.end();

        return deferred.promise;
    },
    get: function(path){
        return this._get(path);
    },
    del: function(path){
        return this._delete(path);
    },
    put: function(path, data, type){

        if(data && _.isUndefined(validtypes[type]))
            throw new Error('Wrong data type.');

        return this._put(data, path, validtypes[type]);
    },
    query: function(query, options){
        var opt = options || {},
            postdata = tpl.query({
                query: query,
                parameters: opt.parameters || {},
                variables: opt.variables || {},
                options: opt.options || {},
                context: opt.context || null
            });
            
        return this._post(postdata, opt.path);
    },
    command: function(cmd, options){
        var opt = options || {},
            postdata = tpl.command({
                command: cmd,
                parameters: opt.parameters || {},
                options: opt.options || {}
            });

        return this._post(postdata, opt.path);
    },
    run: function(script, options){
        var opt = options || {},
        postdata = tpl.run({
            script: script,
            parameters: opt.parameters || {},
            variables: opt.variables || {},
            options: opt.options || {},
            context: opt.context || null
        });

        return this._post(postdata, opt.path);
    }
};

module.exports = BaseXRESTClient;
