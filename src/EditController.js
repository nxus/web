import morph from 'morph'
import _ from 'underscore'
import Promise from 'bluebird'
import {application} from 'nxus-core'
import {templater} from 'nxus-templater'
import {router} from 'nxus-router'

import ViewController from './ViewController'

/**
 * A base class for CRUD routes and templates for a model
 *
 * # Parameters
 *  See Controller docs
 *
 * You can pass any of the constructor options arguments defined by
 * `ViewController`, plus the following:
 *  * `redirect` - set to false to disable redirect (default is true)
 *  * `redirectAfterCreate` - path suffix to routePrefix after route
 *  * `redirectAfterEdit` - path suffix to routePrefix after route
 *  * `redirectAfterDelete` - path suffix to routePrefix after route
 *
 *
 * # Implement Routes
 *
 * The default implementation of the routes handles querying for the
 * model instance, pagination, and the template rendering. See the
 * specific method documentation for each public view function.
 *
 * # Overriding templates
 * See also the `ViewController` templates documentation.
 * Assuming your `opts.prefix`/`opts.templatePrefix` is `my-module`, the following templates are registered with default implementations:
 *  * `my-module-create`
 *  * `my-module-edit`
 *
 */

class EditController extends ViewController {
  constructor(options={}) {
    super(options)

    this.routeDetail = '/edit'

    let routePrefix = this.routePrefix
    router.route(routePrefix+"/create", ::this._create)
    router.route(routePrefix+"/edit/:id", ::this._edit)
    router.route("POST", routePrefix+"/create", ::this.save)
    router.route("POST", routePrefix+"/edit/:id", ::this.save)
    router.route("POST", routePrefix+"/delete/:id", ::this.remove)

    this.redirect = (options.redirect != undefined) ? options.redirect : true
      // default to true for benefit of existing code
    this.redirectAfterCreate = options.redirectAfterCreate || ""
    this.redirectAfterEdit = options.redirectAfterEdit || ""
    this.redirectAfterDelete = options.redirectAfterDelete || ""

    application.onceAfter('startup', () => {
      templater.on('renderContext.admin-page', (opts) => {
        return {
          styles: [
            '/assets/web/edit/datetimepicker/build/jquery.datetimepicker.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.8/css/select2.min.css'
          ],
          scripts: [
            '/assets/web/edit/datetimepicker/build/jquery.datetimepicker.full.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.8/js/select2.min.js'
          ]
        }
      })
    })

    router.staticRoute("/assets/web/edit/datetimepicker", __dirname+"/assets/datetimepicker")

    // Yes, these should be __dirname not local to the subclass
    // Subclass templates are expected to be loaded by MVCModule or manually?
    templater.default().template(__dirname+"/templates/web-controller-form.ejs", this.pageTemplate, this.templatePrefix+"-create")
    templater.default().template(__dirname+"/templates/web-controller-form.ejs", this.pageTemplate, this.templatePrefix+"-edit")
    templater.default().template(__dirname+"/templates/web-controller-paginator.ejs")
  }

  /** Replaces route parameters with values.
   * @param {string} route route path
   * @param {Object} params parameter replacements
   * @returns {string} route path, with parameters replaced
   */
  static replaceRouteParams(route, params) {
    _.each(params, (val, key) => { route = route.replace(":" + key, val) })
    return route
  }

  /*
  * Override to modify the routes used for redirects, links.
  * Useful to replace extra route `:params` in `this.routePrefix`.
  * @param {Request} req The express req object
  * @param {String} route The route to be updated
  * @param {Object} inst the model instance that has been saved (from
  *   create or edit actions) or deleted; undefined when route is for
  *   the default context; may also be undefined if the save or delete
  *   failed
  * @returns {String} The route to be used
  */
  routeForRequest(req, route, inst) {
    return route
  }

  defaultContext(req, related=false) {
    return super.defaultContext(req, related).then((ret) => {
      ret.instanceUrl = this.routeForRequest(req, this.routePrefix+this.routeDetail)
      return ret
    })
  }

  // Routes

