import {application, NxusModule} from 'nxus-core'
import {router} from 'nxus-router'
import {templater} from 'nxus-templater'

class WebDefaultErrorPages extends NxusModule {

  constructor() {
    super()
    application.onceAfter('launch', () => {
      router.replace().middleware(::this._notFoundHandler)
      router.replace().middleware(::this._errorHandler)
    })
  }

  _notFoundHandler(req, res, next) {
    templater.render('404', {opts: application.config, req, user: req.user}).then((body) => {
      res.status(404).send(body)
      next()
    })
  }
  
  _errorHandler(err, req, res, next) {
    templater.render('500', {opts: application.config, req, user: req.user}).then((body) => {
      this.log.error(err)
      res.status(500).send(body)
      next()
    })  
  }
}

let webDefaultErrorPages = WebDefaultErrorPages.getProxy()
export {WebDefaultErrorPages as default, webDefaultErrorPages}
