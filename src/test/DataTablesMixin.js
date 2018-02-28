import ViewController from '../ViewController'
import DataTablesMixin from '../DataTablesMixin'

describe("DataTablesMixin", () => {
  
  it("should not be null", () => {
    DataTablesMixin.should.not.be.null
  })

  describe("Subclassing", () => {

    class DTThing extends DataTablesMixin(ViewController) {
        
    }

    it("should nothave datatables ajax route by default", () => {
      let t = new DTThing()
      t.should.not.have.property('_datatableAjaxRoute')
    })
    it("should have datatables ajax route if true", () => {
      let t = new DTThing({useDataTablesAjax: true})
      t._datatableAjaxRoute.should.equal('/dt-thing/dt-query')
    })
  })

})
