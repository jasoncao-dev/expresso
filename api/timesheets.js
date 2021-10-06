const express = require('express')
const timesheetsRouter = express.Router({mergeParams: true})

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
    const timesheetSQL = `SELECT * FROM Timesheet WHERE id = $timesheetId`
    
    db.get(timesheetSQL, { $timesheetId: timesheetId }, (error, timesheet) => {
        if (error) {
            next(error)
        } else if (!timesheet) {
            res.sendStatus(404)
        } else {
            req.timesheet = timesheet
            next()
        }
    })
})

timesheetsRouter.get('/', (req, res, next) => {
    const timesheetSQL = 'SELECT * FROM Timesheet WHERE employee_id = $employeeId'
    const employeeId = req.params.employeeId

    db.all(timesheetSQL, { $employeeId: employeeId }, (error, timesheets) => {
        if (error) {
            next(error)
        } else {
            res.status(200).json({timesheets: timesheets})
        }
    }) 
})

timesheetsRouter.post('/', (req, res, next) => {
    const { hours, rate, date } = req.body.timesheet
    const employeeId = req.params.employeeId

    //If any required fields are missing, returns a 400 response
    if (!(hours && rate && date)) {
        return res.sendStatus(400)
    }

    //Insert the employee's timesheet to the database
    const timesheetSQL = `INSERT INTO Timesheet (hours, rate, date, employee_id)
                        VALUES ($hours, $rate, $date, $employeeId)`
    db.run(timesheetSQL, {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId
    }, function (error) {
        if (error) {
            next(error)
        } else { //Returns a 201 response with the newly-created timesheet on the timesheet property of the response body
            db.get('SELECT * FROM Timesheet WHERE id = $id', { $id: this.lastID }, (error, timesheet) => {
                if (error) {
                    next(error)
                } else {
                    res.status(201).json({timesheet: timesheet})
                }
            })
        }
    })
})

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    const { hours, rate, date } = req.body.timesheet
    const employeeId = req.params.employeeId
    const timesheetId = req.params.timesheetId

    //If any required fields are missing, returns a 400 response
    if (!(hours && rate && date)) {
        return res.sendStatus(400)
    }

    //Update the employee's timesheet to the database
    const timesheetSQL =   `UPDATE Timesheet
                            SET hours = $hours,
                                rate = $rate,
                                date = $date,
                                employee_id = $employeeId
                            WHERE id = $timesheetId`
    db.run(timesheetSQL, {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId,
        $timesheetId: timesheetId
    }, (error) => {
        if (error) {
            next(error)
        } else { //Returns a 201 response with the updated timesheet on the timesheet property of the response body
            db.get('SELECT * FROM Timesheet WHERE id = $timesheetId', { $timesheetId: timesheetId }, (error, timesheet) => {
                if (error) {
                    next(error)
                } else {
                    res.status(200).json({timesheet: timesheet})
                }
            })
        }
    })
})

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    const timesheetSQL = 'DELETE FROM Timesheet WHERE id = $timesheetId'
    const timesheetId = req.params.timesheetId

    db.run(timesheetSQL, { $timesheetId: timesheetId }, (error) => {
        if (error) {
            next(error)
        } else {
            res.sendStatus(204)
        }
    })
})

module.exports = timesheetsRouter