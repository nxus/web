import {NxusModule} from 'nxus-core'
import {templater} from 'nxus-templater'
import _ from 'underscore'

/*
 * # API
 * Example adding a link button to the template 'template-name':
 * ```actions.add('template-name', 'Label', '/link' {icon: 'fa fa-plus'})```
 * 
 * Retrieving actions for use (normally not needed, automatically added to template context as 'actions)
 * ```actions.getActions('template-name')```
 * 
 * You may additionally group actions together by providing a 'group' key to the options object. 
 *
 * # Templates
 *
 * This module provides four templates that may be overridden:
 *  * `actions-buttons` to render an action group as buttons
 *  * `actions-button` the default template for each button
 *  * `actions-icons` to render an action group as minimal icons
 *  * `actions-icon` the default templateMinimal for each icon
 *  
 *  Rather than overriding all buttons/icons, you may provide a custom template for a specific action as the `template` or `templateMinimal` option. When rendered with the default `actions-buttons` or `actions-icons` templates, these receive an action's object as their only context.
 *  
 */


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
    this.log.debug("Adding action", label, link, "for", template)
    if(!this._actions[template]) {
      this._actions[template] = []
      templater.on('renderContext.'+template, (args) => {
        return {'actions': this._getActions(template)}
      })
    }
    if(!options.group) options.group = 'default'
    if(!options.displayClass) options.displayClass = ''
    if(!options.icon) options.icon = ''
    if(!options.template) {
      options.template = 'actions-button'
    }
    if (!options.templateMinimal) {
      options.templateMinimal = 'actions-icon'
    }
    this._actions[template].push({
      label,
      link,
      ...options
    })
  }

  /*
   * Returns actions for a given template
   * @param {String} template
   * @returns {Object} Action objects grouped by optional group names
   */
  getActions(template) {
    return this._getActions(template)
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
