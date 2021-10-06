const express = require('express')
const menusRouter = express.Router()

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

const menuItemsRouter = require('./menu-items')

menusRouter.param('menuId', (req, res, next, menuId) => {
    const menuSQL = 'SELECT * FROM Menu WHERE id = $menuId'
    db.get(menuSQL, { $menuId: menuId }, (error, menu) => {
        if (error) {
            next(error)
        } else if (!menu) { //Menu does not exist
            res.sendStatus(404)
        } else {
            req.menu = menu
            next()
        }
    })
})

menusRouter.use('/:menuId/menu-items', menuItemsRouter)

menusRouter.get('/', (req, res, next) => {
    const menuSQL = 'SELECT * FROM Menu'
    db.all(menuSQL, (error, menus) => {
        if (error) {
            next(error)
        } else {
            res.status(200).json({menus: menus})
        }
    }) 
})

menusRouter.post('/', (req, res, next) => {
    const { title } = req.body.menu

    //If any required fields are missing, returns a 400 response
    if (!(title)) {
        return res.sendStatus(400)
    }

    //Insert the menu to the database
    const menuSQL = `INSERT INTO Menu (title)
                    VALUES ($title)`
    db.run(menuSQL, { $title: title }, function (error) {
        if (error) {
            next(error)
        } else { //Returns a 201 response with the newly-created menu on the menu property of the response body
            db.get('SELECT * FROM Menu WHERE id = $id', { $id: this.lastID }, (error, menu) => {
                if (error) {
                    next(error)
                } else {
                    res.status(201).json({menu: menu})
                }
            })
        }
    })
})


menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({menu: req.menu})
})

menusRouter.put('/:menuId', (req, res, next) => {
    const { title } = req.body.menu
    const menuId = req.params.menuId

    //If any required fields are missing, returns a 400 response
    if (!(title)) {
        return res.sendStatus(400)
    }

    //Insert the employee to the database
    const menuSQL = `UPDATE Menu 
                    SET title = $title
                    WHERE id = $menuId`
    db.run(menuSQL, {
        $title: title,
        $menuId: menuId
    }, (error) => {
        if (error) {
            next(error)
        } else { //Returns a 201 response with the newly-created menu on the menu property of the response body
            db.get('SELECT * FROM Menu WHERE id = $id', { $id: menuId }, (error, menu) => {
                if (error) {
                    next(error)
                } else {
                    res.status(200).json({menu: menu})
                }
            })
        }
    })
})


menusRouter.delete('/:menuId', (req, res, next) => {
    const menuItemSQL = 'SELECT * FROM MenuItem WHERE menu_id = $menuId'
    const menuId = req.params.menuId

    db.get(menuItemSQL, { $menuId: menuId }, (error, menuItem) => {
        if (error) {
            next(error)
        } else if (menuItem) { //If the menu with the supplied menu ID has related menu items, returns a 400 response.
            res.sendStatus(400)
        } else {
            const menuSQL = 'DELETE FROM Menu WHERE id = $menuId'
            db.run(menuSQL, { $menuId: menuId }, (error) => {
                if (error) {
                    next(error)
                } else {
                    res.sendStatus(204)
                }
            })
        }
    })
})


module.exports = menusRouter