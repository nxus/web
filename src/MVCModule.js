import Promise from 'bluebird'
import path from 'path'
import fs_ from 'fs'
const fs = Promise.promisifyAll(fs_);

import {application} from 'nxus-core'
import {templater} from 'nxus-templater'
import {router} from 'nxus-router'
import {storage, HasModels} from 'nxus-storage'

/**
 * 
 * 
 * A base class for common application module organization
 * 
 * Automatically registers:
 *
 *  * Templates from `./templates`
 *  * Models from `./models` - these files should extend `nxus-storage.BaseModel`)
 *  * Controllers from `./controllers` - you may want to extend `nxus-web.Controller` 
 *
 */

class MVCModule extends HasModels {

  constructor() {
    super()

    this._model_identities = []
    
    templater.templateDir(this._dirName+"./templates")

    this._loadControllers()
  }

  _loadControllers() {
    let dir = this._dirName+"./controllers"
    try {
      fs.accessSync(dir);
    } catch (e) {
      return;
    }
    return fs.readdirAsync(dir).each((file) => {
      require(path.join(dir, file))
    })
  }  
  
}

export default MVCModule
