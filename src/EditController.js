import morph from 'morph'
import _ from 'underscore'
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
 * # Implement Routes
 * 
 * The default implementation of the routes handles querying for the model instance, pagination, and the template rendering. See the specific method documentation for each public view function.
 * 
 *
 */

class EditController extends ViewController {
  constructor(options) {
    super(options)

    let routePrefix = this.routePrefix
    router.route(routePrefix+"/create", ::this._create)
    router.route(routePrefix+"/edit/:id", ::this._edit)
    router.route("POST", routePrefix+"/create", ::this.save)
    router.route("POST", routePrefix+"/edit/:id", ::this.save)
    router.route("POST", routePrefix+"/delete/:id", ::this.remove)

    // Yes, these should be __dirname not local to the subclass
    // Subclass templates are expected to be loaded by MVCModule or manually?
    templater.default().template(__dirname+"/templates/web-controller-form.ejs", this.pageTemplate, this.templatePrefix+"-create")
    templater.default().template(__dirname+"/templates/web-controller-form.ejs", this.pageTemplate, this.templatePrefix+"-edit")
    templater.default().template(__dirname+"/templates/web-controller-paginator.ejs")
  }

  defaultContext(req) {
    let ret = super.defaultContext(req)
    ret.instanceUrl = this.routePrefix+"/edit"
    return ret
  }

  // Routes

  _edit(req, res, next) {
    this._findOne(req).then((object) => {
      if (!object) {
        res.status(404)
        next()
      } else {
        Promise.resolve(this.edit(req, res, this._findOne(req))).then((context) => {
          return this.defaultContext(req).then((defaultContext) => {
            context = Object.assign(defaultContext, context)
            return templater.render(this.templatePrefix+"-edit", context).then(::res.send)
          })
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
    Promise.resolve(this.create(req, res, {})).then((context) => {
      return this.defaultContext(req).then((defaultContext) => {
        context = Object.assign(defaultContext, context)
        return templater.render(this.templatePrefix+"-create", context).then(::res.send)
      })
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

  save(req, res) {
    let values = req.body
    this._convertValues(values).then((values) => { 
      let promise = values[this.idField]
        ? this.model.update(values[this.idField], values)
        : this.model.create(values)
      promise.then((inst) => {
        req.flash('info', this.displayName + " saved")
        res.redirect(this.routePrefix)
      }).catch((e) => {
        this.log.error(e)
        req.flash('error', "Error saving "+this.displayName+": "+e)
        if (values.id) {
          res.redirect(this.routePrefix+"/edit/"+values[this.idField])
        } else {
          res.redirect(this.routePrefix+"/create")
        }
      }) 
    })
  }

  _convertValues(values) {
    return this._modelAttributes().then((attrs) => {
      attrs.forEach((attr) => {
        if(attr.type == 'boolean') values[attr.name] = (typeof values[attr.name] != 'undefined')
        if(attr.type == 'array') {
          values[attr.name] = values[attr.name].split(',')
        }
        try {
          if(attr.type == 'json' || attr.type == 'mixed') values[attr.name] = JSON.parse(values[attr.name])
        } catch (e) {
          this.log.error("Error processing json or mixed value of " + attr.name, e)
          delete values[attr.name]
        }
      })
      return values
    })
  }
  
  remove(req, res) {
    return this.model.destroy(req.params.id).then((inst) => {
      req.flash('info', this.displayName + " deleted")
      return res.redirect(this.routePrefix)
    })
  }  
}

export default EditController
