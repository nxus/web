/*
* @Author: mike
* @Date:   2016-09-12 10:01:08
* @Last Modified 2016-09-12
* @Last Modified time: 2016-09-12 10:01:17
*/

'use strict';

import mod from '../'

describe("Web Request Middleware", () => {
  it("should import", () => {
    mod.should.not.be.null
  })
  it("should instantiate", () => {
    let m = new mod()
    m.should.not.be.null
  })
})
