import {application, NxusModule} from 'nxus-core'
import {router} from 'nxus-router'
import flash from 'connect-flash'

export default class WebDefaultMiddleware extends NxusModule {

  constructor() {
    super()

    router.default().middleware(flash())
  }
}
