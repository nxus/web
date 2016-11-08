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

  defaultContext(req, related=false) {
    return super.defaultContext(req, related).then((ret) => {
      ret.instanceUrl = this.routePrefix+"/edit"
      return ret
    })
  }

  // Routes

  _edit(req, res, next) {
    this._findOne(req).then((object) => {
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
        }).then((context) => {
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
      this.defaultContext(req)
    ]).spread((context, defaultContext) => {
      context = Object.assign(defaultContext, context)
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

  save(req, res) {
    let values = req.body
    this.convertValues(values).spread((values, related) => {
      return (values[this.idField]
      ? this.model.update(values[this.idField], values).then((is) => {return is[0]})
      : this.model.create(values)
      ).then((inst) => {
        let find = this.model.findOne(inst.id)
        for (let k in related) {
          find = find.populate(k)
        }
        return find
      }).then((inst) => {
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
        return inst.save()
      }).then((inst) => {
        req.flash('info', this.displayName + " saved")
        res.redirect(this.routePrefix)
      })
    }).catch((e) => {
      this.log.error(e)
      req.flash('error', "Error saving "+this.displayName+": "+e)
      if (values.id) {
        res.redirect(this.routePrefix+"/edit/"+values[this.idField])
      } else {
        res.redirect(this.routePrefix+"/create")
      }
    }) 
  }

  convertValues(values) {
    return this._modelAttributes(false).then((attrs) => {
      let relatedValues = {}
      attrs.forEach((attr) => {
        if(attr.type == 'boolean') values[attr.name] = (typeof values[attr.name] != 'undefined' && values[attr.name])
        if(attr.type == 'array' && _.isString(values[attr.name])) {
          values[attr.name] = values[attr.name].split(',')
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
  
  remove(req, res) {
    return this.model.destroy(req.params.id).then((inst) => {
      req.flash('info', this.displayName + " deleted")
      return res.redirect(this.routePrefix)
    })
  }  
}

export default EditController
