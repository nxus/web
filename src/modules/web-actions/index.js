import {NxusModule} from 'nxus-core'
import {templater} from 'nxus-templater'
import _ from 'underscore'

class WebActions extends NxusModule {
  constructor(opts) {
    super(opts)
    this._actions = {}
    templater.templateDir(__dirname+"/templates/*.ejs")
    templater.on('renderContext.actions-buttons', ::this._actionsContext)
    templater.on('renderContext.actions-icons', ::this._actionsContext)
    
  }
  
  /*
   * Register an action for a template
   * @param {String} template
   * @param {String} label
   * @param {String} link
   * @param {Object} options (icon, css, group)
   */
  add(template, label, link, options) {
    if(!this._actions[template]) {
      this._actions[template] = []
      templater.on('renderContext.'+template, (args) => {
        return {'actions': this._getActions(template)}
      })
    }
    if(!options.group) options.group = 'default'
    
    this._actions[template].push({
      label,
      link,
      ...options
    })
  }

  _getActions(template) {
    let actions = this._actions[template]
    return _.groupBy(actions, 'group')
  }

  _actionsContext(args) {
    let ret = {}
    if (!args.makeActionUrl) ret.makeActionUrl = (x) => x
    return ret
  }
}

const actions = WebActions.getProxy()
export {WebActions as default, actions}
