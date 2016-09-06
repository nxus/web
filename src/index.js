import {NxusModule} from 'nxus-core'
import MVCModule from './MVCModule'
import Controller from './Controller'

class Web extends NxusModule {
  
}

let web = Web.getProxy()
export {Web as default, web, MVCModule, Controller}
