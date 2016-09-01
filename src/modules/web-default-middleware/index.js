import {application, NxusModule} from 'nxus-core'
import router from 'nxus-router'

class WebDefaultMiddleware extends NxusModule {

  constructor() {
    super()

    router.default().middleware(flash())
  )
}
