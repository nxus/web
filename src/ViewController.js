import path from 'path'
import morph from 'morph'
import _ from 'underscore'
import Promise from 'bluebird'
import {application} from 'nxus-core'
import {templater} from 'nxus-templater'
import {router} from 'nxus-router'
import {storage, HasModels} from 'nxus-storage'

/**
 * A base class for CRUD routes and templates for a model
 * 
 * # Parameters
 * 
 * You can pass any of the following into the constructor options argument:
 *  * `modelIdentity` - defaults to name of class, underscored, e.g. `todo_item`
 *  * `prefix` - defaults to name of class, dashed, e.g. `todo-item`
 *  * `templatePrefix` - defaults to same as `prefix`
 *  * `routePrefix` - defaults to '/'+`prefix`
 *  * `pageTemplate` - the layout to use to render the page
 *  * `populate` - relationships to populate on find. Accepts a string, array, or array of [rel, options] arrays.
 *  * `displayName` - defaults to class name
 *  * `instanceTitleField` - defaults to first attribute
 *  * `paginationOptions` - object with `sortField`, `sortDirection`, and `itemsPerPage` keys.
 *  * `ignoreFields` - blacklist of fields to ignore in display
 *  * `displayFields` - whitelist of fields to display, show in this order if supplied
 *  * `listFields` - subset of fields to show on list view
 *  * `searchFields` - subset of fields to use for search strings
 *  * `idField` - field to use for id in routes
 * 
 * # Implement Routes
 * 
 * The default implementation of the routes handles querying for the model instance, pagination, and the template rendering. See the specific method documentation for each public view function.
 * 
 * # Overriding templates
 *  
 * Assuming your `opts.prefix`/`opts.templatePrefix` is `my-module`, the following templates are registered with default implementations: 
 *  * `my-module-detail`
 *  * `my-module-list`
 *  
 * Overriding this in your module by registering a template with `templater`, either by naming it `my-module-list.ejs` and using `templator.templateDir` or explicitly:
 *  
 * ```
 * import {templater} from 'nxus-templater'
 *  
 * class MyModule extends ViewController {
 *   constructor(opts={}) {
 *     ...
 *     super(opts)
 *     templater.replace().template(__dirname+"/path/to/template.ejs", this.pageTemplate, this.templatePrefix+"-detail")
 *   }
 * }
 * ```
 */


class ViewController extends HasModels {
  constructor(options={}) {
    let _modelIdentity = options.modelIdentity || morph.toSnake(new.target.name)
    if (!options.modelNames) {
      options.modelNames = [_modelIdentity]
    } else if (_.isArray(options.modelNames) && !options.modelNames.includes(_modelIdentity)) {
      options.modelNames.push(_modelIdentity)
    } else if (_.isObject(options.modelNames) && !options.modelNames[_modelIdentity]) {
      options.modelNames[_modelIdentity] = _modelIdentity
    }
    
    super(options)

    this.modelIdentity = options.modelIdentity || _modelIdentity
    this.prefix = options.prefix || morph.toDashed(new.target.name)
    this.templatePrefix = options.templatePrefix || this.prefix
    this.pageTemplate = options.pageTemplate || 'page'
    this.populate = options.populate || []
    if (!_.isArray(this.populate)) {
      this.populate = [this.populate]
    }
    this.routePrefix = options.routePrefix || '/' + this.prefix
    this.displayName = options.displayName || new.target.name
    this.paginationOptions = options.paginationOptions || {
      sortField: 'updatedAt',
      sortDirection: 'ASC',
      itemsPerPage: 20,
    }
    this.ignoreFields = options.ignoreFields || ['id', 'createdAt', 'updatedAt']
    this.displayFields = options.displayFields || []
    this.listFields = options.listFields || []
    this.searchFields = options.searchFields || []
    this.instanceTitleField = options.instanceTitleField || (this.displayFields.length > 0 ? this.displayFields[0] : null)
    this.idField = options.idField || 'id'

    

    let routePrefix = this.routePrefix
    router.route(routePrefix, ::this._list)
    router.route(routePrefix+'/view/:id', ::this._detail)

    // Yes, these should be __dirname not local to the subclass
    // Subclass templates are expected to be loaded by MVCModule or manually?
    templater.default().template(__dirname+'/templates/web-controller-detail.ejs', this.pageTemplate, this.templatePrefix+'-detail')
    templater.default().template(__dirname+'/templates/web-controller-list.ejs', this.pageTemplate, this.templatePrefix+'-list')
    templater.default().template(__dirname+'/templates/web-controller-paginator.ejs')
  }

  // Finders

  get model() {
    return this.models[this.modelIdentity]
  }

