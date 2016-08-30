import {application, NxusModule} from 'nxus-core'
import router from 'nxus-router'
import templater from 'nxus-templater'

class WebDefaultErrorPages extends NxusModule {

  constructor() {
    super()

    application.once('launch', () => {
      router.middleware(::this._notFoundHandler)
      router.middleware(::this._errorHandler)
    })
  }

  _notFoundHandler(req, res, next) {
    templater.render('404', {opts: app.config, req, user: req.user}).then((body) => {
      res.status(404).send(body)
      next()
    })
  }
  
  _errorHandler(err, req, res, next) {
    templater.render('500', {opts: this.app.config, req, user: req.user}).then((body) => {
      res.status(500).send(body)
    })  
  }
}
