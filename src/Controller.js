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
 * You can define getters on your subclass for the following settings:
 *  * `modelIdentity` - defaults to name of class, underscored, e.g. `todo_item`
 *  * `prefix` - defaults to name of class, dashed, e.g. `todo-item`
 *  * `templatePrefix` - defaults to parent containing directory (module) + `prefix`, e.g. `mymodule-todo-item-`
 *  * `routePrefix` - defaults to "/"+`prefix`
 *  * `editEnabled` - defaults to true
 *  * `displayName` - defaults to class name
 *  * `paginationOptions` - object with `sortField`, `sortDirection`, and `itemsPerPage` keys.
 * 
 * # Implement Routes
 * 
 * The default implementation of the routes handles querying for the model instance, pagination, and the template rendering. See the specific method documentation for each public view function.
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

    // Yes, these should be __dirname not local to the subclass
    // Subclass templates are expected to be loaded by MVCModule or manually?
    templater.default().template(__dirname+"/templates/web-controller-detail.ejs", "page", this.templatePrefix+"-detail")
    templater.default().template(__dirname+"/templates/web-controller-list.ejs", "page", this.templatePrefix+"-list")
    templater.default().template(__dirname+"/templates/web-controller-paginator.ejs")
    
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
    return this.prefix // path.basename(path.dirname(this._dirName))+"-"+this.prefix
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

  
  get paginationOptions() {
    return {
      sortField: "updatedAt",
      sortDirection: "ASC",
      itemsPerPage: 20,
    }
  }

  // Finders

  get model() {
    return this.models[this.modelIdentity]
  }

  _paginationState(req) {
    let options = Object.assign({}, this.paginationOptions)
    options.currentPage =  parseInt(req.param('page')) || 1
    if (req.param('items')) {
      options.itemsPerPage = req.param('items')
    }
    if (req.param('sort')) {
      options.sortField = req.param('sort')
    }
    if (req.param('dir')) {
      options.sortDirection = req.param('dir')
    }
    return options
  }

  _find(req) {
    let pageOptions = this.paginationState(req)
    return this.model.find()
      .where({})
      .sort(pageOptions.sortField + " " + pageOptions.sortDirection)
      .limit(pageOptions.itemsPerPage)
      .skip((pageOptions.currentPage-1)*pageOptions.itemsPerPage)
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

 /**
   * Implement the list route. Resolve the passed query and return the context for template `templatePrefix-list`
   * @param {Request}  req The express request object
   * @param {Response} res The express response object
   * @param {object} query A query that can be further filtered or populated before resolution
   * @returns {object} The context for template rendering. Include `pagination: this.paginationOptions` by default
   */
  
  list(req, res, query) {
    return query.then((objects) => {
      return {objects, pagination: this.paginationOptions}
    })
  }

  _view(req, res) {
    Promise.resolve(this.view(req, res, this._findOne(req))).then((context) => {
      return templater.render(this.templatePrefix+"-view", context).then(::res.send)
    })
  }

 /**
   * Implement the view/detail route. Resolve the passed query and return the
   * context for template `templatePrefix-view`
   * @param {Request}  req The express request object
   * @param {Response} res The express response object
   * @param {object} query A query for one object that can be further populated before resolution
   * @returns {object} The context for template rendering.
   */
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

   /**
   * Implement the edit route. Resolve the passed query and return the context for template `templatePrefix-edit`
   * @param {Request}  req The express request object
   * @param {Response} res The express response object
   * @param {object} query A query that can be further filtered or populated before resolution
   * @returns {object} The context for template rendering.
   */

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

   /**
   * Implement the create route. Return the context for template `templatePrefix-create`
   * @param {Request}  req The express request object
   * @param {Response} res The express response object
   * @param {object} object An empty object for setting defaults for the template
   * @returns {object} The context for template rendering.
   */
  
  create(req, res, object) {
    return {object}
  }

  save(req, res) {
    let values = req.body
    let promise = values.id
      ? this.model.update(values.id, values)
      : this.model.create(values)
    promise.then((inst) => {
      req.flash('info', this.displayName + " saved")
      res.redirect(this.routePrefix)
    }).catch((e) => {
      this.log.error(e)
      req.flash('error', "Error saving "+this.displayName+": "+e)
      if (values.id) {
        res.redirect(this.routePrefix+"/"+values.id+"/edit")
      } else {
        res.redirect(this.routePrefix+"/create")
      }
    }) 
  }
  
  remove(req, res) {
    return this.model.destroy(req.params.id).then((inst) => {
      req.flash('info', this.displayName + " deleted")
      return res.redirect(this.routePrefix)
    })
  }
  
}

export default Controller
