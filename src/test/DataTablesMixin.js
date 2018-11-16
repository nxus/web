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
    it("should have defaults for script paths", () => {
      let t = new DTThing()
      t.useDataTablesEnableScript.endsWith("templates/datatables-enable.js").should.be.true
      t.useDataTablesURL[0].endsWith("jquery.dataTables.js").should.be.true
    })
    it("should use passed options for script paths", () => {
      let t = new DTThing({
        useDataTablesEnableScript: 'path',
        useDataTablesURL: ['url', 'url2']
      })
      t.useDataTablesEnableScript.should.equal('path')
      t.useDataTablesURL[0].should.equal("url")
      t.useDataTablesURL[1].should.equal("url2")
    })
  })

})
