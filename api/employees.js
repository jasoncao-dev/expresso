const express = require('express')
const employeesRouter = express.Router()

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

const timesheetsRouter = require('./timesheets')

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
    const employeeSQL = 'SELECT * FROM Employee WHERE id = $employeeId'
    db.get(employeeSQL, { $employeeId: employeeId }, (error, employee) => {
        if (error) {
            next(error)
        } else if (!employee) { //Employee does not exist
            res.sendStatus(404)
        } else {
            req.employee = employee
            next()
        }
    })
})

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter)

employeesRouter.get('/', (req, res, next) => {
    const employeeSQL = 'SELECT * FROM Employee WHERE is_current_employee = 1'
    db.all(employeeSQL, (error, employees) => {
        if (error) {
            next(error)
        } else {
            res.status(200).json({employees: employees})
        }
    }) 
})

employeesRouter.post('/', (req, res, next) => {
    const { name, position, wage } = req.body.employee
    let { isCurrentEmployee } = req.body.employee

    //If any required fields are missing, returns a 400 response
    if (!(name && position && wage)) {
        return res.sendStatus(400)
    }

    //Make sure isCurrentlyEmployee either 0 or 1
    isCurrentEmployee = (isCurrentEmployee === 0) ? 0 : 1

    //Insert the employee to the database
    const employeeSQL = `INSERT INTO Employee (name, position, wage, is_current_employee)
                        VALUES ($name, $position, $wage, $isCurrentEmployee)`
    db.run(employeeSQL, {
        $name: name,
        $position: position,
        $wage: wage,
        $isCurrentEmployee: isCurrentEmployee
    }, function (error) {
        if (error) {
            next(error)
        } else { //Returns a 201 response with the newly-created employee on the employee property of the response body
            db.get('SELECT * FROM Employee WHERE id = $id', { $id: this.lastID }, (error, employee) => {
                if (error) {
                    next(error)
                } else {
                    res.status(201).json({employee: employee})
                }
            })
        }
    })
})

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json({employee: req.employee})
})

employeesRouter.put('/:employeeId', (req, res, next) => {
    const { name, position, wage } = req.body.employee
    let { isCurrentEmployee } = req.body.employee
    const employeeId = req.params.employeeId

    //If any required fields are missing, returns a 400 response
    if (!(name && position && wage)) {
        return res.sendStatus(400)
    }

    //Make sure isCurrentlyEmployee either 0 or 1
    isCurrentEmployee = (isCurrentEmployee === 0) ? 0 : 1

    //Insert the employee to the database
    const employeeSQL = `UPDATE Employee 
                        SET name = $name,
                            position = $position,
                            wage = $wage,
                            is_current_employee = $isCurrentEmployee
                        WHERE id = $employeeId`
    db.run(employeeSQL, {
        $name: name,
        $position: position,
        $wage: wage,
        $isCurrentEmployee: isCurrentEmployee,
        $employeeId: employeeId
    }, (error) => {
        if (error) {
            next(error)
        } else { //Returns a 201 response with the newly-created employee on the employee property of the response body
            db.get('SELECT * FROM Employee WHERE id = $id', { $id: employeeId }, (error, employee) => {
                if (error) {
                    next(error)
                } else {
                    res.status(200).json({employee: employee})
                }
            })
        }
    })
})

employeesRouter.delete('/:employeeId', (req, res, next) => {
    const employeeSQL = `UPDATE Employee
                        SET is_current_employee = 0
                        WHERE id = $employeeId`
    const employeeId = req.params.employeeId
    db.run(employeeSQL, { $employeeId: employeeId }, (error) => {
        if (error) {
            next(error)
        } else {
            db.get('SELECT * FROM Employee WHERE id = $id', { $id: employeeId }, (error, employee) => {
                if (error) {
                    next(error)
                } else {
                    res.status(200).json({employee: employee})
                }
            })
        }
    })
})

module.exports = employeesRouter