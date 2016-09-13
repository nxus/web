/*
* @Author: mike
* @Date:   2016-09-12 09:58:13
* @Last Modified 2016-09-12
* @Last Modified time: 2016-09-12 10:20:13
*/

'use strict';

import {application, NxusModule} from 'nxus-core'
import {router} from 'nxus-router'
import {templater} from 'nxus-templater'
import flash from 'connect-flash'

class WebReqMiddleware extends NxusModule {
  constructor() {
    super()

    this._req = null
    
    router.middleware((req, res, next) => {
      this._req = req
      next()
    })

    templater.on('renderContext', () => {
      return {req: this._req}
    })
  }
}

let webReqMiddleware = WebReqMiddleware.getProxy()
export {WebReqMiddleware as default, webReqMiddleware}
