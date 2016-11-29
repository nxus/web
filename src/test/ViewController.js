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
})
