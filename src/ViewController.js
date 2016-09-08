import path from 'path'
import morph from 'morph'
import _ from 'underscore'
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
 *  * `displayName` - defaults to class name
 *  * `instanceTitleField` - defaults to first attribute
 *  * `paginationOptions` - object with `sortField`, `sortDirection`, and `itemsPerPage` keys.
 *  * `ignoreFields` - blacklist of fields to ignore in display
 *  * `displayFields` - whitelist of fields to display
 * 
 * # Implement Routes
 * 
 * The default implementation of the routes handles querying for the model instance, pagination, and the template rendering. See the specific method documentation for each public view function.
 * 
 *
 */


class ViewController extends HasModels {
  constructor() {
    super()

    let routePrefix = this.routePrefix
    router.route(routePrefix, ::this._list)
    router.route(routePrefix+"/:id", ::this._view)

    // Yes, these should be __dirname not local to the subclass
    // Subclass templates are expected to be loaded by MVCModule or manually?
    templater.default().template(__dirname+"/templates/web-controller-detail.ejs", "page", this.templatePrefix+"-detail")
    templater.default().template(__dirname+"/templates/web-controller-list.ejs", "page", this.templatePrefix+"-list")
    templater.default().template(__dirname+"/templates/web-controller-paginator.ejs")
  }

  // Parameters
  
  modelNames() {
    return [this.modelIdentity]
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

  get instanceTitleField() {
    return null
  }

  get paginationOptions() {
    return {
      sortField: "updatedAt",
      sortDirection: "ASC",
      itemsPerPage: 20,
    }
  }

  get ignoreFields() {
    return ['id', 'createdAt', 'updatedAt']
  }

  get displayFields() {
    return []
  }

  // Finders

  get model() {
    return this.models[this.modelIdentity]
  }

  _paginationState(req) {
    let options = Object.assign({}, this.paginationOptions)
    options.currentPage =  parseInt(req.query.page) || 1
    if (req.query.items) {
      options.itemsPerPage = req.query.items
    }
    if (req.query.sort) {
      options.sortField = req.query.sort
    }
    if (req.query.dir) {
      options.sortDirection = req.query.dir
    }
    return options
  }

  _find(req) {
    let pageOptions = this._paginationState(req)
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
      return {objects, pagination: this._paginationState(req), attributes: this._modelAttributes()}
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
      return {object, attributes: this._modelAttributes()}
    })
  }

  _edit(req, res) {
    Promise.resolve(this.edit(req, res, this._findOne(req))).then((context) => {
      return templater.render(this.templatePrefix+"-edit", context).then(::res.send)
    })
  }

  _modelAttributes(withRelated=false) {
    let model = this.model
    let ignore = this.ignoreFields
    let display = this.displayFields
    let titleField = this.instanceTitleField
    let ignoreType = ['objectId']
    let related = []
    let attrs = _(model._attributes)
    .keys()
    .map((k, i) => {
      let ret = model._attributes[k]
      ret.name = k
      if(titleField == null && i ==0) {
        ret.isTitle = true
      } else if(titleField == k) {
        ret.isTitle = true
      }
      if(!ret.label) ret.label = this._sanitizeAttributeName(k)
      if(ret.enum) {
        ret.type = 'enum'
        ret.opts = ret.enum
      }
      if(ret.model) {
        ret.type = 'related'
        related.push(ret)
      }
      return ret
    })    
    .filter((k) => {
      if(display.length > 0)
        return display.includes(k.name)
      else
        return true
    })
    .filter((k) => {
      let ret = ignore.includes(k.name) 
      if(!ret) ret = ignoreType.includes(k.type)
      return !ret
    })
    if (!withRelated || _.isEmpty(related)) {
      return attrs
    } /* TODO clean this up
        else {
      return Promise.map(related, (rel) => {
        return this.app.get('storage').getModel(rel.model).then((m) => {
          return m.find()
        }).then((relInsts) => {
          rel.instances = relInsts
        })
      }).then(() => {
        return attrs
      })
    }
    */
  }

  _sanitizeAttributeName(string) {
    return morph.toTitle(string)
  }
  
  
}

export default ViewController
