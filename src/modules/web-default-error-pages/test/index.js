import mod from '../'

describe("Web Default Error Pages", () => {
  it("should import", () => {
    mod.should.not.be.null
  })
  it("should instantiate", () => {
    let m = new mod()
    m.should.not.be.null
  })
})
