var assert = require("assert")
var basex = require("../basex-rest.js")
var libxmljs = require('libxmljs')
var _ = require('lodash')
var crypto = require('crypto')

describe('BaseX REST Client', function(){

    var client = new basex()

    describe('#get()', function(done){
        it('should return a listing of all databases', function(done){
            
                client.get()
                    .then(function(xml){
                        var parser = new libxmljs.SaxParser();
                        
                        parser.on('startElementNS', function(elem, attrs, prefix, uri, namespace){
                            assert.equal(uri, 'http://basex.org/rest')
                            assert(elem  === 'databases' || elem === 'database')
                        })

                        parser.on('endDocument', function(){
                            done()
                        })

                        parser.parseString(xml);

                    })
                    .fail(done)
        })
    })

    describe('#command()', function(done){
        it('should show info output on INFO', function(done){
            client.command('INFO')
                .then(function(response){

                    assert(response.match(/^\s*General Information/))
                    done()

                })
                .fail(done)
        })

    })

    describe('#query()', function(done){

        it('should format output as json', function(done){
            var q = '<json type="object"><test type="number">{ 1 + 1 }</test></json>';

            client.query(q, {
                    parameters: { method: 'json'}
                })
                .then(function(data){
                    var json = JSON.parse(data)
                    assert.equal(json.test, 2)
                    done()
                })
                .fail(done)
        })

        it('should be able to execute simple xquery code', function(done){
            client.query('db:system()')
                .then(function(xml){
                    var parser = new libxmljs.SaxParser(),
                        first = true;

                    parser.on('startElementNS', function(elem, attrs, prefix, uri, namespace){
                        if(first) 
                            assert(elem  === 'system')
                        first = false;
                    })

                    parser.on('endDocument', function(){
                        done()
                    })

                    parser.parseString(xml);
                })
                .fail(done)

        })
    })

    describe('#put()', function(done){
        var db = crypto.randomBytes(20).toString('hex');

        it('should be able to create databases', function(done){
            client.put(db, '<test/>', 'xml')
                .then(function(data){
                    
                    done()
                })
                .fail(done)
        })
        it('should be able to add xml resources', function(done){
            client.put(db+'/test.xml', '<test/>', 'xml')
                .then(function(data){
                    done()
                })
                .fail(done)
        })

        it('should be able to drop the db afterwards', function(done){
            client.command('DROP DB '+db)
                .then(function(){
                    done()
                })
                .fail(done)
        })
        
    })

})