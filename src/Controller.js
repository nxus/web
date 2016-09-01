import path from 'path'
import morph from 'morph'
import {application} from 'nxus-core'
import {templater} from 'nxus-templater'
import {router} from 'nxus-router'
import {storage, HasModels} from 'nxus-storage'

/**
 * A base class for CRUD routes and templates for a model
 * 
 * # Parameters
 * 
 * 
 * # Implement Routes
 * 
 * 
 * 
 *
 */


class Controller extends HasModels {
  constructor() {
    super()

    let routePrefix = this.routePrefix
    router.route(routePrefix, ::this._list)
    router.route(routePrefix+"/:id", ::this._view)
    if (this.editEnabled) {
      // TODO perhaps this should be via an EditController subclass rather than flag
      router.route(routePrefix+"/create", ::this._create)
      router.route(routePrefix+"/:id/edit", ::this._edit)
      router.route("POST", routePrefix+"/create", ::this.save)
      router.route("POST", routePrefix+"/:id/edit", ::this.save)
      router.route("POST", routePrefix+"/:id/delete", ::this.remove)
    }
  }

  // Parameters
  
  modelNames() {
    return [this._modelIdentity]
  }

  get modelIdentity() {
    return morph.toSnake(this.constructor.name)
  }

  get prefix() {
    return morph.toDashed(this.constructor.name)
  }

  get templatePrefix() {
    return path.basename(path.dirname(this._dirName))+"-"+this.prefix
  }

  get routePrefix() {
    return "/"+this.prefix
  }
  
  get editEnabled() {
    return true
  }

  get displayName() {
    return this.constructor.name
  }

  // Finders

  get model() {
    return this.models[this.modelIdentity]
  }

  _find(req) {
    return this.model.find()
  }

  _findOne(req) {
    return this.model.findOne()
  }
  
  // Routes

  _list(req, res) {
    Promise.resolve(this.list(req, res, this._find(req))).then((context) => {
      return templater.render(this.templatePrefix+"-list", context).then(::res.send)
    })
  }
  
  list(req, res, query) {
    return query.then((objects) => {
      return {objects}
    })
  }

  _view(req, res) {
    Promise.resolve(this.view(req, res, this._findOne(req))).then((context) => {
      return templater.render(this.templatePrefix+"-view", context).then(::res.send)
    })
  }

  view(req, res, query) {
    return query.then((object) => {
      return {object}
    })
  }

  _edit(req, res) {
    Promise.resolve(this.edit(req, res, this._findOne(req))).then((context) => {
      return templater.render(this.templatePrefix+"-edit", context).then(::res.send)
    })
  }
  
  edit(req, res, query) {
    return query.then((object) => {
      return {object}
    })
  }

  _create(req, res) {
    Promise.resolve(this.create(req, res, new this.model())).then((context) => {
      return templater.render(this.templatePrefix+"-create", context).then(::res.send)
    })
  }
  
  create(req, res, object) {
    return {object}
  }

  save(req, res) {
    
  }
  
  remove(req, res) {
    return this.model.destroy(req.params.id).then((inst) => {
      req.flash('info', this.displayName + " deleted")
      return res.redirect(this.routePrefix)
    })
  }
  
}

export default Controller
