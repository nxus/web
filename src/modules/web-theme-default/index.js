/* 
* @Author: Mike Reich
* @Date:   2016-02-04 16:41:53
* @Last Modified 2016-09-13
*/

'use strict';

import {application as app, NxusModule} from 'nxus-core'
import {router} from 'nxus-router'
import {templater} from 'nxus-templater'

import htmlEscape from 'html-escape'

class TemplateDefault extends NxusModule {
  constructor() {
    super()
    let dir = __dirname
    templater.default().template(dir+'/layouts/default.ejs')
    templater.default().template(dir+'/layouts/bare.ejs')
    templater.default().template(dir+'/layouts/admin.ejs')
    templater.default().template(dir+'/layouts/page.ejs', 'default')
    templater.default().template(dir+'/layouts/404.ejs', 'page')
    templater.default().template(dir+'/layouts/500.ejs', 'page')

    templater.default().templateDir(dir+'/partials')
    
    router.default().staticRoute("/assets", __dirname+"/assets")

    templater.on('renderContext', () => {
      return {
        siteName: app.config.siteName,
        escapedJSON: function(o) {
          if (o !== undefined) return htmlEscape(JSON.stringify(o))
        }
      }
    })
  }
}

let templateDefault = TemplateDefault.getProxy()
export {TemplateDefault as default, templateDefault}
