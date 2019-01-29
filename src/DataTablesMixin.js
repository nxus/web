import {router} from 'nxus-router'
import {templater} from 'nxus-templater'
import {actions} from './modules/web-actions'
import Promise from 'bluebird'

import {isArray} from 'underscore'

/**
 * A mixin class for ViewController or subclasses to support jQuery DataTables (https://datatables.net)
 *
 * Supports either client-side data (overriding normal pagination queries) or server-side processing (providing an ajax endpoint compatible with datatables API).
 *
 * Options:
 *  * `useDataTablesAjax` - (false) whether server-side ajax should be used to populate, page, and query the data
 *  * `useDataTablesCSS` - (cdn css url, or array of urls) some themes already include datatables support, if so set this to false
 *  * `useDataTablesURL` - (cdn script url, or array of urls) to override the default cdn URL
 *  * `useDataTablesEnableScript` - (path to js) to override initialization script to include
 *
 * Client-side processing is the default:
 *
 * ```
 *   import {DataTablesMixin, EditController} from 'nxus-web
 *   class MyView extends DataTablesMixin(EditController) {
 *      // usual EditController options like model, displayFields
 *   }
 * ```
 *
 * Set the `useDataTablesAjax` option to true for large datasets or server-side search logic etc.
 *
 * ```
 *   import {DataTablesMixin, EditController} from 'nxus-web
 *   class MyView extends DataTablesMixin(EditController) {
 *       constructor(options={}) {
 *          // usual EditController options like model, displayFields
 *          options.useDataTablesAjax = true
 *          super(options)
 *      }
 *   }
 * ```
 *
 * The `useDataTablesCSS`, `useDataTablesURL`, and `useDataTablesEnableScript` are needed for enabling additional
 * extensions, e.g. to use Datatables.select:
 * ```
 *   class MyView extends DataTablesMixin(EditController) {
 *       constructor(options={}) {
 *          options.useDataTablesURL = [
 *            "//cdn.datatables.net/1.10.19/js/jquery.dataTables.min.js",
 *            "//cdn.datatables.net/select/1.2.7/js/dataTables.select.min.js"
 *          ]
 *          options.useDataTablesCSS = [
 *            "//cdn.datatables.net/1.10.19/css/jquery.dataTables.min.css",
 *            "//cdn.datatables.net/select/1.2.7/css/select.dataTables.min.css"
 *          ]
 *          // this file in your project would include `$('.datatable).DataTable({select: true})` etc
 *          options.useDataTablesEnableScript = __dirname+"/components/my-datatables-enable.js"
 *          super(options)
 *      }
 *   }
 * 
 * ```
 * 
 */

let DataTablesMixin = (superclass) => class extends(superclass) {
  constructor(opts={}) {
    super(opts)

    this.useDataTablesAjax = opts.useDataTablesAjax || false
    this.useDataTablesURL = opts.useDataTablesURL || '//cdn.datatables.net/1.10.16/js/jquery.dataTables.min.js'
    if (!isArray(this.useDataTablesURL)) {
      this.useDataTablesURL = [this.useDataTablesURL]
    }
    this.useDataTablesCSS = ['//cdn.datatables.net/1.10.16/css/jquery.dataTables.min.css']
    if (opts.useDataTablesCSS == false) {
      this.useDataTablesCSS = []
    }
    if (isArray(opts.useDataTablesCSS)) {
      this.useDataTablesCSS = opts.useDataTablesCSS
    }
    this.useDataTablesEnableScript = opts.useDataTablesEnableScript || __dirname+"/templates/datatables-enable.js"
    
    templater.on(`renderContext.${this.templatePrefix}-list`, () => {
      return {
        scripts: this.useDataTablesURL
      }
    })
    templater.replace().template(__dirname+"/templates/web-controller-datatables-list.ejs", this.pageTemplate, this.templatePrefix+'-list')

    try {
      var clientjs = require('nxus-clientjs').clientjs
    } catch (e) {
      this.log.error("nxus-web DataTablesMixin: nxus-clientjs not installed\n\nYou will need to include nxus-web/lib/templates/datatables-enable.js manually in your template output after jquery")
    }
    if (clientjs){
      clientjs.includeScript(this.templatePrefix+"-list", this.useDataTablesEnableScript)
    }

    if (this.useDataTablesAjax) {
      this._datatableAjaxRoute = this.routePrefix+'/dt-query'
      router.route('get', this._datatableAjaxRoute, ::this._datatableAjax)
    }
  }

  defaultContext() {
    return super.defaultContext(...arguments).then((context) => {
      context.datatableAjaxRoute = this._datatableAjaxRoute
      context.useDataTablesCSS = this.useDataTablesCSS
      return context
    })
  }

  _paginationState(req) {
    let ret = super._paginationState(req)
    if (!this.useDataTablesAjax) {
      ret.itemsPerPage = 0
      ret.currentPage = 1
    }
    return ret
  }
  
  /* Handle datatables server-side processing ajax requests */
  async _datatableAjax(req, res) {
    req = this._datatablesModifyQuery(req)
    
    let objects = await this._find(req)
    req._old_query = req.query
    req.query = {}
    let count = await this._count(req)
    let countFiltered = count
    if (req.query.search) {
      req.query = req._old_query
      countFiltered = await this._count(req)
    }
    
    let fields = this._datatablesColumnFields()
    
    let acts = await actions.getActions(this.templatePrefix+"-list")
    objects = await Promise.map(objects, async (x) => {
      let r = {id: x[this.idField], actions: ""}
      for (let k of fields) {
        r[k] = x[k]
      }
      r.actions = await templater.render('actions-icons', {actions: acts.instance, makeActionUrl: ::this._datatablesMakeActionUrl(r)})
      // Format title field as link to detail
      if (this.instanceTitleField) {
        r[this.instanceTitleField] = `<a href="${this.routePrefix}${this.routeDetail}/${r.id}">${r[this.instanceTitleField]}</a>`
      }
      
      return r
    })
    res.send({
      data: objects,
      draw: parseInt(req.query.draw),
      recordsTotal: count,
      recordsFiltered: countFiltered
    })
  }

  _datatablesColumnFields() {
    return this.listFields.length > 0 ? this.listFields : this.displayFields
  }

  _datatablesModifyQuery(req) {
    let fields = this._datatablesColumnFields()
    // remap datatables query params to ViewController fields
    req.query.items = parseInt(req.query.length)
    req.query.page = (parseInt(req.query.start)/req.query.items) + 1
    if (req.query.order && req.query.order.length > 0) {
      req.query.sort = fields[parseInt(req.query.order[0].column)]
      req.query.dir = req.query.order[0].dir
    }
    if (req.query.search) {
      req.query.search = req.query.search.value
    }
    return req
  }
  
  _datatablesMakeActionUrl (r) {
    return (l) => { return this.routePrefix + l + r.id }
  }
  
}

export default DataTablesMixin