  _edit(req, res, next) {
    return this._findOne(req).then((object) => {
      if (!object) {
        res.status(404)
        next()
      } else {
        this.defaultContext(req, true).then((defaultContext) => {
          let finder = this._findOne(req)
          _.filter(defaultContext.attributes, (attr) => {
            return attr.type == 'related-many'
          }).forEach((attr) => {
            finder = finder.populate(attr.name)
          })
          return this.edit(req, res, finder).then((context) => {
            return Object.assign(defaultContext, context)
          })
        }).then(async (context) => {
          let templates = await templater.getTemplates()
          context.checkTemplate = (template) => {
            return templates["web-form-input-"+template]
          }
          return templater.render(this.templatePrefix+"-edit", context).then(::res.send)
        })
      }
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
      return {title: "Edit "+ this.displayName + (this.instanceTitleField ? ": " + object[this.instanceTitleField] : ''), object}
    })
  }

  _create(req, res) {
    return Promise.all([
      this.create(req, res, {}),
      this.defaultContext(req, true)
    ]).spread(async (context, defaultContext) => {
      context = Object.assign(defaultContext, context)
      let templates = await templater.getTemplates()
      context.checkTemplate = (template) => {
        return templates["web-form-input-"+template]
      }
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
    return {title: "Create " + this.displayName, object}
  }

   /**
   * Override to perform custom update logic
   * @param {id} id ID to update
   * @param {object} values Fields object
   * @returns {object} The updated instance
   */
  async _doUpdate(id, values) {
    return this.model.update(id, values).then((is) => {return is[0]})
  }

   /**
   * Override to perform custom create logic
   * @param {object} values Fields object
   * @returns {object} The created instance
   */
  async _doCreate(values) {
    return this.model.create(values)
  }

   /**
   * Override to perform custom related field updates after create or update
   * @param {object} inst instance to set related fields for
   * @param {object} related {related_field: value} object
   * @returns {object} The updated instance
   */
  async _doRelatedUpdate(inst, related) {
    let find = this.model.findOne(inst.id)
    for (let k in related) {
      find = find.populate(k)
    }
    inst = await find
    for (let k in related) {
      let added = related[k]
      for (let ex of inst[k]) {
        if (added.includes(ex.id)) {
          added = _.without(added, ex.id)
        } else {
          inst[k].remove(ex.id)
        }
      }
      for (let i of added) {
        inst[k].add(i)
      }
    }
    await inst.save()
    return inst
  }


   /**
   * Override to perform custom remove logic
   * @param {id} id ID to remove
   * @returns {object} The updated instance
   */
  async _doRemove(id) {
    return this.model.destroy(id)
  }

   /**
   * Implement object save for create and edit routes.
   *
   * @param {Request}  req The express request object
   * @param {Response} res The express response object
   */
  async save(req, res) {
    let id, inst
    try {
      let [values, related] = await this.convertValues(req.body)
      id = values[this.idField]
      if (!id) delete values[this.idField]
      inst = await (id
            ? this._doUpdate(id, values)
            : this._doCreate(values))

      if (related) {
        inst = await this._doRelatedUpdate(inst, related)
      }

      req.flash('info', this.displayName + " saved")
    } catch(e) {
      this.log.error(e.toString())
      req.flash('error', "Error saving "+this.displayName+": "+e)
    }

    if (this.redirect) {
      res.redirect(this.routeForRequest(req,
          this.routePrefix + (id ? this.redirectAfterEdit : this.redirectAfterCreate),
          inst))
    }
  }

  convertValues(values) {
    return this._modelAttributes(false).then((attrs) => {
      let relatedValues = {}
      attrs.forEach((attr) => {
        if(attr.type == 'boolean') values[attr.name] = (typeof values[attr.name] != 'undefined' && !!values[attr.name])
        if(attr.type == 'array' && _.isString(values[attr.name])) {
          values[attr.name] = values[attr.name].split('\r\n')
        }
        try {
          if(attr.type == 'json' || attr.type == 'mixed') values[attr.name] = JSON.parse(values[attr.name])
        } catch (e) {
          this.log.error("Error processing json or mixed value of " + attr.name, e)
          delete values[attr.name]
        }
        if(attr.type == 'related-many') {
          relatedValues[attr.name] = _.isArray(values[attr.name]) ? values[attr.name] : [values[attr.name]]
          delete values[attr.name]
        }
      })
      return [values, relatedValues]
    })
  }

  async remove(req, res) {
    let inst
    try {
      inst = await this._doRemove(req.params.id)
      req.flash('info', this.displayName + " deleted")
    } catch(e) {
      this.log.error(e)
      req.flash('error', "Error deleting "+this.displayName+": "+e)
    }
    if (this.redirect) {
      res.redirect(this.routeForRequest(req,
          this.routePrefix + this.redirectAfterDelete,
          inst))
    }
  }
}

export default EditController
