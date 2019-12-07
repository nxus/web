import {NxusModule, application} from 'nxus-core'
import {templater} from 'nxus-templater'
import {router} from 'nxus-router'
import MVCModule from './MVCModule'
import ViewController from './ViewController'
import EditController from './EditController'
import DataTablesMixin from './DataTablesMixin'
import {default as Nav, nav} from './modules/web-nav'
import {default as Actions, actions} from './modules/web-actions'


class Web extends NxusModule {
  constructor() {
    super()

    // Expose base controller templates at global names
    templater.default().templateDir(__dirname+"/templates/*.ejs")
    templater.default().templateDir(__dirname+"/templates/form-inputs/*.ejs")

    application.onceAfter('startup', () => {
      templater.on('renderContext.admin-page', (opts) => {
        return {
          styles: [
            '/assets/web/edit/datetimepicker/build/jquery.datetimepicker.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.8/css/select2.min.css'
          ],
          scripts: [
            '/assets/web/edit/datetimepicker/build/jquery.datetimepicker.full.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.8/js/select2.min.js'
          ]
        }
      })
    })

    router.staticRoute("/assets/web/edit/datetimepicker", __dirname+"/assets/datetimepicker")

  }
}

let web = Web.getProxy()
export {
  Web as default, web,
  MVCModule, ViewController, EditController,
  DataTablesMixin,
  nav, Nav,
  actions, Actions
}
