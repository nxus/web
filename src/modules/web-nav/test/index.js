import Nav from '../'

import {templater} from 'nxus-templater'

import sinon from 'sinon'

describe("Web Nav", () => {
  var m
  describe("Load", () => {
    
    it("should import", () => {
      Nav.should.not.be.null
    })
  })

  describe("Init", () => {
    
    it("should instantiate", () => {
      m = new Nav()
      m.should.not.be.null
      m._menus.should.not.be.null
    })

    it("should provide a get method", () => {
      m.get.should.not.be.null
    })

    it("should provide an add method", () => {
      m.add.should.not.be.null
    })

  })

  describe("Create Menu", () => {
    before(() => {
      m = new Nav()
      m.add('menu', 'item', '/item')
    })
    
    it("should create a menu", () => {  
      m._menus.should.have.property('menu')
    })

    it("should add the menu item to the menu", () => {
      m._menus['menu'].length.should.equal(1)
      m._menus['menu'][0].should.have.property('label')
      m._menus['menu'][0].label.should.equal('item')
      m._menus['menu'][0].link.should.equal('/item')
    })
  })

  describe("Create SubMenu", () => {
    before(() => {
      m = new Nav()
      m.add('menu', 'item', '/item', {subMenu: 'sub'})
    })

    it("should create the submenu", () => {
      m._menus.should.have.property('sub')
      m._menus['sub'].length.should.equal(0)
    })
  })

  describe("Get SubMenu", () => {
    var menu
    before(() => {
      m = new Nav()
      m.add('menu', 'item', '/item', {subMenu: 'sub'})
      m.add('sub', 'subItem', '/sub-item')
      menu = m.get('menu')
    })

    it("should return the nested submenu", () => {
      menu.length.should.equal(1)
      menu[0].should.have.property('subMenu')
      menu[0].subMenu.should.not.be.null
      menu[0].subMenu.length.should.equal(1)
      menu[0].subMenu[0].should.have.property('label')
      menu[0].subMenu[0].label.should.equal('subItem')
      menu[0].subMenu[0].should.have.property('link')
      menu[0].subMenu[0].link.should.equal('/sub-item')
    })
  })

  describe("Get Menu", () => {
    var menu
    before(() => {
      m = new Nav()
      m.add('menu', 'item', '/item', {order: 2})
      m.add('menu', 'item3', '/item')
      m.add('menu', 'item2', '/item2', {order: 1, subMenu: 'menu1'})
      m.add('menu1', 'item', '/item')
      menu = m.get('menu')
    })

    it("should return the menu", () => {
      menu.should.exist
      menu.length.should.equal(3)
    })

    it("should sort the items based on order", () => {
      menu[0].label.should.equal('item2')
      menu[1].label.should.equal('item')
      menu[0].subMenu[0].label.should.equal('item')
    })

    it("should put items with no explicit order at the end", () => {
      menu[2].label.should.equal('item3')
    })
  })

  describe("Should Register the template", () => {
    before(() => {
      templater.templateFunction = sinon.spy()
      m = new Nav()
      m.add('menu', 'item', '/item')
    })

    it("should register a template with the menu name", () => {
      templater.templateFunction.calledWith('menu').should.be.true
    })
  })

})
