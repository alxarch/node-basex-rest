var assert = require("assert")
var basex = require("../basex-rest.js")
var libxmljs = require('libxmljs')
var _ = require('lodash')
var crypto = require('crypto')

describe('BaseX REST Client', function(){

    var client = new basex()

    describe('#get()', function(done){
        it('should return a listing of all databases', function(done){
            var def = client.get();
            
                def.then(function(xml){
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

                def.fail(done)
        })
    })

    describe('#command()', function(done){
        it('should show info output on INFO', function(done){
            var def = client.command('INFO');

            def.then(function(response){

                assert(response.match(/^\s*General Information/))
                done()

            })
            
            def.fail(done)
        })

    })

    describe('#query()', function(done){
        it('should format output as json', function(done){
            var xql = '<json type="object"><test type="number">{ 1 + 1 }</test></json>',
                def = client.query(xql, {
                    parameters: {
                        method: 'json'
                    }
                });

            def.done(function(data){
                var json = JSON.parse(data)
                assert.equal(json.test, 2)
                done()
            })
            def.fail(done)
        })

        it('should be able to execute simple xquery code', function(done){
            var def = client.query('db:system()');

            def.then(function(xml){
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

            def.fail(done)

        })
    })

    describe('#put()', function(done){
        var db = crypto.randomBytes(20).toString('hex');

        it('should be able to create databases', function(done){
            var def = client.put(db, '<test/>', 'xml');

            def.done(function(data){
                
                done()
            })

            def.fail(done)
        })
        it('should be able to add xml resources', function(done){
            var def = client.put(db+'/test.xml', '<test/>', 'xml');

            def.done(function(data){
                
                done()
            })
            def.fail(done)
        })

        it('should be able to drop the db afterwards', function(done){
            var def = client.command('DROP DB '+db)
            def.then(function(){
                done()
            })

            def.fail(done)
            
        })
        
    })

})