  _paginationState(req) {
    let options = Object.assign({}, this.paginationOptions)
    options.currentPage =  parseInt(req.query.page) || 1
    if (req.query.items !== undefined) {
      options.itemsPerPage = parseInt(req.query.items)
    }
    if (req.query.sort) {
      options.sortField = req.query.sort
    }
    if (req.query.dir) {
      options.sortDirection = req.query.dir
    }
    return options
  }

  _filterQuery(req) {
    let query = {}
    let search = req.query.search
    if (search) {
      query.or = []
      let fields = this.searchFields.length > 0 ? this.searchFields : this.displayFields
      for (let f of fields) {
        let x = {}
        x[f] = {contains: search}
        query.or.push(x)
      }
    }
    return query
  }

  _find(req) {
    let pageOptions = this._paginationState(req)
    let find = this.model.find()
      .where(this._filterQuery(req))
      .sort(pageOptions.sortField + ' ' + pageOptions.sortDirection)
      .limit(pageOptions.itemsPerPage)
      .skip((pageOptions.currentPage-1)*pageOptions.itemsPerPage)
    for (let p of this.populate) {
      if (!_.isArray(p)) p = [p]
      find.populate(...p)
    }
    return find
  }

  _findOne(req) {
    let query = {}
    query[this.idField] = req.params.id
    let find =  this.model.findOne(query)
    for (let p of this.populate) {
      if (!_.isArray(p)) p = [p]
      find.populate(...p)
    }
    return find
  }

  _count(req) {
    return this.model.count(this._filterQuery(req))
  }

  defaultContext(req, related=false) {
    return this._modelAttributes(related, req).then((attrs) => {
      return {
        req: req,
        pagination: this._paginationState(req),
        attributes: attrs,
        displayName: this.displayName,
        base: this.routePrefix,
        instanceUrl: this.routePrefix+"/view",
        idField: this.idField,
        title: this.displayName
      }
    })
  }
  
  // Routes

  _list(req, res) {
    Promise.all([
      this.list(req, res, this._find(req)),
      this.defaultContext(req),
      this._count(req)
    ]).spread((context, defaultContext, count) => {
      defaultContext.pagination.count = count
      if (this.listFields.length > 0) {
        defaultContext.attributes = defaultContext.attributes.filter(x => this.listFields.includes(x.name))
      }
      context = Object.assign(defaultContext, context)
      return templater.render(this.templatePrefix+'-list', context).then(::res.send)
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
      return {objects}
    })
  }

  _detail(req, res, next) {
    this._findOne(req).then((object) => {
      if (!object) {
        res.status(404)
        next()
      } else {
        return Promise.all([
          this.detail(req, res, this._findOne(req)),
          this.defaultContext(req)
        ]).spread((context, defaultContext) => {
          context = Object.assign(defaultContext, context)
          return templater.render(this.templatePrefix+'-detail', context).then(::res.send)
        })
      }
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
  detail(req, res, query) {
    return query.then((object) => {
      return {object, title: this.displayName + (this.instanceTitleField ? ': ' + object[this.instanceTitleField] : '')}
    })
  }

  /*
  * Override to modify the related objects find for related attributes
  * Use this to filter by user
  * @param {String} modelName 
  * @param {Object} find default find() for the related model (returned unmodified by default)
  * @param {Request} req The express req object
  * @returns {Object) the find() to use
  */
  relatedInstances(modelName, find, req) {
    return find
  }

  _modelAttributes(withRelated=false, req=null) {
    let model = this.model
    let ignore = this.ignoreFields
    let display = this.displayFields
    let titleField = this.instanceTitleField
    let ignoreType = ['objectId']
    let related = []
    let attrs = _(model._attributes)
    .keys()
    .map((k, i) => {
      let ret = {...model._attributes[k]}
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
      if(ret.collection) {
        ret.type = 'related-many'
        related.push(ret)
      }
      return ret
    })    
    .filter((k) => {
      let ret = ignore.includes(k.name) 
      if(!ret) ret = ignoreType.includes(k.type)
      return !ret
    })
    if (display.length > 0) {
      attrs = display.map((x) => { return attrs.find(a => a.name == x) })
    }
    if (!withRelated || _.isEmpty(related)) {
      return Promise.resolve(attrs)
    } else {
      return Promise.map(related, (rel) => {
        let modelName = rel.model || rel.collection
        return storage.getModel(modelName).then((m) => {
          let ret = m.find()
          if (m.defaultSort) {
            ret = ret.sort(m.defaultSort())
          }
          return this.relatedInstances(modelName, ret, req)
        }).then((relInsts) => {
          rel.instances = relInsts
        })
      }).then(() => {
        return attrs
      })
    }
  }

  _sanitizeAttributeName(string) {
    return morph.toTitle(string)
  }
  
  
}

export default ViewController
