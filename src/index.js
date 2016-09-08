import {NxusModule} from 'nxus-core'
import {templater} from 'nxus-templater'
import MVCModule from './MVCModule'
import ViewController from './ViewController'
import EditController from './EditController'

class Web extends NxusModule {
  constructor() {
    super()

    // Expose base controller templates at global names
    templater.default().templateDir(__dirname+"/templates/*.ejs", "page")
    templater.default().templateDir(__dirname+"/templates/form-inputs/*.ejs")
  }
}

let web = Web.getProxy()
export {Web as default, web, MVCModule, ViewController, EditController}
