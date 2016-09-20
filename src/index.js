import {NxusModule} from 'nxus-core'
import {templater} from 'nxus-templater'
import MVCModule from './MVCModule'
import ViewController from './ViewController'
import EditController from './EditController'

import {default as Nav, nav} from './modules/web-nav'

class Web extends NxusModule {
  constructor() {
    super()

    // Expose base controller templates at global names
    templater.default().templateDir(__dirname+"/templates/*.ejs")
    templater.default().templateDir(__dirname+"/templates/form-inputs/*.ejs")
  }
}

let web = Web.getProxy()
export {Web as default, web, MVCModule, ViewController, EditController, nav, Nav}
