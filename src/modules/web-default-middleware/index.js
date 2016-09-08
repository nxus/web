import {application, NxusModule} from 'nxus-core'
import {router} from 'nxus-router'
import flash from 'connect-flash'

class WebDefaultMiddleware extends NxusModule {

  constructor() {
    super()
    
    router.middleware(flash())
  }
}

let webDefaultMiddleware = WebDefaultMiddleware.getProxy()
export {WebDefaultMiddleware as default, webDefaultMiddleware}
