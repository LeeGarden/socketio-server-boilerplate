'use strict'

const events = require('../constants/events')
const format = require('string-format')
const routes = require('../constants/apis')
const _ = require('underscore')

module.exports = class AppHandler {
    constructor(socket, io, axiosClient) {
        this.socket = socket
        this.io = io
        this.axiosClient = axiosClient
        this.handler()
    }

    handler() {
        // Handle your logic at here
    }
}
