# nxus-web

## REGEX_FILE

A base class for common application module organization

Automatically registers:

-   Templates from `./templates`
-   Models from `./models` - these files should extend `nxus-storage.BaseModel`)
-   Controllers from `./controllers` - you may want to extend `nxus-web.ViewController`

## ViewController

**Extends HasModels**

A base class for CRUD routes and templates for a model

## Parameters

You can pass any of the following into the constructor options argument:

-   `modelIdentity` - defaults to name of class, underscored, e.g. `todo_item`
-   `prefix` - defaults to name of class, dashed, e.g. `todo-item`
-   `templatePrefix` - defaults to parent containing directory (module) + `prefix`, e.g. `mymodule-todo-item-`
-   `routePrefix` - defaults to '/'+`prefix`
-   `pageTemplate` - the layout to use to render the page
-   `populate` - relationships to populate on find
-   `displayName` - defaults to class name
-   `instanceTitleField` - defaults to first attribute
-   `paginationOptions` - object with `sortField`, `sortDirection`, and `itemsPerPage` keys.
-   `ignoreFields` - blacklist of fields to ignore in display
-   `displayFields` - whitelist of fields to display
-   `idField` - field to use for id in routes

## Implement Routes

The default implementation of the routes handles querying for the model instance, pagination, and the template rendering. See the specific method documentation for each public view function.

### list

Implement the list route. Resolve the passed query and return the context for template `templatePrefix-list`

**Parameters**

-   `req` **[Request](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/request)** The express request object
-   `res` **[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)** The express response object
-   `query` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** A query that can be further filtered or populated before resolution

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The context for template rendering. Include `pagination: this.paginationOptions` by default

### detail

Implement the view/detail route. Resolve the passed query and return the
context for template `templatePrefix-view`

**Parameters**

-   `req` **[Request](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/request)** The express request object
-   `res` **[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)** The express response object
-   `query` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** A query for one object that can be further populated before resolution

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The context for template rendering.

## EditController

**Extends ViewController**

A base class for CRUD routes and templates for a model

## Parameters

 See Controller docs

## Implement Routes

The default implementation of the routes handles querying for the model instance, pagination, and the template rendering. See the specific method documentation for each public view function.

### edit

Implement the edit route. Resolve the passed query and return the context for template `templatePrefix-edit`

**Parameters**

-   `req` **[Request](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/request)** The express request object
-   `res` **[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)** The express response object
-   `query` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** A query that can be further filtered or populated before resolution

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The context for template rendering.

### create

Implement the create route. Return the context for template `templatePrefix-create`

**Parameters**

-   `req` **[Request](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/request)** The express request object
-   `res` **[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)** The express response object
-   `object` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An empty object for setting defaults for the template

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The context for template rendering.

## add

Register a nav menu item

**Parameters**

-   `menu` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Group of nav items
-   `label` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Text for menu item
-   `link` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** URL of menu item
-   `options` **\[[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)](default {})** Extra context for rendering (icon, css)

## get

Retrieve a menu group

**Parameters**

-   `menu` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Group of nav items

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** Menu items
