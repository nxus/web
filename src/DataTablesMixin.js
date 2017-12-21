import {router} from 'nxus-router'
import {templater} from 'nxus-templater'
import {actions} from './modules/web-actions'
import Promise from 'bluebird'

/**
 * A mixin class for ViewController or subclasses to support jQuery DataTables (https://datatables.net)
 *
 * Supports either client-side data (overriding normal pagination queries) or server-side processing (providing an ajax endpoint compatible with datatables API).
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
 */

let DataTablesMixin = (superclass) => class extends(superclass) {
  constructor(opts={}) {
    super(opts)
    
    templater.on(`renderContext.${this.templatePrefix}-list`, () => {
      return {
        scripts: ['//cdn.datatables.net/1.10.16/js/jquery.dataTables.js']
      }
    })
    templater.replace().template(__dirname+"/templates/web-controller-datatables-list.ejs", this.pageTemplate, this.templatePrefix+'-list')

    try {
      var clientjs = require('nxus-clientjs').clientjs
    } catch (e) {
      this.log.error("nxus-web DataTablesMixin: nxus-clientjs not installed\n\nYou will need to include nxus-web/lib/templates/datatables-enable.js manually in your template output after jquery")
    }
    if (clientjs){
      clientjs.includeScript(this.templatePrefix+"-list", __dirname+"/templates/datatables-enable.js")
    }

    if (opts.useDataTablesAjax) {
      this._datatableAjaxRoute = this.routePrefix+'/dt-query'
      router.route('get', this._datatableAjaxRoute, ::this._datatableAjax)
    }
  }

  defaultContext() {
    return super.defaultContext(...arguments).then((context) => {
      context.datatableAjaxRoute = this._datatableAjaxRoute
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
    let fields = this.listFields.length > 0 ? this.listFields : this.displayFields

    // remap datatables query params to ViewController fields
    req.query.items = parseInt(req.query.length)
    req.query.page = (parseInt(req.query.start)/req.query.items) + 1
    req.query.sort = fields[parseInt(req.query.order.column)]
    req.query.dir = req.query.order.dir
    req.query.search = req.query.search.value

    let objects = await this._find(req)

    let count = await this._count({query: {}})
    let countFiltered = count
    if (req.query.search) {
      countFiltered = await this._count(req)
    }
    

    let acts = await actions.getActions(this.templatePrefix+"-list")
    objects = await Promise.map(objects, async (x) => {
      let r = {id: x[this.idField], actions: "<i>Hi</i>"}
      r.actions = await templater.render('actions-icons', {actions: acts.instance, makeActionUrl: (l) => {this.routePrefix + l + r.id}})
      for (let k of fields) {
        r[k] = x[k]
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

}

export default DataTablesMixin
