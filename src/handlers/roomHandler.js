'use strict'

const WebHandler = require('./webHandler')
const AppHandler = require('./appHandler')
const AxiosHelper = require('../helpers/axios.js')
const format = require('string-format')
const routes = require('../constants/apis')
const events = require('../constants/events')
const serverComponent = require('../components/serverComponent')

module.exports = class RoomHandler {
    constructor(socket, io) {
        this.socket = socket
        this.io = io
        this.socket.component = {}
        this.serverComponent = new serverComponent()
    }

    requestRoom(data) {
        this.socket.component = {}
        this.socket.component.server = this.serverComponent
        this.axiosClient = new AxiosHelper()

        if (type === 'web') {
            this.socket.emit(events.REQUEST_ROOM_SUCCEED_WEB, response.data.data.id)
            new WebHandler(this.socket, this.io, this.axiosClient)
        } else if (type === 'app') {
            this.socket.emit(events.REQUEST_ROOM_SUCCEED_APP, response.data.data.id)
            new AppHandler(this.socket, this.io, this.axiosClient)
        }
    }
}
