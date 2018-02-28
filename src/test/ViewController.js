import sinon from 'sinon'
import {router} from 'nxus-router'
import ViewController from '../ViewController'

describe("ViewController", () => {
  before(() => {
//    sinon.spy(router, "provide")
  })
  
  it("should not be null", () => {
    ViewController.should.not.be.null
  })

  describe("Subclassing", () => {

    class ThingOne extends ViewController {
        
    }

    it("should have appropriate prefixes", () => {
      let t = new ThingOne()
      t.modelIdentity.should.equal('thing_one')
      t.prefix.should.equal('thing-one')
      t.routePrefix.should.equal('/thing-one')
      t.templatePrefix.should.equal('thing-one')
    })

    it("should register routes", () => {
      router.provide.calledWith("route", "/thing-one").should.be.true
      router.provide.calledWith("route", "/thing-one/view/:id").should.be.true
    })


    class ThingTwo extends ViewController {

    }

    it("should have overridden prefixes", () => {
      let t = new ThingTwo({modelIdentity: 'other', templatePrefix: 'custom', prefix: 'custom'})
      t.modelIdentity.should.equal('other')
      t.prefix.should.equal('custom')
      t.templatePrefix.should.equal('custom')
    })

    it("should always include modelIdentity in modelNames", () => {
      let t = new ThingTwo({modelIdentity: 'other', modelNames: ['two']})
      t._modelNames.should.contain('other')
      t._modelNames.should.contain('two')
    })
    it("should always include modelIdentity in modelNames if object", () => {
      let t = new ThingTwo({modelIdentity: 'other', modelNames: {'two': 'Two'}})
      t._modelNames.should.have.property('other')
      t._modelNames.should.have.property('two')
    })
  })


  describe("pagination", () => {
    class Paged extends ViewController {
        
    }

    it("should have defaults", () => {
      let t = new Paged()
      t.should.have.property('paginationOptions')
      t.paginationOptions.should.have.property('sortField', 'updatedAt')
      t.paginationOptions.should.have.property('sortDirection', 'ASC')
      t.paginationOptions.should.have.property('itemsPerPage', 20)
    })
    it("should get from req.query", () => {
      let t = new Paged()
      let p = t._paginationState({
        query: {
          page: 2,
          items: 10,
          sort: 'name',
          dir: 'DESC'
        }
      })
      p.should.have.property('sortField', 'name')
      p.should.have.property('sortDirection', 'DESC')
      p.should.have.property('itemsPerPage', 10)
      p.should.have.property('currentPage', 2)
    })
    
  })

  describe("Search Query", () => {
    class Query extends ViewController {
        
    }

    it("should find all by default", () => {
      let t = new Query()
      let q = t._filterQuery({query: {}})
      q.should.eql({})
    })
    it("should get from req.query to searchFields", () => {
      let t = new Query({searchFields: ['name', 'email'], displayFields: []})
      let q = t._filterQuery({query: {search: 'bob'}})
      q.should.eql({or: [{name: {contains: 'bob'}}, {email: {contains: 'bob'}}]})
    })
    it("should fallback to displayFields", () => {
      let t = new Query({displayFields: ['name']})
      let q = t._filterQuery({query: {search: 'bob'}})
      q.should.eql({or: [{name: {contains: 'bob'}}]})
    })
    
  })
  
})
