import Promise from 'bluebird'
import path from 'path'
import fs_ from 'fs'
const fs = Promise.promisifyAll(fs_);

import {application} from 'nxus-core'
import {templater} from 'nxus-templater'
import {router} from 'nxus-router'
import {storage, HasModels} from 'nxus-storage'

const REGEX_FILE = /[^\/\~]$/;

/**
 * 
 * 
 * A base class for common application module organization
 * 
 * Automatically registers:
 *
 *  * Templates from `./templates`
 *  * Models from `./models` - these files should extend `nxus-storage.BaseModel`)
 *  * Controllers from `./controllers` - you may want to extend `nxus-web.ViewController` 
 *
 */

class MVCModule extends HasModels {

  constructor(options={}) {
    super(options)

    this._controllers = []
    this._pageTemplate = options.pageTemplate || "page"
    
    templater.templateDir(this._dirName+"/templates/*.ejs", this._pageTemplate)

    application.onceAfter('init', ::this._loadControllers)
  }

  _loadControllers() {
    let dir = this._dirName+"/controllers"
    this.log.debug("Loading controllers from", dir)
    try {
      fs.accessSync(dir);
    } catch (e) {
      return;
    }
    return fs.readdirAsync(dir).each((file) => {
      if (REGEX_FILE.test(file)) {
        this.log.debug("Loading controller", this.__name, file)
        let m = require(path.join(dir, file))
        if (m.default) {
          m = m.default
        }
        this._controllers.push(new m())
      }
    })
  }
  
}

export default MVCModule
