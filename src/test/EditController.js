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
  describe("Hooks for CRUD", () => {

    let req, res, t
    
    class EditNothing extends EditController {
      constructor() {
        super()
        this.redirect = false
        this.didCreate = false
        this.didUpdate = false
        this.didRelatedUpdate = false
        this.didRemove = false
      }
      
      async _doCreate(values) {
        this.didCreateWithoutID = (values.id === undefined)
        this.didCreate = true
      }

      async _doUpdate(id, values) {
        this.didUpdateWithID = (id !== undefined && id == values.id)
        this.didUpdate = true
      }

      async _doRemove(id) {
        this.didRemove = true
      }

      async _doRelatedUpdate(inst, related) {
        this.didRelatedUpdate = true
      }
      
      async _modelAttributes() {
        return [{name: 'id', type: 'uuid'}]
      }
    }

    before(() => {
      req = {flash: sinon.spy(), body: {}}
      res = {}
      t = new EditNothing()
    })
    
    it("should call _doCreate on save without id", async () => {
      await t.save(req, res)
      t.didCreate.should.be.true
      t.didCreateWithoutID.should.be.true
      req.flash.calledWith("info").should.be.true
      req.flash.calledWith("error").should.be.false
    })

    it("should call _doUpdate on save with id", async () => {
      req.body.id = 1
      await t.save(req, res)
      t.didUpdate.should.be.true
      t.didUpdateWithID.should.be.true
      req.flash.calledWith("info").should.be.true
      req.flash.calledWith("error").should.be.false
    })

    it("should call _doRemove on remove", async () => {
      req.params = {id: 1}
      await t.remove(req, res)
      t.didRemove.should.be.true
      req.flash.calledWith("info").should.be.true
      req.flash.calledWith("error").should.be.false
    })

  })
})
