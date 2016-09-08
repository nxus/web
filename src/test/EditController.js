import sinon from 'sinon'
import {router} from 'nxus-router'
import EditController from '../EditController'

describe("EditController", () => {
  before(() => {
    sinon.spy(router, "provide")
  })
  
  it("should not be null", () => {
    EditController.should.not.be.null
  })

  describe("Subclassing", () => {

    class EditThingOne extends EditController {
        
    }

    it("should have appropriate prefixes", () => {
      let t = new EditThingOne()
      t.modelIdentity.should.equal('edit_thing_one')
      t.prefix.should.equal('edit-thing-one')
      t.routePrefix.should.equal('/edit-thing-one')
      t.templatePrefix.should.equal('edit-thing-one')
    })

    it("should register routes", () => {
      router.provide.calledWith("route", "/edit-thing-one").should.be.true
      router.provide.calledWith("route", "/edit-thing-one/view/:id").should.be.true
      router.provide.calledWith("route", "/edit-thing-one/edit/:id").should.be.true
      router.provide.calledWith("route", "/edit-thing-one/create").should.be.true
      router.provide.calledWith("route", "POST", "/edit-thing-one/edit/:id").should.be.true
      router.provide.calledWith("route", "POST", "/edit-thing-one/create").should.be.true
      router.provide.calledWith("route", "POST", "/edit-thing-one/delete/:id").should.be.true
    })

  })
})
