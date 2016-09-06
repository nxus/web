import sinon from 'sinon'
import {router} from 'nxus-router'
import Controller from '../Controller'

describe("Controller", () => {
  before(() => {
    sinon.spy(router, "provide")
  })
  
  it("should not be null", () => {
    Controller.should.not.be.null
  })

  describe("Subclassing", () => {

    class ThingOne extends Controller {
        
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
      router.provide.calledWith("route", "/thing-one/:id").should.be.true
      router.provide.calledWith("route", "/thing-one/:id/edit").should.be.true
      router.provide.calledWith("route", "/thing-one/create").should.be.true
      router.provide.calledWith("route", "POST", "/thing-one/:id/edit").should.be.true
      router.provide.calledWith("route", "POST", "/thing-one/create").should.be.true
      router.provide.calledWith("route", "POST", "/thing-one/:id/delete").should.be.true
    })

    class ThingTwo extends Controller {

      get modelIdentity() {
        return "other"
      }
      
      get prefix() {
        return 'custom'
      }
    }
    it("should have overridden prefixes", () => {
      let t = new ThingTwo()
      t.modelIdentity.should.equal('other')
      t.prefix.should.equal('custom')
      t.templatePrefix.should.equal('custom')
    })
  })
})
