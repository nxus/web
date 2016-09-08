import {NxusModule} from 'nxus-core'
import MVCModule from './MVCModule'
import ViewController from './ViewController'
import EditController from './EditController'

class Web extends NxusModule {
  constructor() {
    super()
  }
}

let web = Web.getProxy()
export {Web as default, web, MVCModule, ViewController, EditController}
