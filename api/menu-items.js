const express = require('express')
const menuItemsRouter = express.Router({mergeParams: true})

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    const menuItemSQL = `SELECT * FROM MenuItem WHERE id = $menuItemId`
    
    db.get(menuItemSQL, { $menuItemId: menuItemId }, (error, menuItem) => {
        if (error) {
            next(error)
        } else if (!menuItem) {
            res.sendStatus(404)
        } else {
            req.menuItem = menuItem
            next()
        }
    })
})

menuItemsRouter.get('/', (req, res, next) => {
    const menuItemSQL = 'SELECT * FROM MenuItem WHERE menu_id = $menuId'
    const menuId = req.params.menuId

    db.all(menuItemSQL, { $menuId: menuId }, (error, menuItems) => {
        if (error) {
            next(error)
        } else {
            res.status(200).json({menuItems: menuItems})
        }
    }) 
})


menuItemsRouter.post('/', (req, res, next) => {
    const { name, description, inventory, price } = req.body.menuItem
    const menuId = req.params.menuId

    //If any required fields are missing, returns a 400 response
    if (!(name && description && inventory && price)) {
        return res.sendStatus(400)
    }

    //Insert the menu's new item to the database
    const menuItemSQL = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
                        VALUES ($name, $description, $inventory, $price, $menuId)`
    db.run(menuItemSQL, {
        $name: name,
        $description: description,
        $inventory: inventory,
        $price: price,
        $menuId: menuId
    }, function (error) {
        if (error) {
            next(error)
        } else { //Returns a 201 response with the newly-created menuItem on the menuItem property of the response body
            db.get('SELECT * FROM MenuItem WHERE id = $id', { $id: this.lastID }, (error, menuItem) => {
                if (error) {
                    next(error)
                } else {
                    res.status(201).json({menuItem: menuItem})
                }
            })
        }
    })
})


menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    const { name, description, inventory, price } = req.body.menuItem
    const menuId = req.params.menuId
    const menuItemId = req.params.menuItemId

    //If any required fields are missing, returns a 400 response
    if (!(name && description && inventory && price)) {
        return res.sendStatus(400)
    }

    //Update the nenu's menuItem to the database
    const menuItemSQL =   `UPDATE MenuItem
                            SET name = $name,
                                description = $description,
                                inventory = $inventory,
                                price = $price,
                                menu_id = $menuId
                            WHERE id = $menuItemId`
    db.run(menuItemSQL, {
        $name: name,
        $description: description,
        $inventory: inventory,
        $price: price,
        $menuId: menuId,
        $menuItemId: menuItemId
    }, (error) => {
        if (error) {
            next(error)
        } else { //Returns a 201 response with the updated menuItem on the menuItem property of the response body
            db.get('SELECT * FROM MenuItem WHERE id = $menuItemId', { $menuItemId: menuItemId }, (error, menuItem) => {
                if (error) {
                    next(error)
                } else {
                    res.status(200).json({menuItem: menuItem})
                }
            })
        }
    })
})


menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    const menuItemSQL = 'DELETE FROM MenuItem WHERE id = $menuItemId'
    const menuItemId = req.params.menuItemId

    db.run(menuItemSQL, { $menuItemId: menuItemId }, (error) => {
        if (error) {
            next(error)
        } else {
            res.sendStatus(204)
        }
    })
})

module.exports = menuItemsRouter