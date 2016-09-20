
import {NxusModule} from 'nxus-core'
import {templater} from 'nxus-templater'
import morph from 'morph'
import _ from 'underscore'

class Nav extends NxusModule {

  constructor() {
    super()
    this._menus = {}

    templater.template(__dirname+'/templates/nav-menu.ejs')

    templater.on('renderContext', () => {
      return {
        navMenus: this._menus
      }
    })
  }
  
  /**
   * Register a nav menu item
   * @param {string} menu    Group of nav items
   * @param {string} label   Text for menu item
   * @param {string} link    URL of menu item
   * @param {object} options Extra context for rendering (icon, css)
   */
  add(menu, label, link, options = {}) {
    this._createMenu(menu)
    if(options.subMenu) this._createMenu(options.subMenu)
    this._menus[menu].push({label, link, ...options})
  }

  /**
   * Retrieve a menu group
   * @param {string} menu     Group of nav items
   * @return {Array}          Menu items
   */
  get(menu) {
    return this._assembleMenu(menu)
  }

  _assembleMenu(root) {
    let menu = this._menus[root] || []
    let newMenu = menu.map((m) => {
      m = Object.assign({}, m)
      if(m.subMenu) m.subMenu = this._assembleMenu(m.subMenu)
      return m
    })
    newMenu = _.sortBy(newMenu, i => i.order)
    return newMenu
  }

  _createMenu(menu) {
    this.log.debug('Registering Nav Menu', menu)
    menu = morph.toDashed(menu)
    if (!this._menus[menu]) {
      this._menus[menu] = []
    }
    templater.templateFunction(menu, (opts) => {
      return templater.render('nav-menu', {menu, items: this.get(menu)})
    })
  }
}

const nav = Nav.getProxy()
export {Nav as default, nav}