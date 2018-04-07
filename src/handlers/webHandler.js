'use strict'

const events = require('../constants/events')
const format = require('string-format')
const routes = require('../constants/apis')

module.exports = class WebHandler {
    constructor (socket, io, axiosClient) {
        this.socket = socket
        this.io = io
        this.axiosClient = axiosClient

        this.handler()
    }

    handler () {
        let self = this

        this.socket.on(events.START_FLIGHT, function (dataClient) {
            self.callStartFlight(dataClient.flight_id)
            self.socket.broadcast.to(self.socket.room).emit(events.START_FLIGHT_TO_APP, dataClient)
        })

        this.socket.on(events.GO_HOME, function (dataClient) {
            self.callGoHome(dataClient.flight_id)
            self.socket.broadcast.to(self.socket.room).emit(events.CALL_GO_HOME_TO_APP, dataClient)
        })
    }

    callStartFlight (missionData) {
        const data = {
            plan_status: 1
        }

        this.axiosClient.request({
            url: format(routes.API_START_FLIGHT, missionData.flight_id),
            method: 'PUT',
            data: data
        }, {
            done: () => {
                console.log('Call success API_START_FLIGHT')
            },
            fail: () => {
                console.log('Error when call api API_START_FLIGHT!')
            }
        })
    }

    callGoHome (missionData) {
        const data = {
            go_home: 1
        }

        this.axiosClient.request({
            url: format(routes.API_GO_HOME_FLIGHT, missionData.flight_id),
            method: 'PUT',
            data: data
        }, {
            done: () => {
                console.log('Call success API_GO_HOME_FLIGHT')
            },
            fail: () => {
                console.log('Error when call api API_GO_HOME_FLIGHT')
            }
        })
    }
}
